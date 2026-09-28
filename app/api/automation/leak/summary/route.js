import LeakFlag from '@/models/leak/LeakFlag';
import Business from '@/models/Business';
import User from '@/models/User';
import { leakRoute, ok, shownOpenFilter, SEVERITY_RANK } from '@/lib/leak/api';

const RULES = ['R1', 'R2', 'R3', 'R4', 'R5'];

/**
 * GET /api/automation/leak/summary — the light numbers the page polls.
 * One aggregation (open leaks grouped by lead) and one settings read.
 * Everything is counted in leads, not flags: one customer is one problem.
 */
export const GET = leakRoute(async (_req, _ctx, { businessId, userId, manager }) => {
  const business = await Business.findById(businessId).select('settings.leakGuard').lean();
  const lg = business?.settings?.leakGuard || {};
  const base = shownOpenFilter(businessId, new Date());
  if (!manager) base.assignedTo = userId; // a salesperson's numbers are their own leaks

  const leads = await LeakFlag.aggregate([
    { $match: base },
    { $group: { _id: '$leadId', rank: { $min: SEVERITY_RANK }, rules: { $addToSet: '$rule' }, assignedTo: { $first: '$assignedTo' } } },
  ]);

  const open = leads.length;
  const bySeverity = { high: 0, medium: 0, low: 0 };
  for (const l of leads) bySeverity[['high', 'medium', 'low'][l.rank] || 'low'] += 1;
  const byRule = Object.fromEntries(RULES.map((r) => [r, leads.filter((l) => l.rules.includes(r)).length]));
  const byOwner = new Map();
  for (const l of leads) {
    const k = String(l.assignedTo || 'unassigned');
    byOwner.set(k, (byOwner.get(k) || 0) + 1);
  }
  const mine = manager ? (byOwner.get(String(userId)) || 0) : open;

  let team = [];
  if (manager) {
    const scanTeam = lg.lastScanStats?.team || [];
    const ids = [...new Set([...scanTeam.map((t) => t.ownerId), ...byOwner.keys()].filter((k) => k && k !== 'unassigned'))];
    const users = ids.length ? await User.find({ _id: { $in: ids }, businessId }).select('firstName lastName email').lean() : [];
    const nameOf = new Map(users.map((u) => [String(u._id), [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email]));
    const keys = new Set([...scanTeam.map((t) => t.ownerId || 'unassigned'), ...byOwner.keys()]);
    team = [...keys].map((k) => {
      const t = scanTeam.find((x) => (x.ownerId || 'unassigned') === k) || {};
      return {
        ownerId: k === 'unassigned' ? null : k,
        name: k === 'unassigned' ? 'Unassigned' : nameOf.get(k) || t.owner || 'Former teammate',
        leads: t.leads || 0,
        leakPct: t.leakPct ?? null,
        firstReplyMedianMin: t.firstReplyMedianMin ?? null,
        openNow: byOwner.get(k) || 0,
      };
    }).sort((a, b) => b.openNow - a.openNow || b.leads - a.leads);
  }

  const estimate = lg.avgDealValue > 0 && lg.conversionPct > 0
    ? Math.round(open * lg.avgDealValue * (lg.conversionPct / 100))
    : null;

  return ok({
    enabled: Boolean(lg.enabled),
    manager,
    open,
    mine,
    bySeverity,
    byRule,
    estimatedAtRisk: manager ? estimate : null,
    estimateInputs: manager && estimate != null ? { avgDealValue: lg.avgDealValue, conversionPct: lg.conversionPct, leads: open } : null,
    lastScanAt: lg.lastScanAt || null,
    scan: manager ? {
      enquiries: lg.lastScanStats?.enquiries ?? null,
      leakPct: lg.lastScanStats?.leakPct ?? null,
      firstReplyMedianMin: lg.lastScanStats?.firstReplyMedianMin ?? null,
      withinSlaPct: lg.lastScanStats?.withinSlaPct ?? null,
    } : null,
    team,
  });
});
