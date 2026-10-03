/**
 * Leak Radar: from rule results to flags (pure, no I/O — unit tested).
 *
 * Only leaks someone can still act on become flags. "First reply was late"
 * already happened, so it is a Team metric, not a queue item.
 */
import { evaluateLead } from './rules.js';

const ms = (d) => (d instanceof Date ? d.getTime() : d == null ? NaN : new Date(d).getTime());

/** One stable key per leak episode, so re-scans update instead of duplicating. */
export function dedupeKeyFor(businessId, rec, flag) {
  const base = `${businessId}:${rec.id}:${flag.rule}`;
  switch (flag.rule) {
    case 'R2': return `${base}:${ms(rec.awaitingReplySince)}`;
    case 'R3': return `${base}:${Math.min(...[rec.nextFollowUpAt, rec.overdueTaskAt].map(ms).filter(Number.isFinite))}`;
    case 'R4': return `${base}:${ms([rec.lastActivityAt, rec.firstContactAt, rec.createdAt].find((d) => Number.isFinite(ms(d))))}`;
    default: return base; // R1 (never contacted) and R5 happen once per lead
  }
}

/**
 * Deterministic 0–99 bucket from the key (FNV-1a), so a leak stays in or out of
 * the comparison group on every scan and on every server.
 */
export function holdoutBucket(key) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 100;
}

export const isHoldout = (key, pct) => pct > 0 && holdoutBucket(key) < pct;

/** Flags the queue should hold for one record. */
export function actionableFlags(businessId, rec, cfg, now) {
  return evaluateLead(rec, cfg, now)
    .filter((f) => !(f.rule === 'R1' && f.kind === 'late'))
    .map((f) => ({ ...f, dedupeKey: dedupeKeyFor(businessId, rec, f) }));
}

/** Per-salesperson numbers captured at scan time (the Team view reads these). */
export function teamStats(records, report) {
  const byOwner = new Map();
  for (const r of records) {
    const k = r.ownerId || 'unassigned';
    const o = byOwner.get(k) || { ownerId: r.ownerId || null, owner: r.owner || 'Unassigned', leads: 0 };
    o.leads += 1;
    byOwner.set(k, o);
  }
  const fromReport = new Map(report.byOwner.map((o) => [o.owner, o]));
  return [...byOwner.values()].map((o) => {
    const rep = fromReport.get(o.owner) || {};
    return { ...o, leaked: rep.leaked || 0, leakPct: rep.leakPct || 0, firstReplyMedianMin: rep.firstReplyMedianMin ?? null };
  }).sort((a, b) => b.leaked - a.leaked || b.leads - a.leads);
}
