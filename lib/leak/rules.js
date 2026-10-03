/**
 * Leak Guard rules — pure functions, no I/O.
 *
 * Runs in the browser (prospect CSV, never uploaded) and on the server
 * (an existing client's data), so both produce the same report. Phase 1's
 * Leak Radar will reuse these rules unchanged.
 *
 * Input: normalized lead records (see LeakRecord below) + config + "now".
 * Output: per-lead flags with a plain-language reason, and a summary.
 *
 * @typedef {Object} LeakRecord
 * @property {string} id
 * @property {string} [name]
 * @property {string} [owner]
 * @property {string} [source]
 * @property {string} [stage]           display label of the current stage/status
 * @property {'open'|'won'|'lost'|'unqualified'} status
 * @property {Date}   createdAt         when the enquiry came in
 * @property {Date}   [firstContactAt]  first human reply or logged call
 * @property {boolean}[onlyAutomatedContact] bots/templates went out, no person
 * @property {Date}   [lastActivityAt]
 * @property {Date}   [nextFollowUpAt]
 * @property {Date}   [overdueTaskAt]   earliest open task already past due
 * @property {Date}   [awaitingReplySince] customer message nobody answered
 * @property {number} [attempts]        human messages + calls
 * @property {string} [link]
 */

export const RULES = {
  R1: { id: 'R1', label: 'First reply missed', short: 'No reply' },
  R2: { id: 'R2', label: 'Customer left waiting', short: 'Waiting' },
  R3: { id: 'R3', label: 'Follow-up overdue', short: 'Follow-up' },
  R4: { id: 'R4', label: 'Gone quiet', short: 'Quiet' },
  R5: { id: 'R5', label: 'Lost without trying', short: 'Lost early' },
};
export const RULE_IDS = Object.keys(RULES);

export const DEFAULT_LEAK_CONFIG = {
  firstReplySlaMinutes: 60,   // R1: first reply within this many business minutes
  waitingSlaHours: 4,         // R2: a customer message older than this (business hours)
  followUpGraceHours: 24,     // R3: follow-up due more than this long ago
  stallDays: 14,              // R4: open lead with no activity for this many days
  minAttemptsBeforeLost: 2,   // R5: marked lost with fewer attempts
  businessHours: {
    enabled: true,
    startHour: 9,
    endHour: 19,
    days: [1, 2, 3, 4, 5, 6], // Mon–Sat
    tzOffsetMinutes: 330,     // IST
  },
  avgDealValue: 0,            // owner's input; enables the "estimated at risk" line
  conversionPct: 0,
};

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const SEVERITY = { high: 3, medium: 2, low: 1 };

export function mergeConfig(input = {}) {
  const num = (v, d, lo, hi) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
  };
  const d = DEFAULT_LEAK_CONFIG;
  const bh = { ...d.businessHours, ...(input.businessHours || {}) };
  const days = Array.isArray(bh.days) ? bh.days.map(Number).filter((x) => x >= 0 && x <= 6) : d.businessHours.days;
  const startHour = num(bh.startHour, 9, 0, 23);
  return {
    firstReplySlaMinutes: num(input.firstReplySlaMinutes, d.firstReplySlaMinutes, 1, 10080),
    waitingSlaHours: num(input.waitingSlaHours, d.waitingSlaHours, 0.25, 720),
    followUpGraceHours: num(input.followUpGraceHours, d.followUpGraceHours, 0, 720),
    stallDays: num(input.stallDays, d.stallDays, 1, 365),
    minAttemptsBeforeLost: num(input.minAttemptsBeforeLost, d.minAttemptsBeforeLost, 1, 50),
    businessHours: {
      enabled: bh.enabled !== false && days.length > 0,
      startHour,
      endHour: num(bh.endHour, 19, startHour + 1, 24),
      days: [...new Set(days)],
      tzOffsetMinutes: num(bh.tzOffsetMinutes, 330, -720, 840),
    },
    avgDealValue: num(input.avgDealValue, 0, 0, 1e12),
    conversionPct: num(input.conversionPct, 0, 0, 100),
  };
}

const ms = (d) => (d instanceof Date ? d.getTime() : d == null || d === '' ? NaN : new Date(d).getTime());
const valid = (d) => Number.isFinite(ms(d));

/**
 * Minutes between a and b that fall inside business hours (wall-clock minutes
 * when business hours are off). Works in the business's fixed UTC offset.
 */
