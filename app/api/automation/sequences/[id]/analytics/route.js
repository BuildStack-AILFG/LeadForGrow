import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import { withPlanAccess } from '@/lib/accessControl';
import { getRevenueMetrics } from '@/lib/automation/revenueAttribution';
import { compareAbVariants } from '@/lib/automation/approvalGate';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;

    const sequence = await AutomationSequence.findOne({ _id: id, businessId }).lean();
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }

    const [statusCounts, recentLogs, revenue, variantStats] = await Promise.all([
      SequenceExecution.aggregate([
        { $match: { sequenceId: sequence._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      SequenceExecution.find({ sequenceId: id })
        .sort({ updatedAt: -1 })
        .limit(20)
        .select('logs status updatedAt leadId')
        .lean(),
      getRevenueMetrics(businessId, sequence._id),
      SequenceExecution.aggregate([
        { $match: { sequenceId: sequence._id, variantId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$variantId',
            enrolled: { $sum: 1 },
            sent: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$logs', []] } }, 0] }, 1, 0] } },
            replies: { $sum: { $cond: [{ $eq: ['$context.replied', true] }, 1, 0] } },
            conversions: { $sum: { $cond: [{ $gt: ['$revenueAttributed', 0] }, 1, 0] } },
            revenue: { $sum: { $ifNull: ['$revenueAttributed', 0] } },
          },
        },
      ]),
    ]);

    const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
    const enrolled = sequence.analytics?.enrolled || byStatus.running + byStatus.completed + byStatus.failed + byStatus.waiting || 0;
    const completed = sequence.analytics?.completed || byStatus.completed || 0;
    const failed = sequence.analytics?.failed || byStatus.failed || 0;
    const activeRuns = sequence.analytics?.activeRuns || (byStatus.running || 0) + (byStatus.waiting || 0);

    const completionRate = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
    const responseRate = sequence.analytics?.responded && enrolled
      ? Math.round((sequence.analytics.responded / enrolled) * 100)
      : 0;

    const timeline = recentLogs.flatMap((ex) =>
      (ex.logs || []).slice(-3).map((log) => ({
        ...log,
        executionId: ex._id,
        leadId: ex.leadId,
        executionStatus: ex.status,
      }))
    ).sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt)).slice(0, 30);

    const abVariants = (sequence.abTest?.variants || []).map((v) => {
      const stats = variantStats.find((s) => s._id === v.id) || {};
      return {
        variantId: v.id,
        name: v.name,
        enrolled: stats.enrolled || 0,
        sent: stats.sent || 0,
        replies: stats.replies || 0,
        conversions: stats.conversions || 0,
        revenue: stats.revenue || 0,
      };
    });
    const abComparison = abVariants.length >= 2 ? compareAbVariants(abVariants) : null;

    return NextResponse.json({
      success: true,
      data: {
        enrolled,
        completed,
        failed,
        activeRuns,
        completionRate,
        responseRate,
        byStatus,
        timeline,
        revenue: {
          generated: revenue.revenueGenerated,
          dealsWon: revenue.dealsWon,
          avgDealValue: revenue.avgDealValue,
          conversionRate: revenue.conversionRate,
          roi: revenue.roi,
        },
        abTest: sequence.abTest?.enabled ? {
          enabled: true,
          variants: abVariants,
          comparison: abComparison,
          winnerVariantId: sequence.abTest.winnerVariantId,
        } : null,
        sequence: {
          name: sequence.name,
          status: sequence.status,
          version: sequence.version,
          webhookSecret: sequence.webhookSecret,
          triggerType: sequence.triggerType,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
