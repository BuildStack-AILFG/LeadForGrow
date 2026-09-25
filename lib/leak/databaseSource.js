/**
 * Leak Audit records for an existing LeadForGrow business (server only).
 *
 * Turns Leads + their Messages, Conversations, Activities and Tasks into the
 * normalized records lib/leak/rules.js evaluates. Read-only. Six bounded
 * queries per audit (leads, conversations, 3 aggregations, owner names), all
 * on indexed { businessId, leadId } paths, capped at MAX_LEADS.
 */
import mongoose from 'mongoose';
import Lead from '@/models/automation/Lead';
import Message from '@/models/automation/Message';
import Activity from '@/models/automation/Activity';
import Task from '@/models/automation/Task';
import User from '@/models/User';
import Conversation from '@/models/omnichannel/Conversation';
import { isAutomatedSender } from '@/lib/omnichannel/automatedSender';

export const MAX_LEADS = 5000;
const AUTO_ORIGINS = ['automation', 'sequence', 'broadcast', 'meeting', 'system'];
const NOT_SENT = ['failed', 'draft', 'scheduled'];
const BOT_REPLY_MS = 60 * 1000;
// Things a person did on the lead (calls, notes, completed follow-ups, stage moves).
// 'contacted_whatsapp' / 'email_sent' are left out: they're written for every send, bots included.
const HUMAN_ACTIVITY = ['contacted_call', 'contacted_email', 'note_added', 'follow_up_completed', 'status_changed', 'meeting_booked', 'whatsapp_sent', 'deal_stage_changed', 'deal_won', 'deal_lost', 'converted', 'lead_converted'];

const WON = new Set(['converted', 'won']);
const LOST = new Set(['lost']);
const UNQUALIFIED = new Set(['unqualified']);

function mapStatus(status) {
  if (WON.has(status)) return 'won';
  if (LOST.has(status)) return 'lost';
  if (UNQUALIFIED.has(status)) return 'unqualified';
  return 'open';
}

const minDate = (...ds) => {
  const v = ds.filter((d) => d instanceof Date && Number.isFinite(d.getTime()));
  return v.length ? new Date(Math.min(...v.map(Number))) : undefined;
};
const maxDate = (...ds) => {
  const v = ds.filter((d) => d instanceof Date && Number.isFinite(d.getTime()));
  return v.length ? new Date(Math.max(...v.map(Number))) : undefined;
};

function maskPhone(p) {
  const s = String(p || '').replace(/\s+/g, '');
  return s.length > 4 ? `${'•'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}` : s || undefined;
}

/**
 * @returns {Promise<{ records: object[], notes: string[], meta: object }>}
 */
