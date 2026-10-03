import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const status = searchParams.get('status');
    const sequenceId = searchParams.get('sequenceId');

    const query = { businessId };
    if (status) query.status = status;
    if (sequenceId) query.sequenceId = sequenceId;

    const logs = await SequenceExecution.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('leadId', 'name email phone')
      .populate('sequenceId', 'name')
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PATCH = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { executionId, action } = body;

    const execution = await SequenceExecution.findOne({
      _id: executionId,
      businessId: req.user.businessId,
    });
    if (!execution) {
      return NextResponse.json({ success: false, error: 'Execution not found' }, { status: 404 });
    }

    if (action === 'retry') {
      execution.retryCount = 0;
      execution.status = 'running';
      execution.lastError = null;
      await execution.save();

      if (execution.currentNodeId) {
        const { sequenceEngine } = await import('@/lib/sequences/engine');
        await sequenceEngine.processNode(execution._id, execution.currentNodeId);
      }
    } else if (action === 'cancel') {
      execution.status = 'cancelled';
      await execution.save();
      const { sequenceEngine } = await import('@/lib/sequences/engine');
      await sequenceEngine.completeExecution(execution, 'cancelled');
    }

    return NextResponse.json({ success: true, data: execution });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
