import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import AutomationSequence from '@/models/automation/AutomationSequence';
import Lead from '@/models/automation/Lead';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');

    const query = { businessId };
    if (leadId) query.leadId = leadId;
    if (status) query.status = status;

    const executions = await SequenceExecution.find(query)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const sequenceIds = [...new Set(executions.map((e) => e.sequenceId?.toString()))];
    const sequences = await AutomationSequence.find({ _id: { $in: sequenceIds } })
      .select('name nodes edges triggerType')
      .lean();
    const seqMap = Object.fromEntries(sequences.map((s) => [s._id.toString(), s]));

    const journeys = executions.map((ex) => {
      const seq = seqMap[ex.sequenceId?.toString()] || {};
      const nodeMap = Object.fromEntries((seq.nodes || []).map((n) => [n.id, n]));
      const currentNode = nodeMap[ex.currentNodeId];
      const completedNodes = (ex.logs || []).filter((l) => l.status === 'success').map((l) => l.nodeId);
      const failedNodes = (ex.logs || []).filter((l) => l.status === 'failed').map((l) => l.nodeId);

      let nextStage = null;
      if (ex.currentNodeId && seq.edges) {
        const edge = seq.edges.find((e) => e.source === ex.currentNodeId);
        if (edge) nextStage = nodeMap[edge.target]?.data?.label || edge.target;
      }

      return {
        executionId: ex._id,
        leadId: ex.leadId,
        sequenceId: ex.sequenceId,
        sequenceName: seq.name,
        status: ex.status,
        currentStage: currentNode?.data?.label || ex.currentNodeId || 'Completed',
        previousStage: (ex.logs || []).slice(-2, -1)[0]?.message || null,
        nextStage,
        waiting: ex.status === 'waiting',
        completed: ex.status === 'completed',
        failed: ex.status === 'failed',
        progress: seq.nodes?.length
          ? Math.round((completedNodes.length / seq.nodes.length) * 100)
          : 0,
        completedNodes,
        failedNodes,
        logs: ex.logs,
        startedAt: ex.startedAt,
        updatedAt: ex.updatedAt,
      };
    });

    return NextResponse.json({ success: true, data: journeys });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
