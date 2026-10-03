/**
 * Lead numbers behind the Reports "revenue intelligence" card.
 *
 * `revenueStatsFromDb` counts inside MongoDB (one aggregation, a few dozen
 * numbers back) instead of downloading every lead. `revenueStatsFromArray`
 * is the original in-memory logic, kept as the reference the tests compare
 * against.
 *
 * Shape: { total, byStatus: { [status]: n }, bySource: { [src]: { count, converted, lost } },
 *          contactedWithTime, onTimeSLA, last7Days }
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function revenueStatsFromArray(leads = [], { slaMinutes = 15, now = new Date() } = {}) {
  const byStatus = {};
  const bySource = {};
  let contactedWithTime = 0;
  let onTimeSLA = 0;
  let last7Days = 0;

  for (const lead of leads) {
    const key = lead.status ?? null;
    byStatus[key] = (byStatus[key] || 0) + 1;

    const src = lead.source || 'Unknown';
    if (!bySource[src]) bySource[src] = { count: 0, converted: 0, lost: 0 };
    bySource[src].count++;
    if (lead.status === 'converted') bySource[src].converted++;
    if (lead.status === 'lost') bySource[src].lost++;

    if (lead.lastContactedAt) {
      contactedWithTime++;
      const minutes = (new Date(lead.lastContactedAt) - new Date(lead.createdAt)) / 60000;
      if (minutes <= slaMinutes) onTimeSLA++;
    }
    if ((now - new Date(lead.createdAt)) / DAY_MS <= 7) last7Days++;
  }

  return { total: leads.length, byStatus, bySource, contactedWithTime, onTimeSLA, last7Days };
}

export async function revenueStatsFromDb(Lead, match, { slaMinutes = 15, now = new Date() } = {}) {
  const slaMs = slaMinutes * 60000;
  const isDate = (field) => ({ $eq: [{ $type: field }, 'date'] });

  const [row] = await Lead.aggregate([
    { $match: match },
    {
      $facet: {
        status: [{ $group: { _id: '$status', n: { $sum: 1 } } }],
        source: [
          {
            $group: {
              _id: {
                $cond: [
                  { $gt: [{ $strLenCP: { $ifNull: [{ $toString: '$source' }, ''] } }, 0] },
                  '$source',
                  'Unknown',
                ],
              },
              count: { $sum: 1 },
              converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
              lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
            },
          },
        ],
        sla: [
          { $match: { lastContactedAt: { $nin: [null, false, 0, ''] } } },
          {
            $group: {
              _id: null,
              n: { $sum: 1 },
              onTime: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        isDate('$createdAt'),
                        isDate('$lastContactedAt'),
                        { $lte: [{ $subtract: ['$lastContactedAt', '$createdAt'] }, slaMs] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        recent: [{ $match: { createdAt: { $gte: new Date(now.getTime() - 7 * DAY_MS) } } }, { $count: 'n' }],
        total: [{ $count: 'n' }],
      },
    },
  ]);

  const byStatus = {};
  for (const s of row?.status || []) byStatus[s._id ?? null] = s.n;
  const bySource = {};
  for (const s of row?.source || []) bySource[s._id] = { count: s.count, converted: s.converted, lost: s.lost };

  return {
    total: row?.total?.[0]?.n || 0,
    byStatus,
    bySource,
    contactedWithTime: row?.sla?.[0]?.n || 0,
    onTimeSLA: row?.sla?.[0]?.onTime || 0,
    last7Days: row?.recent?.[0]?.n || 0,
  };
}

/** Status buckets used by the card, from the per-status counts. */
export function bucketStatusCounts(byStatus = {}) {
  let won = 0;
  let lost = 0;
  let followup = 0;
  let active = 0;
  for (const [status, n] of Object.entries(byStatus)) {
    const lower = String(status).toLowerCase();
    if (status === 'converted' || lower === 'finalized' || lower === 'won') won += n;
    if (status === 'lost') lost += n;
    if (status === 'follow-up') followup += n;
    if (!['converted', 'lost', 'finalized', 'won'].includes(lower)) active += n;
  }
  return { won, lost, followup, active };
}
