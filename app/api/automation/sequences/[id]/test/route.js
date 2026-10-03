import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import Lead from '@/models/automation/Lead';
import { withPlanAccess } from '@/lib/accessControl';
import { sequenceEngine } from '@/lib/sequences/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const businessId = req.user.businessId;

    const sequence = await AutomationSequence.findOne({ _id: id, businessId });
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }

    const leadId = body.leadId;
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId required for test run' }, { status: 400 });
    }

    const lead = await Lead.findOne({ _id: leadId, businessId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const execution = await sequenceEngine.runTestWorkflow(leadId, id, {
      debugMode: body.debugMode !== false,
      context: body.context || {},
    });

    return NextResponse.json({
      success: true,
      data: {
        executionId: execution?._id,
        status: execution?.status,
        logs: execution?.logs || [],
        testMode: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
