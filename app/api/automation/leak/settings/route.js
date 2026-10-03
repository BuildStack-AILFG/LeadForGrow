import Business from '@/models/Business';
import { leakRoute, ok, bad } from '@/lib/leak/api';
import { mergeConfig } from '@/lib/leak/rules';
import { scanBusiness } from '@/lib/leak/scanner';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function view(lg = {}) {
  const cfg = mergeConfig(lg);
  return {
    enabled: Boolean(lg.enabled),
    enabledAt: lg.enabledAt || null,
    firstReplySlaMinutes: cfg.firstReplySlaMinutes,
    waitingSlaHours: cfg.waitingSlaHours,
    followUpGraceHours: cfg.followUpGraceHours,
    stallDays: cfg.stallDays,
    minAttemptsBeforeLost: cfg.minAttemptsBeforeLost,
    businessHours: cfg.businessHours,
    avgDealValue: cfg.avgDealValue,
    conversionPct: cfg.conversionPct,
    holdoutPct: Math.min(50, Math.max(0, Number(lg.holdoutPct ?? 20))),
    digest: { enabled: lg.digest?.enabled !== false, recipients: lg.digest?.recipients || [], lastSentAt: lg.digest?.lastSentAt || null },
    lastScanAt: lg.lastScanAt || null,
  };
}

/** GET /api/automation/leak/settings */
export const GET = leakRoute(async (_req, _ctx, { businessId }) => {
  const business = await Business.findById(businessId).select('settings.leakGuard').lean();
  return ok(view(business?.settings?.leakGuard));
});

/**
 * PATCH /api/automation/leak/settings — owners and managers.
 * Turning Leak Radar on runs the first scan straight away.
 */
export const PATCH = leakRoute(async (req, _ctx, { businessId, manager }) => {
  if (!manager) return bad('Only owners and managers can change Leak Radar settings', 403);
  const body = await req.json().catch(() => ({}));
  const business = await Business.findById(businessId).select('businessName frozen settings.leakGuard').lean();
  if (!business) return bad('Business not found', 404);
  const current = business.settings?.leakGuard || {};

  const cfg = mergeConfig({ ...current, ...body, businessHours: { ...(current.businessHours || {}), ...(body.businessHours || {}) } });
  const set = {
    'settings.leakGuard.firstReplySlaMinutes': cfg.firstReplySlaMinutes,
    'settings.leakGuard.waitingSlaHours': cfg.waitingSlaHours,
    'settings.leakGuard.followUpGraceHours': cfg.followUpGraceHours,
    'settings.leakGuard.stallDays': cfg.stallDays,
    'settings.leakGuard.minAttemptsBeforeLost': cfg.minAttemptsBeforeLost,
    'settings.leakGuard.businessHours': cfg.businessHours,
    'settings.leakGuard.avgDealValue': cfg.avgDealValue,
    'settings.leakGuard.conversionPct': cfg.conversionPct,
  };
  if (body.holdoutPct !== undefined) {
    const h = Number(body.holdoutPct);
    if (!Number.isFinite(h) || h < 0 || h > 50) return bad('Comparison group must be between 0% and 50%');
    set['settings.leakGuard.holdoutPct'] = Math.round(h);
  }
  if (body.digest) {
    if (typeof body.digest.enabled === 'boolean') set['settings.leakGuard.digest.enabled'] = body.digest.enabled;
    if (Array.isArray(body.digest.recipients)) {
      const list = [...new Set(body.digest.recipients.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
      if (list.length > 5) return bad('Up to 5 brief recipients');
      const badEmail = list.find((e) => !EMAIL.test(e));
      if (badEmail) return bad(`"${badEmail}" isn't an email address`);
      set['settings.leakGuard.digest.recipients'] = list;
    }
  }
  const turningOn = body.enabled === true && !current.enabled;
  if (typeof body.enabled === 'boolean') set['settings.leakGuard.enabled'] = body.enabled;
  if (turningOn) set['settings.leakGuard.enabledAt'] = new Date();

  const updated = await Business.findByIdAndUpdate(businessId, { $set: set }, { new: true, runValidators: true })
    .select('businessName frozen settings.leakGuard')
    .lean();

  let firstScan = null;
  if (turningOn && !updated.frozen) {
    try {
      firstScan = await scanBusiness(updated);
    } catch (err) {
      console.error('[leak settings] first scan failed', err);
    }
  }
  const fresh = firstScan ? await Business.findById(businessId).select('settings.leakGuard').lean() : updated;
  return ok({ ...view(fresh.settings?.leakGuard), firstScan: firstScan ? { open: firstScan.open, enquiries: firstScan.enquiries } : null });
});
