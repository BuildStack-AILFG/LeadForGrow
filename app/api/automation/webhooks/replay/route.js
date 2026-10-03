import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WebhookLog from '@/models/automation/WebhookLog';
import AutomationSequence from '@/models/automation/AutomationSequence';
import Lead from '@/models/automation/Lead';
import { withPlanAccess } from '@/lib/accessControl';
import { dispatchAutomationEvent } from '@/lib/automation/triggerHub';
import { sequenceEngine } from '@/lib/sequences/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const { logId } = await req.json();
    if (!logId) {
      return NextResponse.json({ success: false, error: 'logId required' }, { status: 400 });
    }

    const log = await WebhookLog.findOne({ _id: logId, businessId: req.user.businessId });
    if (!log) {
      return NextResponse.json({ success: false, error: 'Webhook log not found' }, { status: 404 });
    }

    const sequenceId = log.metadata?.sequenceId;
    if (!sequenceId) {
      return NextResponse.json({ success: false, error: 'Not a workflow webhook log' }, { status: 400 });
    }

    const sequence = await AutomationSequence.findOne({
      _id: sequenceId,
      businessId: req.user.businessId,
      triggerType: 'webhook',
    });
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Workflow not found' }, { status: 404 });
    }

    const body = log.payload || {};
    let lead = log.leadId ? await Lead.findById(log.leadId) : null;
    if (!lead && body.leadId) lead = await Lead.findById(body.leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found for replay' }, { status: 422 });
    }

    await dispatchAutomationEvent(lead, 'webhook', body);
    await sequenceEngine.tryStartByTriggerType(lead, 'webhook');
    await sequenceEngine.startWorkflow(lead, sequenceId);

    await WebhookLog.updateOne(
      { _id: log._id },
      { $set: { status: 'processed', 'metadata.replayedAt': new Date() } }
    );

    return NextResponse.json({ success: true, leadId: lead._id, replayed: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
