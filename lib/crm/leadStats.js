/**
 * Compact lead statistics for the dashboard (hero KPIs, leads management, retention).
 *
 * The dashboard used to download every lead of the business and count in JavaScript, so its
 * cost grew with the CRM. `leadStatsFromDb` computes the same numbers inside MongoDB in one
 * aggregation and returns a few dozen integers whatever the lead count. `leadStatsFromArray`
 * is the reference implementation with identical rules; tests compare the two.
 *
 * Rules (unchanged from the original builders):
 *  - won        = status in WON_STATUSES
 *  - conversion = convertedAt, else updatedAt
 *  - cycle days = max(1, round((conversion − receivedAt) / 1 day)) for won leads
 *  - source     = source, else 'other'
 *  - weeks start on Monday, months on the 1st, in the server's time zone
 */

export const WON_STATUSES = ['won', 'converted'];
export const RETENTION_MONTHS = 7;
const DAY_MS = 86400000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Time windows shared by both implementations, computed once from `now`. */
export function statWindows(now = new Date()) {
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const thisWeekStart = startOfDay(now);
  thisWeekStart.setDate(thisWeekStart.getDate() + mondayOffset);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Retention months, oldest first; month k covers [monthStarts[k], monthStarts[k + 1]).
  const monthStarts = [];
  for (let i = RETENTION_MONTHS - 1; i >= -1; i--) {
    monthStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  return {
    thisWeek: [thisWeekStart, nextWeekStart],
    lastWeek: [lastWeekStart, thisWeekStart],
    thisMonthStart,
    lastMonthStart,
    monthStarts,
  };
}

const emptyStats = () => ({
  total: 0,
  won: 0,
  leadsThisWeek: 0,
  leadsLastWeek: 0,
  convertedThisWeek: 0,
  convertedLastWeek: 0,
  cycle: { all: { sum: 0, n: 0 }, thisMonth: { sum: 0, n: 0 }, lastMonth: { sum: 0, n: 0 } },
  thisMonthReceived: 0,
  lastMonthReceived: 0,
  thisMonthRetained: 0,
  lastMonthRetained: 0,
  byStatus: {},
  bySource: {},
  byPriority: {},
  monthly: {}, // source -> { received: number[7], retained: number[7] }
});

function monthIndex(date, monthStarts) {
  for (let k = 0; k < RETENTION_MONTHS; k++) {
    if (date >= monthStarts[k] && date < monthStarts[k + 1]) return k;
  }
  return -1;
}

function monthlyRow(stats, src) {
  if (!stats.monthly[src]) {
    stats.monthly[src] = { received: Array(RETENTION_MONTHS).fill(0), retained: Array(RETENTION_MONTHS).fill(0) };
  }
  return stats.monthly[src];
}

/** Reference implementation over an array of lead documents. */
export function leadStatsFromArray(leads = [], now = new Date()) {
  const w = statWindows(now);
  const s = emptyStats();
  const inRange = (d, [a, b]) => d >= a && d < b;

  for (const lead of leads) {
    const received = new Date(lead.receivedAt);
    const conv = new Date(lead.convertedAt || lead.updatedAt);
    const won = WON_STATUSES.includes(lead.status);
    const src = lead.source || 'other';

    s.total += 1;
    s.byStatus[lead.status] = (s.byStatus[lead.status] || 0) + 1;
    s.bySource[src] = (s.bySource[src] || 0) + 1;
    s.byPriority[lead.priority ?? ''] = (s.byPriority[lead.priority ?? ''] || 0) + 1;

    if (inRange(received, w.thisWeek)) s.leadsThisWeek += 1;
    if (inRange(received, w.lastWeek)) s.leadsLastWeek += 1;
    if (received >= w.thisMonthStart) s.thisMonthReceived += 1;
    if (inRange(received, [w.lastMonthStart, w.thisMonthStart])) s.lastMonthReceived += 1;

    const rk = monthIndex(received, w.monthStarts);
    if (rk >= 0) monthlyRow(s, src).received[rk] += 1;

    if (!won) continue;
    s.won += 1;
    if (inRange(conv, w.thisWeek)) s.convertedThisWeek += 1;
    if (inRange(conv, w.lastWeek)) s.convertedLastWeek += 1;
    if (conv >= w.thisMonthStart) s.thisMonthRetained += 1;
    if (inRange(conv, [w.lastMonthStart, w.thisMonthStart])) s.lastMonthRetained += 1;

    const days = Math.max(1, Math.round((conv - received) / DAY_MS));
    s.cycle.all.sum += days;
    s.cycle.all.n += 1;
    if (conv >= w.thisMonthStart) {
      s.cycle.thisMonth.sum += days;
      s.cycle.thisMonth.n += 1;
    } else if (inRange(conv, [w.lastMonthStart, w.thisMonthStart])) {
      s.cycle.lastMonth.sum += days;
      s.cycle.lastMonth.n += 1;
    }

    const ck = monthIndex(conv, w.monthStarts);
    if (ck >= 0) monthlyRow(s, src).retained[ck] += 1;
  }
  return s;
}

/* ── MongoDB implementation ─────────────────────────────────────────────── */

const flag = (cond) => ({ $cond: [cond, 1, 0] });
const between = (field, [a, b]) => ({ $and: [{ $gte: [field, a] }, { $lt: [field, b] }] });

function monthSwitch(field, monthStarts) {
  return {
    $switch: {
      branches: monthStarts.slice(0, RETENTION_MONTHS).map((start, k) => ({
        case: between(field, [start, monthStarts[k + 1]]),
        then: k,
      })),
      default: -1,
    },
  };
}

/**
 * Same statistics computed in MongoDB. `Lead` is the mongoose model (passed in so this
 * module stays free of model imports and easy to test).
 */
export async function leadStatsFromDb(Lead, match, now = new Date()) {
  const w = statWindows(now);
  const conv = '$_conv';
  const won = '$_won';
  const days = {
    $max: [1, { $floor: { $add: [{ $divide: [{ $subtract: [conv, '$receivedAt'] }, DAY_MS] }, 0.5] } }],
  };
  const wonAnd = (cond) => flag({ $and: [won, cond] });

  const [res] = await Lead.aggregate([
    { $match: match },
    {
      $project: {
        status: 1,
        priority: 1,
        receivedAt: 1,
        _src: { $cond: [{ $in: [{ $ifNull: ['$source', ''] }, ['', null]] }, 'other', '$source'] },
        _conv: { $ifNull: ['$convertedAt', '$updatedAt'] },
        _won: { $in: ['$status', WON_STATUSES] },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              won: { $sum: flag(won) },
              leadsThisWeek: { $sum: flag(between('$receivedAt', w.thisWeek)) },
              leadsLastWeek: { $sum: flag(between('$receivedAt', w.lastWeek)) },
              convertedThisWeek: { $sum: wonAnd(between(conv, w.thisWeek)) },
              convertedLastWeek: { $sum: wonAnd(between(conv, w.lastWeek)) },
              thisMonthReceived: { $sum: flag({ $gte: ['$receivedAt', w.thisMonthStart] }) },
              lastMonthReceived: { $sum: flag(between('$receivedAt', [w.lastMonthStart, w.thisMonthStart])) },
              thisMonthRetained: { $sum: wonAnd({ $gte: [conv, w.thisMonthStart] }) },
              lastMonthRetained: { $sum: wonAnd(between(conv, [w.lastMonthStart, w.thisMonthStart])) },
              cycleAllSum: { $sum: { $cond: [won, days, 0] } },
              cycleThisSum: { $sum: { $cond: [{ $and: [won, { $gte: [conv, w.thisMonthStart] }] }, days, 0] } },
              cycleThisN: { $sum: wonAnd({ $gte: [conv, w.thisMonthStart] }) },
              cycleLastSum: {
                $sum: { $cond: [{ $and: [won, between(conv, [w.lastMonthStart, w.thisMonthStart])] }, days, 0] },
              },
              cycleLastN: { $sum: wonAnd(between(conv, [w.lastMonthStart, w.thisMonthStart])) },
            },
          },
        ],
        byStatus: [{ $group: { _id: '$status', n: { $sum: 1 } } }],
        bySource: [{ $group: { _id: '$_src', n: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: { $ifNull: ['$priority', ''] }, n: { $sum: 1 } } }],
        received: [
          { $project: { _src: 1, k: monthSwitch('$receivedAt', w.monthStarts) } },
          { $match: { k: { $gte: 0 } } },
          { $group: { _id: { src: '$_src', k: '$k' }, n: { $sum: 1 } } },
        ],
        retained: [
          { $match: { _won: true } },
          { $project: { _src: 1, k: monthSwitch(conv, w.monthStarts) } },
          { $match: { k: { $gte: 0 } } },
          { $group: { _id: { src: '$_src', k: '$k' }, n: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const s = emptyStats();
  const t = res?.totals?.[0];
  if (t) {
    for (const key of ['total', 'won', 'leadsThisWeek', 'leadsLastWeek', 'convertedThisWeek', 'convertedLastWeek',
      'thisMonthReceived', 'lastMonthReceived', 'thisMonthRetained', 'lastMonthRetained']) {
      s[key] = t[key];
    }
    s.cycle = {
      all: { sum: t.cycleAllSum, n: t.won },
      thisMonth: { sum: t.cycleThisSum, n: t.cycleThisN },
      lastMonth: { sum: t.cycleLastSum, n: t.cycleLastN },
    };
  }
  for (const { _id, n } of res?.byStatus || []) s.byStatus[_id] = n;
  for (const { _id, n } of res?.bySource || []) s.bySource[_id] = n;
  for (const { _id, n } of res?.byPriority || []) s.byPriority[_id ?? ''] = n;
  for (const { _id, n } of res?.received || []) monthlyRow(s, _id.src).received[_id.k] = n;
  for (const { _id, n } of res?.retained || []) monthlyRow(s, _id.src).retained[_id.k] = n;
  return s;
}
