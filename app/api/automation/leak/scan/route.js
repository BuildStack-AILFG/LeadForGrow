import Business from '@/models/Business';
import { leakRoute, ok, bad } from '@/lib/leak/api';
import { scanBusiness } from '@/lib/leak/scanner';

const MIN_GAP_MS = 60 * 1000;

/**
 * POST /api/automation/leak/scan — "Scan now" for owners and managers.
 * At most once a minute; otherwise the last result is returned.
 */
export const POST = leakRoute(async (_req, _ctx, { businessId, manager }) => {
  if (!manager) return bad('Only owners and managers can run a scan', 403);
  const business = await Business.findById(businessId).select('businessName frozen settings.leakGuard').lean();
  const lg = business?.settings?.leakGuard;
  if (!lg?.enabled) return bad('Turn Leak Radar on first');
  if (lg.lastScanAt && Date.now() - new Date(lg.lastScanAt).getTime() < MIN_GAP_MS) {
    return ok({ skipped: true, lastScanAt: lg.lastScanAt });
  }
  const result = await scanBusiness(business);
  return ok({ skipped: false, open: result.open, cleared: result.cleared, lastScanAt: new Date() });
});
