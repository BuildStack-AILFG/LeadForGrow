import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import { withPlanAccess } from '@/lib/accessControl';
import { syncSequenceRule, deleteSequenceRule, disableSequenceRule } from '@/lib/sequences/ruleSync';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const sequence = await AutomationSequence.findOne({
      _id: id,
      businessId: req.user.businessId,
    }).lean();

    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: sequence });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const body = await req.json();

    const sequence = await AutomationSequence.findOne({ _id: id, businessId });
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }

    const allowed = [
      'name', 'description', 'category', 'status', 'triggerType', 'triggerConfig',
      'nodes', 'edges', 'steps', 'tags', 'workflowMode', 'folderId', 'enabled', 'abTest',
    ];
    allowed.forEach((key) => {
      if (body[key] !== undefined) sequence.set(key, body[key]);
    });

    if (body.triggerType === 'webhook' || sequence.triggerType === 'webhook') {
      if (!sequence.webhookSecret) {
        sequence.webhookSecret = crypto.randomBytes(24).toString('hex');
      }
    }

    if (body.nodes?.length) sequence.workflowMode = 'graph';
    sequence.version = (sequence.version || 1) + 1;
    await sequence.save();

    await syncSequenceRule(sequence, req.user.userId);

    if (sequence.status === 'paused' || sequence.status === 'archived') {
      await disableSequenceRule(sequence._id);
    }

    return NextResponse.json({ success: true, data: sequence });
  } catch (error) {
    console.error('[Sequences API] PUT error:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;

    const sequence = await AutomationSequence.findOne({ _id: id, businessId });
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }

    await deleteSequenceRule(id, businessId);
    await AutomationSequence.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
