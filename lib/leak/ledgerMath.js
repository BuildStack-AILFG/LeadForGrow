/**
 * Recovery Ledger maths (pure — unit tested). See lib/leak/ledger.js.
 */
const DAY = 24 * 60 * 60 * 1000;
export const REPLY_WINDOW_DAYS = 7;
export const REVENUE_WINDOW_DAYS = 30;
export const MIN_SAMPLE = 30;
export const PASSIVE_ACTIONS = ['snoozed', 'dismissed'];

const t = (d) => (d ? new Date(d).getTime() : NaN);

/**
 * @param flags    [{ _id, leadId, rule, holdout, status, detectedAt }]
 * @param signals  { firstActionAt: Map(flagId→Date), incoming: Map(leadId→Date[]),
 *                   converted: Map(leadId→Date), revenue: Map(leadId→[{ at, amount }]) }
 */
export function summarizeLedger(flags, signals) {
  const groups = { shown: blank(), holdout: blank() };
  const revenueLeads = { observed: new Map(), attributed: new Map() };

  for (const f of flags) {
    if (f.status === 'dismissed') continue; // owner said it was never a leak
    const g = f.holdout ? groups.holdout : groups.shown;
    const lead = String(f.leadId);
    const detected = t(f.detectedAt);
    const acted = signals.firstActionAt.get(String(f._id));
    g.flagged += 1;
    g.byRule[f.rule] = (g.byRule[f.rule] || 0) + 1;
    if (acted && !f.holdout) g.actioned += 1;

    const replied = (signals.incoming.get(lead) || []).some((d) => t(d) > detected && t(d) <= detected + REPLY_WINDOW_DAYS * DAY);
    const conv = signals.converted.get(lead);
    const converted = conv && t(conv) > detected && t(conv) <= detected + REVENUE_WINDOW_DAYS * DAY;
    const paid = (signals.revenue.get(lead) || []).filter((r) => t(r.at) > detected && t(r.at) <= detected + REVENUE_WINDOW_DAYS * DAY);
    if (replied || converted || paid.length) g.recovered += 1;

    if (!f.holdout && paid.length) {
      revenueLeads.observed.set(lead, Math.max(revenueLeads.observed.get(lead) || 0, sum(paid)));
      if (acted) {
        const after = paid.filter((r) => t(r.at) >= t(acted));
        if (after.length) revenueLeads.attributed.set(lead, Math.max(revenueLeads.attributed.get(lead) || 0, sum(after)));
      }
    }
  }

  for (const g of Object.values(groups)) {
    g.recoveryRate = g.flagged ? round1((g.recovered / g.flagged) * 100) : null;
    g.actionRate = g.flagged ? round1((g.actioned / g.flagged) * 100) : null;
  }
  const enough = groups.shown.flagged >= MIN_SAMPLE && groups.holdout.flagged >= MIN_SAMPLE;
  return {
    shown: groups.shown,
    holdout: groups.holdout,
    difference: enough && groups.shown.recoveryRate != null && groups.holdout.recoveryRate != null
      ? round1(groups.shown.recoveryRate - groups.holdout.recoveryRate)
      : null,
    enoughData: enough,
    minSample: MIN_SAMPLE,
    revenue: {
      observed: sum([...revenueLeads.observed.values()].map((amount) => ({ amount }))),
      attributed: sum([...revenueLeads.attributed.values()].map((amount) => ({ amount }))),
      leadsWithRevenue: revenueLeads.observed.size,
    },
  };
}

function blank() { return { flagged: 0, actioned: 0, recovered: 0, byRule: {} }; }
function sum(rows) { return Math.round(rows.reduce((n, r) => n + (Number(r.amount) || 0), 0)); }
function round1(n) { return Math.round(n * 10) / 10; }