export async function loadBusinessLeakRecords(businessId, { days = 60, now = new Date() } = {}) {
  const bizId = new mongoose.Types.ObjectId(String(businessId));
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const leads = await Lead.find({ businessId: bizId, archived: { $ne: true }, receivedAt: { $gte: since } })
    .select('name phone email source status assignedTo ownerId receivedAt createdAt lastContactedAt nextFollowUpAt')
    .sort({ receivedAt: -1 })
    .limit(MAX_LEADS + 1)
    .lean();
  const truncated = leads.length > MAX_LEADS;
  if (truncated) leads.length = MAX_LEADS;

  // Only enquiries count. Machine mail (newsletters, no-reply) that became leads
  // through the email inbox isn't a customer, and a bulk-imported contact list
  // never asked us anything; leave both out.
  const machine = leads.filter((l) => isAutomatedSender({ channel: 'email', email: l.email }));
  const imported = leads.filter((l) => l.source === 'bulk' && !isAutomatedSender({ channel: 'email', email: l.email }));
  const real = leads.filter((l) => l.source !== 'bulk' && !isAutomatedSender({ channel: 'email', email: l.email }));
  const ids = real.map((l) => l._id);

  const outgoing = { $eq: ['$direction', 'outgoing'] };
  const sent = { $not: [{ $in: ['$status', NOT_SENT] }] };
  // Old WhatsApp history stored bot replies as agent sends. Nobody types an
  // answer within a minute of the customer's message, so such replies count as
  // automated. (Conversations with first-response tracking don't rely on this.)
  const human = {
    $and: [
      { $not: [{ $in: [{ $ifNull: ['$origin', 'user'] }, AUTO_ORIGINS] }] },
      { $not: [{ $and: [{ $ne: ['$lastInSoFar', null] }, { $lt: [{ $subtract: ['$timestamp', '$lastInSoFar'] }, BOT_REPLY_MS] }] }] },
    ],
  };
  const at = '$performedAt';

  const [messages, activities, tasks, conversations, users] = await Promise.all([
    ids.length ? Message.aggregate([
      { $match: { businessId: bizId, leadId: { $in: ids }, isInternal: { $ne: true } } },
      // Latest customer message at or before each message, per lead.
      { $setWindowFields: {
        partitionBy: '$leadId',
        sortBy: { timestamp: 1 },
        output: {
          lastInSoFar: {
            $max: { $cond: [{ $eq: ['$direction', 'incoming'] }, '$timestamp', null] },
            window: { documents: ['unbounded', 'current'] },
          },
        },
      } },
      { $group: {
        _id: '$leadId',
        firstHumanOut: { $min: { $cond: [{ $and: [outgoing, sent, human] }, '$timestamp', null] } },
        firstAnyOut: { $min: { $cond: [{ $and: [outgoing, sent] }, '$timestamp', null] } },
        lastHumanOut: { $max: { $cond: [{ $and: [outgoing, sent, human] }, '$timestamp', null] } },
        lastIn: { $max: { $cond: [{ $eq: ['$direction', 'incoming'] }, '$timestamp', null] } },
        lastAny: { $max: '$timestamp' },
        humanOut: { $sum: { $cond: [{ $and: [outgoing, sent, human] }, 1, 0] } },
        whatsappOut: { $sum: { $cond: [{ $and: [outgoing, { $eq: ['$channel', 'whatsapp'] }] }, 1, 0] } },
      } },
    ]) : [],
    ids.length ? Activity.aggregate([
      { $match: { businessId: bizId, leadId: { $in: ids } } },
      { $group: {
        _id: '$leadId',
        firstCall: { $min: { $cond: [{ $regexMatch: { input: '$type', regex: 'call' } }, at, null] } },
        calls: { $sum: { $cond: [{ $regexMatch: { input: '$type', regex: 'call' } }, 1, 0] } },
        lastHuman: { $max: { $cond: [{ $in: ['$type', HUMAN_ACTIVITY] }, at, null] } },
      } },
    ]) : [],
    ids.length ? Task.aggregate([
      { $match: { businessId: bizId, leadId: { $in: ids }, status: { $in: ['pending', 'in_progress'] }, dueDate: { $lt: now } } },
      { $group: { _id: '$leadId', firstOverdue: { $min: '$dueDate' } } },
    ]) : [],
    ids.length ? Conversation.find({ businessId: bizId, leadId: { $in: ids }, isDeleted: { $ne: true } })
      .select('leadId firstResponseAt awaitingReplySince responseConfidence')
      .lean() : [],
    User.find({ _id: { $in: [...new Set(real.map((l) => String(l.assignedTo || l.ownerId || '')).filter(Boolean))] } })
      .select('firstName lastName email')
      .lean(),
  ]);

  const byId = (rows) => new Map(rows.map((r) => [String(r._id), r]));
  const msg = byId(messages);
  const act = byId(activities);
  const task = byId(tasks);
  const ownerName = new Map(users.map((u) => [String(u._id), [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email]));
  const convs = new Map();
  for (const c of conversations) {
    const k = String(c.leadId);
    if (!convs.has(k)) convs.set(k, []);
    convs.get(k).push(c);
  }

  // An instant "thanks for your enquiry" right after a form lead was created
  // (no customer message before it) is an autoresponder too. Only for leads
  // without first-response tracking whose first "human" send came within a
  // minute of creation: re-read just their messages and take the first send
  // that looks typed.
  const isTracked = (k) => (convs.get(k) || []).some((c) => c.responseConfidence);
  const createdOf = (l) => l.receivedAt || l.createdAt;
  const suspects = real.filter((l) => {
    const m = msg.get(String(l._id));
    return m?.firstHumanOut && !isTracked(String(l._id))
      && m.firstHumanOut - createdOf(l) < BOT_REPLY_MS;
  });
  const typedFirst = new Map();
  if (suspects.length) {
    const created = new Map(suspects.map((l) => [String(l._id), createdOf(l).getTime()]));
    const timeline = await Message.find({ businessId: bizId, leadId: { $in: suspects.map((l) => l._id) }, isInternal: { $ne: true } })
      .select('leadId direction origin status timestamp')
      .sort({ leadId: 1, timestamp: 1 })
      .lean();
    const lastIn = new Map();
    for (const x of timeline) {
      const k = String(x.leadId);
      const t = new Date(x.timestamp).getTime();
      if (x.direction === 'incoming') { lastIn.set(k, t); continue; }
      if (typedFirst.has(k) || NOT_SENT.includes(x.status) || AUTO_ORIGINS.includes(x.origin || 'user')) continue;
      const li = lastIn.get(k);
      if (t - created.get(k) >= BOT_REPLY_MS && (li == null || t - li >= BOT_REPLY_MS)) typedFirst.set(k, new Date(t));
    }
  }

  let untrackedWhatsApp = 0;
  const records = real.map((l) => {
    const k = String(l._id);
    const m = msg.get(k) || {};
    const a = act.get(k) || {};
    const leadConvs = convs.get(k) || [];
    // Conversations carry first-response data that already separates bots from
    // people (recorded live, or by the backfill). Older WhatsApp messages were
    // all stored as agent sends, so without it a bot reply looks human.
    const tracked = leadConvs.filter((c) => c.responseConfidence);
    let firstHumanMessage;
    let awaitingReplySince;
    if (tracked.length) {
      firstHumanMessage = minDate(...tracked.map((c) => c.firstResponseAt));
      awaitingReplySince = minDate(...tracked.map((c) => c.awaitingReplySince));
    } else {
      if (m.whatsappOut) untrackedWhatsApp += 1;
      firstHumanMessage = suspects.length && typedFirst.has(k) ? typedFirst.get(k)
        : (m.firstHumanOut && m.firstHumanOut - createdOf(l) < BOT_REPLY_MS ? undefined : m.firstHumanOut || undefined);
      awaitingReplySince = m.lastIn && (!m.lastHumanOut || m.lastHumanOut < m.lastIn) ? m.lastIn : undefined;
    }
    const firstContactAt = minDate(firstHumanMessage, a.firstCall);
    const createdAt = l.receivedAt || l.createdAt;
    const ownerKey = String(l.assignedTo || l.ownerId || '');
    return {
      id: k,
      name: l.name || 'Unnamed lead',
      phone: maskPhone(l.phone),
      owner: ownerName.get(ownerKey) || (ownerKey ? 'Former user' : undefined),
      source: l.source,
      stage: l.status,
      status: mapStatus(l.status),
      createdAt,
      firstContactAt,
      onlyAutomatedContact: !firstContactAt && Boolean(m.firstAnyOut),
      lastActivityAt: maxDate(m.lastAny, a.lastHuman, l.lastContactedAt),
      nextFollowUpAt: l.nextFollowUpAt || undefined,
      overdueTaskAt: task.get(k)?.firstOverdue,
      awaitingReplySince,
      attempts: (m.humanOut || 0) + (a.calls || 0),
      link: `/automation/leads/${k}`,
    };
  });

  const notes = [];
  if (imported.length) notes.push(`${imported.length} bulk-imported lead${imported.length === 1 ? '' : 's'} left out: an uploaded list isn't an enquiry.`);
  if (machine.length) notes.push(`${machine.length} lead${machine.length === 1 ? '' : 's'} from newsletters / no-reply senders left out.`);
  if (untrackedWhatsApp) notes.push(`${untrackedWhatsApp} lead${untrackedWhatsApp === 1 ? '' : 's'} have WhatsApp history from before 25 Sep 2026, when bot and agent messages weren't told apart; a bot reply there may count as a human reply, so R1 can be understated. Running the first-response backfill fixes this.`);
  if (truncated) notes.push(`Only the newest ${MAX_LEADS} leads in the period were audited.`);

  return {
    records,
    notes,
    meta: { days, since: since.toISOString(), leadsInPeriod: leads.length, machineMailExcluded: machine.length, importedExcluded: imported.length, truncated },
  };
}
