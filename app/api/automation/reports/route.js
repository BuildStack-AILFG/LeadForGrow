import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Lead from '@/models/automation/Lead';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { business } = tenant;
    const { searchParams } = new URL(request.url);
    const rawPeriod = parseInt(searchParams.get('period') || '30', 10);
    const period = Number.isFinite(rawPeriod) ? Math.min(Math.max(1, rawPeriod), 365) : 30;

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - period);

    // All independent reads in one parallel batch (they used to run one after another).
    const [
      totalLeads,
      leadsByStatus,
      leadsBySource,
      responseTimeData,
      notContactedCount,
      dailyTrends,
      teamPerformance,
      hourlyHeatmap,
      recentLeads,
    ] = await Promise.all([
      Lead.countDocuments({
        businessId: business._id,
        receivedAt: { $gte: periodDate },
        archived: false,
      }),
      Lead.aggregate([
        {
          $match: {
            businessId: business._id,
            receivedAt: { $gte: periodDate },
            archived: false,
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        {
          $match: {
            businessId: business._id,
            receivedAt: { $gte: periodDate },
            archived: false,
          },
        },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Lead.aggregate([
        {
          $match: {
            businessId: business._id,
            lastContactedAt: { $ne: null },
            receivedAt: { $gte: periodDate },
          },
        },
        { $project: { responseTime: { $subtract: ['$lastContactedAt', '$receivedAt'] } } },
        { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } },
      ]),
      Lead.countDocuments({
        businessId: business._id,
        status: 'new',
        archived: false,
      }),
      Lead.aggregate([
        {
          $match: {
            businessId: business._id,
            receivedAt: { $gte: periodDate },
            archived: false,
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
            leads: { $sum: 1 },
            conversions: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([
        {
          $match: {
            businessId: business._id,
            receivedAt: { $gte: periodDate },
            assignedTo: { $ne: null },
            archived: false,
          },
        },
        {
          $group: {
            _id: '$assignedTo',
            total: { $sum: 1 },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
            avgResponseTime: {
              $avg: {
                $cond: [
                  { $gt: ['$lastContactedAt', null] },
                  { $subtract: ['$lastContactedAt', '$receivedAt'] },
                  null,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        { $unwind: '$userDetails' },
        {
          $project: {
            name: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$userDetails.firstName', null] },
                    { $gt: ['$userDetails.lastName', null] },
                  ],
                },
                { $concat: ['$userDetails.firstName', ' ', '$userDetails.lastName'] },
                { $ifNull: ['$userDetails.firstName', '$userDetails.email'] },
              ],
            },
            email: '$userDetails.email',
            total: 1,
            converted: 1,
            avgResponseTime: 1,
            conversionRate: {
              $multiply: [
                { $cond: [{ $eq: ['$total', 0] }, 0, { $divide: ['$converted', '$total'] }] },
                100,
              ],
            },
          },
        },
      ]),
      Lead.aggregate([
        {
          $match: {
            businessId: business._id,
            receivedAt: { $gte: periodDate },
            archived: false,
          },
        },
        {
          $group: {
            _id: {
              hour: { $hour: '$receivedAt' },
              day: { $dayOfWeek: '$receivedAt' },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Lead.find({
        businessId: business._id,
        status: { $in: ['converted', 'contacted'] },
        archived: false,
      })
        .sort({ lastContactedAt: -1, convertedAt: -1 })
        .limit(5)
        .select('name status serviceInterest convertedAt lastContactedAt')
        .lean(),
    ]);

    const statusCounts = { new: 0, contacted: 0, 'follow-up': 0, converted: 0, lost: 0 };
    leadsByStatus.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    const avgResponseTimeMs = responseTimeData[0]?.avgResponseTime || 0;
    const avgResponseTimeHours = Math.round((avgResponseTimeMs / (1000 * 60 * 60)) * 10) / 10;

    const conversionRate =
      totalLeads > 0 ? Math.round((statusCounts.converted / totalLeads) * 100 * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalLeads,
        statusCounts,
        converted: statusCounts.converted || 0,
        lost: statusCounts.lost || 0,
        leadsBySource,
        avgResponseTimeHours,
        notContactedCount,
        conversionRate,
        recentLeads,
        dailyTrends,
        teamPerformance,
        hourlyHeatmap,
      },
    });
  } catch (error) {
    console.error('CRITICAL REPORTS ERROR:', error);
    return NextResponse.json(
      { success: false, error: serverErrorMessage(error) || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
});
