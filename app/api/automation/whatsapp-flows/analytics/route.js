import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowExecution from '@/models/automation/FlowExecution';
import FlowNode from '@/models/automation/FlowNode';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const flowId = searchParams.get('flowId');

    const flowQuery = { businessId };
    if (flowId) flowQuery._id = flowId;

    const [flows, activeCount, nodeStats] = await Promise.all([
      WhatsAppFlow.find(flowQuery).select('name status analytics publishedAt triggerType').lean(),
      FlowExecution.countDocuments({
        businessId,
        status: { $in: ['active', 'waiting'] },
        ...(flowId ? { flowId } : {}),
      }),
      FlowNode.find(flowId ? { businessId, flowId } : { businessId })
        .select('nodeKey type data.label analytics flowId')
        .lean(),
    ]);

    // Simpler aggregations without ObjectId cast issues
    const execMatch = { businessId, isTest: { $ne: true } };
    if (flowId) execMatch.flowId = flowId;

    const [totalExecutions, completed, failed, waiting] = await Promise.all([
      FlowExecution.countDocuments(execMatch),
      FlowExecution.countDocuments({ ...execMatch, status: 'completed' }),
      FlowExecution.countDocuments({ ...execMatch, status: 'failed' }),
      FlowExecution.countDocuments({ ...execMatch, status: 'waiting' }),
    ]);

    const publishedFlows = flows.filter((f) => f.status === 'published').length;
    const dropOffRate = totalExecutions ? Number((((failed) / totalExecutions) * 100).toFixed(1)) : 0;
    const conversionRate = totalExecutions
      ? Number(
          (
            (flows.reduce((s, f) => s + (f.analytics?.conversions || 0), 0) / totalExecutions) *
            100
          ).toFixed(1)
        )
      : 0;

    const totalCompletionMs = flows.reduce((s, f) => s + (f.analytics?.totalCompletionMs || 0), 0);
    const completedCount = flows.reduce((s, f) => s + (f.analytics?.completed || 0), 0) || completed;
    const avgCompletionTimeMs = completedCount ? Math.round(totalCompletionMs / completedCount) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalExecutions,
        activeFlows: publishedFlows,
        activeExecutions: activeCount || waiting,
        completedFlows: completed,
        failedExecutions: failed,
        dropOffRate,
        conversionRate,
        averageCompletionTimeMs: avgCompletionTimeMs,
        nodeAnalytics: nodeStats.map((n) => ({
          flowId: n.flowId,
          nodeKey: n.nodeKey,
          type: n.type,
          label: n.data?.label || n.type,
          entered: n.analytics?.entered || 0,
          completed: n.analytics?.completed || 0,
          dropped: n.analytics?.dropped || 0,
        })),
        flows: flows.map((f) => ({
          _id: f._id,
          name: f.name,
          status: f.status,
          triggerType: f.triggerType,
          analytics: f.analytics,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