export function businessMinutesBetween(a, b, bh) {
  const start = ms(a);
  const end = ms(b);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  if (!bh?.enabled) return (end - start) / MIN;

  const off = (bh.tzOffsetMinutes ?? 330) * MIN;
  const s = start + off;
  const e = end + off;
  const openMs = bh.startHour * HOUR;
  const closeMs = bh.endHour * HOUR;
  let total = 0;
  let day = Math.floor(s / DAY) * DAY;
  // Walk day by day; beyond ~2 years, fall back to the average share of the week.
  let steps = 0;
  while (day < e && steps < 800) {
    if (bh.days.includes(new Date(day).getUTCDay())) {
      const lo = Math.max(s, day + openMs);
      const hi = Math.min(e, day + closeMs);
      if (hi > lo) total += hi - lo;
    }
    day += DAY;
    steps += 1;
  }
  if (day < e) total += (e - day) * ((bh.days.length * (closeMs - openMs)) / (7 * DAY));
  return total / MIN;
}

/** "45m", "3h 20m", "2d 4h" */
export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return '—';
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

const isClosed = (status) => status === 'won' || status === 'lost' || status === 'unqualified';

/**
 * Flags for one lead. `available` limits which rules can run (a CSV without a
 * follow-up column can't be judged on R3). Returns [] when nothing leaked.
 */
export function evaluateLead(rec, cfg, now, available = new Set(RULE_IDS)) {
  const flags = [];
  const bh = cfg.businessHours;
  const nowMs = ms(now);
  if (!valid(rec.createdAt) || rec.status === 'unqualified') return flags;
  const wall = (from) => formatDuration((nowMs - ms(from)) / MIN);

  // R1 — first reply missed or late.
  let neverContacted = false;
  if (available.has('R1')) {
    if (valid(rec.firstContactAt)) {
      const took = businessMinutesBetween(rec.createdAt, rec.firstContactAt, bh);
      if (took > cfg.firstReplySlaMinutes) {
        flags.push({
          rule: 'R1', kind: 'late', severity: 'medium',
          reason: `First reply took ${formatDuration(took)} of business time (target ${formatDuration(cfg.firstReplySlaMinutes)}).`,
        });
      }
    } else if (rec.status !== 'won' && (rec.attempts == null || rec.attempts === 0)) {
      const waited = businessMinutesBetween(rec.createdAt, now, bh);
      if (waited > cfg.firstReplySlaMinutes) {
        neverContacted = true;
        flags.push({
          rule: 'R1', kind: 'never', severity: 'high',
          reason: rec.onlyAutomatedContact
            ? `Only automated messages went out; no person replied or called in ${wall(rec.createdAt)}.`
            : `No reply or call logged in ${wall(rec.createdAt)} since the enquiry came in.`,
        });
      }
    }
  }

  // R2 — the customer wrote and is still waiting.
  if (available.has('R2') && !isClosed(rec.status) && valid(rec.awaitingReplySince)) {
    const waited = businessMinutesBetween(rec.awaitingReplySince, now, bh);
    if (waited > cfg.waitingSlaHours * 60) {
      flags.push({
        rule: 'R2', severity: 'high',
        reason: `Customer's message has waited ${wall(rec.awaitingReplySince)} for a reply.`,
      });
    }
  }

  // R3 — a follow-up date or task passed and nothing happened since.
  if (available.has('R3') && !isClosed(rec.status)) {
    const candidates = [];
    if (valid(rec.nextFollowUpAt) && !(valid(rec.lastActivityAt) && ms(rec.lastActivityAt) >= ms(rec.nextFollowUpAt))) {
      candidates.push(ms(rec.nextFollowUpAt));
    }
    if (valid(rec.overdueTaskAt)) candidates.push(ms(rec.overdueTaskAt));
    const due = candidates.length ? Math.min(...candidates) : NaN;
    if (Number.isFinite(due) && nowMs - due > cfg.followUpGraceHours * HOUR) {
      flags.push({
        rule: 'R3', severity: 'medium',
        reason: `Follow-up was due ${wall(due)} ago; nothing done since.`,
      });
    }
  }

  // R4 — still open, but nobody has touched it for a long time.
  if (available.has('R4') && !isClosed(rec.status) && !neverContacted) {
    const ref = [rec.lastActivityAt, rec.firstContactAt, rec.createdAt].find(valid);
    const idleDays = (nowMs - ms(ref)) / DAY;
    if (idleDays > cfg.stallDays) {
      flags.push({
        rule: 'R4', severity: 'low',
        reason: `No activity for ${Math.floor(idleDays)} days while still ${rec.stage ? `"${rec.stage}"` : 'open'}.`,
      });
    }
  }

  // R5 — marked lost before a real attempt was made.
  if (available.has('R5') && rec.status === 'lost') {
    if (Number.isFinite(rec.attempts) && rec.attempts < cfg.minAttemptsBeforeLost) {
      flags.push({
        rule: 'R5', severity: 'medium',
        reason: `Marked lost after ${rec.attempts} attempt${rec.attempts === 1 ? '' : 's'}.`,
      });
    } else if (rec.attempts == null && !valid(rec.firstContactAt)) {
      flags.push({ rule: 'R5', severity: 'medium', reason: 'Marked lost without any logged contact.' });
    }
  }

  return flags;
}

