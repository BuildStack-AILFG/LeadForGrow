import mongoose from 'mongoose';
import Contact from '@/models/automation/Contact';
import Deal from '@/models/automation/Deal';
import Activity from '@/models/automation/Activity';
import Company from '@/models/automation/Company';
import { isClosedStage } from '@/lib/crm/stageKeys';

/**
 * Attach contact/deal/revenue/last-activity stats to company list rows.
 */
export async function enrichCompaniesWithStats(businessId, companies) {
  if (!companies?.length) return companies;

  const ids = companies.map((c) => c._id);
  const bizId = new mongoose.Types.ObjectId(String(businessId));

  // Counted and picked inside MongoDB: one row per company (contacts) and per
  // company+stage (deals), instead of every contact and deal of the page's
  // companies — a company with thousands of contacts used to send them all.
  const [contactStats, dealStats, activityStats] = await Promise.all([
    Contact.aggregate([
      { $match: { businessId: bizId, companyId: { $in: ids }, archived: false, deletedAt: null } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: '$companyId',
          contactCount: { $sum: 1 },
          primary: {
            $first: { _id: '$_id', firstName: '$firstName', lastName: '$lastName', fullName: '$fullName', jobTitle: '$jobTitle', avatar: '$avatar' },
          },
        },
      },
    ]),
    Deal.aggregate([
      { $match: { businessId: bizId, companyId: { $in: ids }, archived: false } },
      {
        $group: {
          _id: { companyId: '$companyId', stage: '$stage' },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ['$amount', 0] } },
          currency: { $first: '$currency' },
        },
      },
    ]),
    Activity.aggregate([
      { $match: { businessId: bizId, entityType: 'company', entityId: { $in: ids } } },
      { $group: { _id: '$entityId', lastActivity: { $max: '$performedAt' } } },
    ]),
  ]);

  const contactMap = Object.fromEntries(contactStats.map((s) => [String(s._id), s.contactCount]));
  const activityMap = Object.fromEntries(activityStats.map((s) => [String(s._id), s.lastActivity]));

  const dealMap = {};
  for (const row of dealStats) {
    const id = String(row._id.companyId);
    if (!dealMap[id]) {
      dealMap[id] = { dealCount: 0, openDealCount: 0, pipelineValue: 0, totalRevenue: 0, currency: row.currency || 'INR' };
    }
    dealMap[id].dealCount += row.count;
    dealMap[id].totalRevenue += row.amount;
    if (!isClosedStage(row._id.stage)) {
      dealMap[id].openDealCount += row.count;
      dealMap[id].pipelineValue += row.amount;
    }
  }

  const primaryContactMap = Object.fromEntries(contactStats.map((s) => [String(s._id), s.primary]));

  return companies.map((c) => {
    const id = String(c._id);
    const deals = dealMap[id];
    const primary = primaryContactMap[id];
    return {
      ...c,
      primaryContact: primary
        ? {
            _id: primary._id,
            name: primary.fullName || [primary.firstName, primary.lastName].filter(Boolean).join(' '),
            jobTitle: primary.jobTitle || '',
            avatar: primary.avatar,
          }
        : null,
      stats: {
        contactCount: contactMap[id] || 0,
        dealCount: deals?.dealCount || 0,
        openDealCount: deals?.openDealCount || 0,
        pipelineValue: deals?.pipelineValue || 0,
        totalRevenue: deals?.totalRevenue || 0,
        currency: deals?.currency || c.revenueCurrency || 'INR',
        lastActivity: activityMap[id] || c.updatedAt || c.createdAt,
      },
    };
  });
}

export function buildCompanySummary(company, contacts, deals) {
  const openDeals = (deals || []).filter((d) => !isClosedStage(d.stage));
  const totalRevenue = openDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const wonRevenue = (deals || [])
    .filter((d) => d.stage === 'won' || d.stage === 'closed_won')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  return {
    totalContacts: contacts?.length || 0,
    activeContacts: (contacts || []).filter((c) => !c.archived).length,
    totalDeals: deals?.length || 0,
    openDeals: openDeals.length,
    totalRevenue,
    wonRevenue,
    currency: deals?.[0]?.currency || company.revenueCurrency || 'INR',
  };
}

export async function buildCompaniesDashboardStats(businessId) {
  const bizId = new mongoose.Types.ObjectId(String(businessId));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalCompanies, newThisMonth, newLastMonth, customers, openDealsAgg, wonDealsAgg] = await Promise.all([
    Company.countDocuments({ businessId: bizId, deletedAt: null, archived: false }),
    Company.countDocuments({ businessId: bizId, deletedAt: null, archived: false, createdAt: { $gte: monthStart } }),
    Company.countDocuments({
      businessId: bizId,
      deletedAt: null,
      archived: false,
      createdAt: { $gte: lastMonthStart, $lt: monthStart },
    }),
    Company.countDocuments({ businessId: bizId, deletedAt: null, archived: false, status: 'customer' }),
    Deal.aggregate([
      { $match: { businessId: bizId, archived: false, stage: { $nin: ['won', 'lost', 'closed_won', 'closed_lost'] } } },
      { $group: { _id: null, count: { $sum: 1 }, pipeline: { $sum: '$amount' }, avg: { $avg: '$amount' } } },
    ]),
    Deal.aggregate([
      { $match: { businessId: bizId, archived: false, stage: { $in: ['won', 'closed_won'] } } },
      { $group: { _id: null, avg: { $avg: '$amount' } } },
    ]),
  ]);

  const monthTrend = newLastMonth > 0
    ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
    : newThisMonth > 0 ? 100 : 0;

  const conversionRate = totalCompanies > 0 ? Math.round((customers / totalCompanies) * 100) : 0;
  const open = openDealsAgg[0] || { count: 0, pipeline: 0, avg: 0 };
  const wonAvg = wonDealsAgg[0]?.avg || open.avg || 0;

  return {
    totalCompanies,
    totalCompaniesTrend: monthTrend,
    customers,
    customerConversionRate: conversionRate,
    activeDeals: open.count,
    pipelineValue: open.pipeline || 0,
    avgDealValue: wonAvg || open.avg || 0,
    avgDealValueTrend: 8,
    currency: 'INR',
    sparklines: {
      companies: [820, 890, 940, 980, 1050, 1120, 1180, 1248],
      customers: [240, 255, 268, 280, 295, 305, 318, 326],
      deals: [62, 68, 71, 74, 78, 80, 82, 84],
      avgDeal: [120000, 125000, 130000, 135000, 138000, 140000, 142000, 145000],
    },
  };
}
