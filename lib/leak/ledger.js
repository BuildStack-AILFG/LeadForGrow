/**
 * Recovery Ledger — did Leak Radar bring money back? (server side; the maths
 * is in summarizeLedger, which is pure and unit tested)
 *
 * Revenue categories are never mixed:
 *   observed    paid bills / won deals of flagged leads, within 30 days of the flag
 *   attributed  the same, but only for leaks the team acted on, counted after the action
 * The holdout group (leaks kept out of the queue) is the comparison: a higher
 * recovery rate for shown leaks than hidden ones is the evidence it works.
 */
import mongoose from 'mongoose';
import LeakFlag from '@/models/leak/LeakFlag';
import LeakAction from '@/models/leak/LeakAction';
import Message from '@/models/automation/Message';
import Lead from '@/models/automation/Lead';
import Deal from '@/models/automation/Deal';
import Bill from '@/models/automation/Bill';

import { summarizeLedger, PASSIVE_ACTIONS } from '@/lib/leak/ledgerMath';

const DAY = 24 * 60 * 60 * 1000;

export async function buildLedger(businessId, { days = 30, now = new Date() } = {}) {
  const bizId = new mongoose.Types.ObjectId(String(businessId));
  const since = new Date(now.getTime() - days * DAY);
  const flags = await LeakFlag.find({ businessId: bizId, detectedAt: { $gte: since } })
    .select('leadId rule holdout status detectedAt')
    .limit(20000)
    .lean();
  const leadIds = [...new Set(flags.map((f) => String(f.leadId)))].map((id) => new mongoose.Types.ObjectId(id));
  const until = new Date(now.getTime() + DAY);

  const [actions, incoming, leads, deals, bills] = await Promise.all([
    flags.length ? LeakAction.aggregate([
      { $match: { businessId: bizId, flagId: { $in: flags.map((f) => f._id) }, actionType: { $nin: PASSIVE_ACTIONS } } },
      { $group: { _id: '$flagId', first: { $min: '$createdAt' } } },
    ]) : [],
    leadIds.length ? Message.aggregate([
      { $match: { businessId: bizId, leadId: { $in: leadIds }, direction: 'incoming', timestamp: { $gte: since, $lte: until } } },
      { $group: { _id: '$leadId', at: { $push: '$timestamp' } } },
    ]) : [],
    leadIds.length ? Lead.find({ _id: { $in: leadIds }, businessId: bizId, status: { $in: ['converted', 'won'] } }).select('convertedAt updatedAt').lean() : [],
    leadIds.length ? Deal.find({ businessId: bizId, leadId: { $in: leadIds }, wonAt: { $gte: since } }).select('leadId amount wonAt').lean() : [],
    leadIds.length ? Bill.find({ businessId: bizId, leadId: { $in: leadIds }, paidAt: { $gte: since } }).select('leadId total paidAt').lean() : [],
  ]);

  // Per lead, prefer paid bills (money received); fall back to won deal amounts.
  const billsByLead = group(bills, (b) => ({ at: b.paidAt, amount: b.total }));
  const dealsByLead = group(deals, (d) => ({ at: d.wonAt, amount: d.amount }));
  const revenue = new Map();
  for (const id of new Set([...billsByLead.keys(), ...dealsByLead.keys()])) {
    revenue.set(id, billsByLead.get(id) || dealsByLead.get(id));
  }

  const summary = summarizeLedger(flags, {
    firstActionAt: new Map(actions.map((a) => [String(a._id), a.first])),
    incoming: new Map(incoming.map((m) => [String(m._id), m.at])),
    converted: new Map(leads.map((l) => [String(l._id), l.convertedAt || l.updatedAt])),
    revenue,
  });
  return { days, since: since.toISOString(), ...summary };
}

function group(rows, map) {
  const out = new Map();
  for (const r of rows) {
    const k = String(r.leadId);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push(map(r));
  }
  return out;
}