const percentile = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

/**
 * Evaluate every record and summarise.
 * @param {LeakRecord[]} records
 * @param {object} config          partial config; merged with defaults
 * @param {Date} now
 * @param {{ available?: string[], dismissed?: Set<string>|string[] }} opts
 *   available  rules this data can support (default all)
 *   dismissed  lead ids the owner said were not real leaks (false positives)
 */
export function buildLeakReport(records, config, now = new Date(), opts = {}) {
  const cfg = mergeConfig(config);
  const available = new Set(opts.available || RULE_IDS);
  const dismissed = new Set(opts.dismissed || []);

  const items = [];
  const byRule = Object.fromEntries(RULE_IDS.map((r) => [r, 0]));
  const owners = new Map();
  const sources = new Map();
  const firstReply = [];
  let withinSla = 0;
  let neverContacted = 0;
  let counted = 0;

  for (const rec of records) {
    if (!valid(rec.createdAt) || rec.status === 'unqualified') continue;
    counted += 1;
    const flags = evaluateLead(rec, cfg, now, available);
    const isDismissed = dismissed.has(rec.id);

    if (valid(rec.firstContactAt)) {
      const took = businessMinutesBetween(rec.createdAt, rec.firstContactAt, cfg.businessHours);
      firstReply.push(took);
      if (took <= cfg.firstReplySlaMinutes) withinSla += 1;
    }
    if (flags.some((f) => f.rule === 'R1' && f.kind === 'never')) neverContacted += 1;

    const ownerKey = rec.owner || 'Unassigned';
    const o = owners.get(ownerKey) || { owner: ownerKey, leads: 0, leaked: 0, replies: [] };
    o.leads += 1;
    if (valid(rec.firstContactAt)) o.replies.push(businessMinutesBetween(rec.createdAt, rec.firstContactAt, cfg.businessHours));

    const srcKey = rec.source || 'Unknown';
    const s = sources.get(srcKey) || { source: srcKey, leads: 0, leaked: 0 };
    s.leads += 1;

    if (flags.length) {
      flags.sort((a, b) => SEVERITY[b.severity] - SEVERITY[a.severity]);
      items.push({ ...rec, flags, dismissed: isDismissed });
      if (!isDismissed) {
        for (const f of flags) byRule[f.rule] += 1;
        o.leaked += 1;
        s.leaked += 1;
      }
    }
    owners.set(ownerKey, o);
    sources.set(srcKey, s);
  }

  items.sort((a, b) =>
    SEVERITY[b.flags[0].severity] - SEVERITY[a.flags[0].severity] || ms(b.createdAt) - ms(a.createdAt));

  const flaggedCount = items.length;
  const dismissedCount = items.filter((i) => i.dismissed).length;
  const leaked = flaggedCount - dismissedCount;
  const openLeaked = items.filter((i) => !i.dismissed && i.status !== 'won' && i.status !== 'lost').length;
  const estimatedAtRisk = cfg.avgDealValue > 0 && cfg.conversionPct > 0
    ? Math.round(openLeaked * cfg.avgDealValue * (cfg.conversionPct / 100))
    : null;

  return {
    config: cfg,
    generatedAt: new Date(ms(now)).toISOString(),
    available: RULE_IDS.filter((r) => available.has(r)),
    totals: {
      enquiries: counted,
      leaked,
      leakPct: counted ? Math.round((leaked / counted) * 1000) / 10 : 0,
      neverContacted,
      firstReplyMedianMin: percentile(firstReply, 0.5),
      firstReplyP90Min: percentile(firstReply, 0.9),
      withinSlaPct: firstReply.length ? Math.round((withinSla / firstReply.length) * 1000) / 10 : null,
      contacted: firstReply.length,
      flagged: flaggedCount,
      dismissed: dismissedCount,
      // Owner-confirmed false positives among everything flagged (target < 15%).
      falsePositivePct: flaggedCount ? Math.round((dismissedCount / flaggedCount) * 1000) / 10 : 0,
      openLeaked,
      estimatedAtRisk,
    },
    byRule,
    byOwner: [...owners.values()]
      .map((o) => ({ owner: o.owner, leads: o.leads, leaked: o.leaked, leakPct: o.leads ? Math.round((o.leaked / o.leads) * 1000) / 10 : 0, firstReplyMedianMin: percentile(o.replies, 0.5) }))
      .sort((a, b) => b.leaked - a.leaked || b.leads - a.leads),
    bySource: [...sources.values()]
      .map((s) => ({ ...s, leakPct: s.leads ? Math.round((s.leaked / s.leads) * 1000) / 10 : 0 }))
      .sort((a, b) => b.leaked - a.leaked || b.leads - a.leads),
    items,
  };
}
