import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import Notification from '@/models/automation/Notification';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { sequenceEngine } from '@/lib/sequences/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const pending = await SequenceExecution.find({
      businessId: req.user.businessId,
      status: 'pending_approval',
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate('leadId', 'name email phone')
      .populate('sequenceId', 'name')
      .lean();

    return NextResponse.json({ success: true, data: pending });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PATCH = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const { executionId, action, comment } = await req.json();
    if (!executionId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const execution = await SequenceExecution.findOne({
      _id: executionId,
      businessId: req.user.businessId,
      status: 'pending_approval',
    });
    if (!execution) {
      return NextResponse.json({ success: false, error: 'Pending approval not found' }, { status: 404 });
    }

    const business = await Business.findById(req.user.businessId).lean();
    const nodeId = execution.pendingApproval?.nodeId || execution.currentNodeId;

    if (action === 'reject') {
      await SequenceExecution.updateOne(
        { _id: executionId },
        {
          $set: { status: 'cancelled', lastError: comment || 'Rejected by approver' },
          $push: {
            logs: {
              nodeId,
              nodeType: 'approval',
              status: 'failed',
              message: `Rejected: ${comment || 'No comment'}`,
              executedAt: new Date(),
            },
          },
        }
      );
      return NextResponse.json({ success: true, status: 'rejected' });
    }

    await SequenceExecution.updateOne(
      { _id: executionId },
      {
        $set: { status: 'running', 'context.approved': true },
        $push: {
          logs: {
            nodeId,
            nodeType: 'approval',
            status: 'success',
            message: `Approved by ${req.user.email || 'admin'}${comment ? `: ${comment}` : ''}`,
            executedAt: new Date(),
          },
        },
      }
    );

    const outgoing = (execution.context?.workflowEdges || []);
    const nextEdge = outgoing.find((e) => e.source === nodeId);
    if (nextEdge?.target) {
      await sequenceEngine.queueNode(executionId, nextEdge.target, 0);
    } else {
      await sequenceEngine.completeExecution(execution, 'completed');
    }

    await Notification.create({
      businessId: req.user.businessId,
      userId: business?.ownerId,
      type: 'approval_completed',
      title: 'Workflow approval granted',
      message: comment || 'Execution resumed',
      metadata: { executionId },
    });

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
