/**
 * Database side of the inbox queues (see inboxViews.js): loads the lead lists a view needs and counts each queue.
 * Shared by the conversations list route (?view=) and the counts route, so a tab's number and its list always agree.
 */
import Conversation from '@/models/omnichannel/Conversation';
import Lead from '@/models/automation/Lead';
import { SERVER_VIEWS, leadListsNeeded, viewClauses } from './inboxViews';
import { automatedAddressRegexSource } from './automatedSender.js';

const MAX_LEAD_IDS = 20000;

/** Conversations that are visible in the inbox at all (not archived / spam / deleted). */
export const baseInboxFilter = (businessId) => ({
  businessId,
  isArchived: { $ne: true },
  isSpam: { $ne: true },
  isDeleted: { $ne: true },
});

/** Snoozed conversations come back when the snooze is over. */
export const notSnoozedClause = () => ({
  $or: [{ snoozedUntil: null }, { snoozedUntil: { $exists: false } }, { snoozedUntil: { $lte: new Date() } }],
});

/** Everything viewClauses needs for this view: the user id, plus the lead-id lists only for views that use them. */
export async function loadViewInputs({ businessId, userId, view }) {
  const need = leadListsNeeded(view);
  const inputs = { userId };
  if (need.mine) {
    const rows = await Lead.find({ businessId, assignedTo: userId }).select('_id').limit(MAX_LEAD_IDS).lean();
    inputs.myLeadIds = rows.map((l) => l._id);
  }
  if (need.existing) {
    // Beyond the cap the check is skipped (never hide real conversations of a very large business).
    const rows = await Lead.find({ businessId }).select('_id').limit(MAX_LEAD_IDS + 1).lean();
    if (rows.length <= MAX_LEAD_IDS) inputs.existingLeadIds = rows.map((l) => l._id);
  }
  if (need.unassigned) {
    const rows = await Lead.find({ businessId, assignedTo: null }).select('_id').limit(MAX_LEAD_IDS).lean();
    inputs.unassignedLeadIds = rows.map((l) => l._id);
  }
  return inputs;
}

/** { needs_reply, mine, unassigned, taken_over, unread }: the numbers shown on the tabs.
 *  Pass `channel` to scope the counts to one channel (whatsapp/instagram/facebook/email)
 *  so a badge matches the channel-filtered list the user is looking at. */
export async function countInboxQueues({ businessId, userId, channel }) {
  const base = baseInboxFilter(businessId);
  if (channel && channel !== 'all') base.channel = channel;
  const snooze = notSnoozedClause();
  const counts = {};
  await Promise.all([
    ...SERVER_VIEWS.map(async (view) => {
      const inputs = await loadViewInputs({ businessId, userId, view });
      const { clauses } = viewClauses(view, inputs);
      counts[view] = await Conversation.countDocuments({ ...base, $and: [snooze, ...clauses] });
    }),
    (async () => {
      counts.unread = await Conversation.countDocuments({ ...base, $and: [snooze], inboxStatus: 'unread' });
    })(),
    // Triage stats for the "needs reply" queue (customers waiting on us): how
    // many have waited past the SLA (4h) and how long the oldest has waited.
    // Powers the summary bar so an agent sees the backlog health at a glance.
    (async () => {
      const inputs = await loadViewInputs({ businessId, userId, view: 'needs_reply' });
      const { clauses } = viewClauses('needs_reply', inputs);
      const nrFilter = { ...base, $and: [snooze, ...clauses] };
      const OVERDUE_MS = 4 * 60 * 60 * 1000;
      const [overdue, oldest] = await Promise.all([
        Conversation.countDocuments({ ...nrFilter, lastMessageAt: { $lt: new Date(Date.now() - OVERDUE_MS) } }),
        Conversation.findOne(nrFilter).sort({ lastMessageAt: 1 }).select('lastMessageAt').lean(),
      ]);
      counts.overdue = overdue;
      counts.oldestWaitMs = oldest?.lastMessageAt ? Date.now() - new Date(oldest.lastMessageAt).getTime() : 0;
    })(),
  ]);
  return counts;
}

/**
 * "Waiting for reply" count per channel, in a single aggregation, for the little
 * red badges on the channel tabs. Approximates the needs_reply queue (customer
 * spoke last, open, not a newsletter) without the per-lead existence check, so
 * it's one cheap grouped query — safe to poll on its own light cadence rather
 * than on every list refresh.
 */
export async function countNeedsReplyByChannel({ businessId }) {
  const rows = await Conversation.aggregate([
    {
      $match: {
        ...baseInboxFilter(businessId),
        status: { $nin: ['closed', 'spam', 'archived'] },
        lastMessageDirection: 'incoming',
        participantEmail: { $not: new RegExp(automatedAddressRegexSource(), 'i') },
        $or: [{ snoozedUntil: null }, { snoozedUntil: { $exists: false } }, { snoozedUntil: { $lte: new Date() } }],
      },
    },
    { $group: { _id: '$channel', count: { $sum: 1 } } },
  ]);
  const byChannel = {};
  let all = 0;
  for (const r of rows) {
    if (r._id) byChannel[r._id] = r.count;
    all += r.count;
  }
  byChannel.all = all;
  return byChannel;
}
