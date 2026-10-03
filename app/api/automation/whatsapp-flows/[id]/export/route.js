import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowVariable from '@/models/automation/FlowVariable';
import FlowNode from '@/models/automation/FlowNode';
import { loadFlowGraph, serializeFlowExport, ensureDefaultVariables } from '@/lib/whatsappFlows/service';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const flow = await WhatsAppFlow.findOne({ _id: id, businessId }).lean();
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const nodes = await loadFlowGraph(id, businessId);
    const variables = await FlowVariable.find({ businessId, flowId: id }).lean();
    const payload = serializeFlowExport(flow, nodes, flow.edges || [], variables);
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
