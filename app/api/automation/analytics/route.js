import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import Broadcast from '@/models/automation/Broadcast';
import AutomationRule from '@/models/automation/AutomationRule';
import { withPlanAccess } from '@/lib/accessControl';
import { getRevenueMetrics } from '@/lib/automation/revenueAttribution';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;

    const [sequences, execStats, broadcasts, rules, revenue] = await Promise.all([
      AutomationSequence.find({ businessId }).select('name status analytics').lean(),
      SequenceExecution.aggregate([
        { $match: { businessId: businessId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$durationMs' },
          },
        },
      ]),
      Broadcast.find({ businessId }).select('name status analytics').lean(),
      AutomationRule.find({ businessId, enabled: true }).select('name type executionCount').lean(),
      getRevenueMetrics(businessId),
    ]);

    const totalRuns = execStats.reduce((n, s) => n + s.count, 0);
    const completed = execStats.find((s) => s._id === 'completed')?.count || 0;
    const failed = execStats.find((s) => s._id === 'failed')?.count || 0;
    const avgDuration = execStats.find((s) => s._id === 'completed')?.avgDuration || 0;
    const openExecutions = (execStats.find((s) => s._id === 'running')?.count || 0)
      + (execStats.find((s) => s._id === 'waiting')?.count || 0);

    const enrolled = sequences.reduce((n, s) => n + (s.analytics?.enrolled || 0), 0);
    const conversionRate = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalWorkflows: sequences.length,
          activeWorkflows: sequences.filter((s) => s.status === 'active').length,
          totalRuns,
          success: completed,
          failed,
          openExecutions,
          avgDurationMs: Math.round(avgDuration),
          conversionRate,
          totalBroadcasts: broadcasts.length,
          activeRules: rules.length,
          revenueGenerated: revenue.revenueGenerated,
          dealsWon: revenue.dealsWon,
          avgDealValue: revenue.avgDealValue,
          workflowRoi: revenue.roi,
        },
        workflows: sequences.map((s) => ({
          id: s._id,
          name: s.name,
          status: s.status,
          runs: s.analytics?.enrolled || 0,
          completed: s.analytics?.completed || 0,
          failed: s.analytics?.failed || 0,
          activeRuns: s.analytics?.activeRuns || 0,
        })),
        broadcasts: broadcasts.map((b) => ({
          id: b._id,
          name: b.name,
          status: b.status,
          sent: b.analytics?.sent || 0,
          failed: b.analytics?.failed || 0,
        })),
        rules: rules.map((r) => ({
          id: r._id,
          name: r.name,
          type: r.type,
          runs: r.executionCount || 0,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
