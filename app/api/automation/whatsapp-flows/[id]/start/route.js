import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import { startFlowExecution } from '@/lib/whatsappFlows/engine';
import { serverErrorMessage } from '@/lib/api/serverError';

/** Manually start a published flow for a lead */
export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const body = await req.json();

    const flow = await WhatsAppFlow.findOne({ _id: id, businessId, status: 'published' });
    if (!flow) {
      return NextResponse.json({ success: false, error: 'Published flow not found' }, { status: 404 });
    }

    const lead = await Lead.findOne({ _id: body.leadId, businessId });
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    const business = await Business.findById(businessId);
    const execution = await startFlowExecution({
      flow,
      business,
      lead,
      triggerPayload: { text: body.message || '' },
    });

    return NextResponse.json({
      success: true,
      data: { executionId: execution?._id, status: execution?.status },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
