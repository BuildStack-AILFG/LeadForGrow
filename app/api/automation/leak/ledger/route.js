import { leakRoute, ok, bad } from '@/lib/leak/api';
import { buildLedger } from '@/lib/leak/ledger';

/**
 * GET /api/automation/leak/ledger?days=30 — managers only.
 * Flagged → actioned → recovered, observed and attributed revenue, and the
 * comparison with the holdout group. Loaded when the Ledger opens, not polled.
 */
export const GET = leakRoute(async (req, _ctx, { businessId, manager }) => {
  if (!manager) return bad('Only owners and managers can see the ledger', 403);
  const days = [7, 30, 90].includes(Number(new URL(req.url).searchParams.get('days')))
    ? Number(new URL(req.url).searchParams.get('days'))
    : 30;
  return ok(await buildLedger(businessId, { days }));
});
