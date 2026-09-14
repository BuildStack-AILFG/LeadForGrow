import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import { startFlowExecution } from '@/lib/whatsappFlows/engine';
import { loadFlowGraph } from '@/lib/whatsappFlows/service';

/**
 * Test Flow — simulates conversation without requiring publish.
 * Body: { leadId?, phone?, name?, message?, steps? }
 */
export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const body = await req.json();

    const flow = await WhatsAppFlow.findOne({ _id: id, businessId });
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const nodes = await loadFlowGraph(id, businessId);
    const edges = flow.edges || [];

    // Use draft graph as snapshot for test
    flow.publishedSnapshot = {
      nodes,
      edges,
      triggerType: flow.triggerType,
      triggerConfig: flow.triggerConfig,
    };

    const business = await Business.findById(businessId);
    let lead = body.leadId
      ? await Lead.findOne({ _id: body.leadId, businessId })
      : null;

    if (!lead) {
      lead = {
        _id: null,
        name: body.name || 'Test Customer',
        phone: body.phone || '919999999999',
        whatsapp: body.phone || '919999999999',
        email: body.email || '',
        tags: [],
        save: async () => {},
      };
    }

    const execution = await startFlowExecution({
      flow,
      business,
      lead,
      triggerPayload: { text: body.message || 'hi' },
      isTest: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        executionId: execution?._id,
        status: execution?.status,
        variables: execution?.variables,
        logs: execution?.logs,
        currentNodeKey: execution?.currentNodeKey,
        wait: execution?.wait,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
