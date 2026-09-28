import mongoose from 'mongoose';
import LeakFlag from '@/models/leak/LeakFlag';
import User from '@/models/User';
import { leakRoute, ok, shownOpenFilter, SEVERITY_RANK } from '@/lib/leak/api';

const RULES = ['R1', 'R2', 'R3', 'R4', 'R5'];
const SEVERITIES = ['high', 'medium', 'low'];
const MAX = 200;

/**
 * GET /api/automation/leak/flags
 *   ?scope=mine|all   salespeople always get their own
 *   &rule=R1..R5  &assignedTo=<userId>|unassigned  &leadId=<id>
 *
 * One item per lead (a customer can be "not replied" and "follow-up overdue"
 * at once), most urgent first, each with all its open leaks. Counts are leads.
 */
export const GET = leakRoute(async (req, _ctx, { businessId, userId, manager }) => {
  const p = new URL(req.url).searchParams;
  const base = shownOpenFilter(businessId, new Date());

  const scope = manager ? (p.get('scope') === 'mine' ? 'mine' : 'all') : 'mine';
  if (scope === 'mine') base.assignedTo = userId;
  else if (p.get('assignedTo') === 'unassigned') base.assignedTo = null;
  else if (mongoose.isValidObjectId(p.get('assignedTo'))) base.assignedTo = new mongoose.Types.ObjectId(p.get('assignedTo'));
  if (mongoose.isValidObjectId(p.get('leadId'))) base.leadId = new mongoose.Types.ObjectId(p.get('leadId'));
  const rule = RULES.includes(p.get('rule')) ? p.get('rule') : null;

  const [groups, counts] = await Promise.all([
    LeakFlag.aggregate([
      { $match: base },
      { $addFields: { rank: SEVERITY_RANK } },
      { $sort: { rank: 1, detectedAt: 1 } },
      { $group: {
        _id: '$leadId',
        rank: { $min: '$rank' },
        detectedAt: { $min: '$detectedAt' },
        assignedTo: { $first: '$assignedTo' },
        lead: { $first: '$lead' },
        rules: { $addToSet: '$rule' },
        flags: { $push: { id: '$_id', rule: '$rule', severity: '$severity', reason: '$reason', status: '$status', evidence: '$evidence', detectedAt: '$detectedAt' } },
      } },
      ...(rule ? [{ $match: { rules: rule } }] : []),
      { $sort: { rank: 1, detectedAt: 1 } },
      { $limit: MAX },
    ]),
    LeakFlag.aggregate([
      { $match: base },
      { $group: { _id: { lead: '$leadId', rule: '$rule' } } },
      { $facet: {
        byRule: [{ $group: { _id: '$_id.rule', n: { $sum: 1 } } }],
        leads: [{ $group: { _id: '$_id.lead' } }, { $count: 'n' }],
      } },
    ]).then((r) => r[0]),
  ]);

  const ids = [...new Set(groups.map((g) => String(g.assignedTo || '')).filter(Boolean))];
  const users = ids.length ? await User.find({ _id: { $in: ids }, businessId }).select('firstName lastName email').lean() : [];
  const nameOf = new Map(users.map((u) => [String(u._id), [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email]));

  return ok({
    scope,
    items: groups.map((g) => ({
      leadId: String(g._id),
      severity: SEVERITIES[g.rank] || 'low',
      detectedAt: g.detectedAt,
      inProgress: g.flags.some((f) => f.status === 'actioned'),
      flags: g.flags.map((f) => ({ ...f, id: String(f.id) })),
      lead: {
        name: g.lead?.name,
        phone: g.lead?.phone,
        source: g.lead?.source,
        stage: g.lead?.stage,
        channel: g.lead?.channel || null,
        optedOutOfWhatsApp: Boolean(g.lead?.optedOutOfWhatsApp),
        conversationId: g.lead?.conversationId ? String(g.lead.conversationId) : null,
      },
      assignedTo: g.assignedTo ? { id: String(g.assignedTo), name: nameOf.get(String(g.assignedTo)) || 'Teammate' } : null,
    })),
    counts: Object.fromEntries(RULES.map((r) => [r, counts.byRule.find((c) => c._id === r)?.n || 0])),
    totalLeads: counts.leads[0]?.n || 0,
    truncated: groups.length === MAX,
  });
});
