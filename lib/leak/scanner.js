/**
 * Leak Radar scanner: turns a business's current data into LeakFlags.
 *
 * Per business: the audit loader's bounded queries, one read of open flags,
 * one bulkWrite (upserts), one updateMany (clears), one settings update.
 * Businesses are scanned oldest-first within a time budget, so a slow run
 * continues on the next tick instead of timing out.
 */
import Business from '@/models/Business';
import LeakFlag from '@/models/leak/LeakFlag';
import { loadBusinessLeakRecords } from '@/lib/leak/databaseSource';
import { buildLeakReport, mergeConfig } from '@/lib/leak/rules';
import { actionableFlags, isHoldout, teamStats } from '@/lib/leak/flagging';

export const SCAN_DAYS = 90;
const LIVE = ['open', 'actioned'];

export async function scanBusiness(business, now = new Date()) {
  const settings = business.settings?.leakGuard || {};
  const cfg = mergeConfig(settings);
  const holdoutPct = Math.min(50, Math.max(0, Number(settings.holdoutPct ?? 20)));
  const bizId = business._id;

  const { records, meta } = await loadBusinessLeakRecords(bizId, { days: SCAN_DAYS, now, includeActive: true });

  const desired = new Map();
  for (const rec of records) {
    for (const f of actionableFlags(String(bizId), rec, cfg, now)) {
      desired.set(f.dedupeKey, { rec, f });
    }
  }

  const ops = [...desired.values()].map(({ rec, f }) => ({
    updateOne: {
      filter: { dedupeKey: f.dedupeKey },
      update: {
        $setOnInsert: {
          businessId: bizId,
          leadId: rec.id,
          rule: f.rule,
          status: 'open',
          detectedAt: now,
          holdout: isHoldout(f.dedupeKey, holdoutPct),
          dedupeKey: f.dedupeKey,
        },
        $set: {
          severity: f.severity,
          reason: f.reason,
          assignedTo: rec.ownerId || null,
          lastSeenAt: now,
          evidence: {
            createdAt: rec.createdAt,
            firstContactAt: rec.firstContactAt,
            awaitingReplySince: rec.awaitingReplySince,
            nextFollowUpAt: rec.nextFollowUpAt,
            overdueTaskAt: rec.overdueTaskAt,
            lastActivityAt: rec.lastActivityAt,
            attempts: rec.attempts,
          },
          lead: {
            name: rec.name,
            phone: rec.phone,
            source: rec.source,
            stage: rec.stage,
            channel: rec.channel,
            optedOutOfWhatsApp: rec.optedOutOfWhatsApp,
            conversationId: rec.conversationId || null,
          },
        },
      },
      upsert: true,
    },
  }));
  if (ops.length) await LeakFlag.bulkWrite(ops, { ordered: false });

  // Anything still open that the rules no longer see has been dealt with.
  const scannedLeadIds = records.map((r) => r.id);
  const cleared = await LeakFlag.updateMany(
    { businessId: bizId, status: { $in: LIVE }, leadId: { $in: scannedLeadIds }, dedupeKey: { $nin: [...desired.keys()] } },
    { $set: { status: 'resolved', resolution: 'cleared', resolvedAt: now }, $inc: { version: 1 } }
  );
  // Leads that left the scan window (or were archived / imported) can't be judged any more.
  const expired = await LeakFlag.updateMany(
    { businessId: bizId, status: { $in: LIVE }, leadId: { $nin: scannedLeadIds } },
    { $set: { status: 'expired', resolvedAt: now }, $inc: { version: 1 } }
  );

  // Headline stats describe enquiries from the window; older leads pulled in only
  // because someone is waiting on them would skew "% slipped".
  const since = now.getTime() - SCAN_DAYS * 24 * 60 * 60 * 1000;
  const windowRecords = records.filter((r) => new Date(r.createdAt).getTime() >= since);
  const report = buildLeakReport(windowRecords, cfg, now);
  const stats = {
    enquiries: report.totals.enquiries,
    leakPct: report.totals.leakPct,
    firstReplyMedianMin: report.totals.firstReplyMedianMin,
    withinSlaPct: report.totals.withinSlaPct,
    open: desired.size,
    cleared: cleared.modifiedCount,
    expired: expired.modifiedCount,
    team: teamStats(windowRecords, report),
    notes: meta?.truncated ? ['Only the newest 5000 leads were scanned.'] : [],
  };
  await Business.updateOne(
    { _id: bizId },
    { $set: { 'settings.leakGuard.lastScanAt': now, 'settings.leakGuard.lastScanStats': stats } }
  );
  return { businessId: String(bizId), ...stats, team: undefined };
}

/** Cron entry: every enabled business, least recently scanned first, within a time budget. */
export async function scanDueBusinesses({ now = new Date(), timeBudgetMs = 45000, limit = 200 } = {}) {
  const started = Date.now();
  const businesses = await Business.find({ 'settings.leakGuard.enabled': true, frozen: { $ne: true } })
    .select('businessName settings.leakGuard')
    .sort({ 'settings.leakGuard.lastScanAt': 1 })
    .limit(limit)
    .lean();

  const results = [];
  for (const b of businesses) {
    if (Date.now() - started > timeBudgetMs) break;
    try {
      results.push(await scanBusiness(b, now));
    } catch (err) {
      console.error(`[leak-scan] ${b._id}`, err);
      results.push({ businessId: String(b._id), error: err.message });
    }
  }
  return { due: businesses.length, scanned: results.length, results };
}
