import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowNode from '@/models/automation/FlowNode';
import { loadFlowGraph, ensureDefaultVariables } from '@/lib/whatsappFlows/service';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    const source = await WhatsAppFlow.findOne({ _id: id, businessId }).lean();
    if (!source) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const nodes = await loadFlowGraph(id, businessId);
    const clone = await WhatsAppFlow.create({
      businessId,
      name: `${source.name} (Copy)`,
      description: source.description,
      status: 'draft',
      triggerType: source.triggerType,
      triggerConfig: source.triggerConfig,
      edges: source.edges || [],
      tags: source.tags || [],
      createdBy: userId,
      updatedBy: userId,
      version: 1,
      publishedVersion: 0,
    });

    for (const node of nodes) {
      await FlowNode.create({
        businessId,
        flowId: clone._id,
        nodeKey: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      });
    }

    await ensureDefaultVariables(businessId, clone._id);
    return NextResponse.json({ success: true, data: clone }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
