import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import {
  loadFlowGraph,
  createVersionSnapshot,
} from '@/lib/whatsappFlows/service';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const userId = req.user.userId;

    const flow = await WhatsAppFlow.findOne({ _id: id, businessId });
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const nodes = await loadFlowGraph(id, businessId);
    if (!nodes.length) {
      return NextResponse.json({ success: false, error: 'Add at least one node before publishing' }, { status: 400 });
    }

    const hasTrigger = nodes.some((n) => String(n.type).startsWith('trigger_'));
    if (!hasTrigger) {
      return NextResponse.json({ success: false, error: 'Flow needs a trigger node' }, { status: 400 });
    }

    const keywordNode = nodes.find((n) => n.type === 'trigger_keyword');
    if (keywordNode) {
      flow.triggerType = 'keyword';
      flow.triggerConfig = {
        ...(flow.triggerConfig || {}),
        keywords: keywordNode.data?.keywords || [],
        matchMode: keywordNode.data?.matchMode || 'contains',
      };
    } else {
      const triggerNode = nodes.find((n) => String(n.type).startsWith('trigger_'));
      const typeMap = {
        trigger_incoming_message: 'incoming_message',
        trigger_contact_created: 'contact_created',
        trigger_lead_created: 'lead_created',
        trigger_manual: 'manual',
        trigger_webhook: 'webhook',
      };
      if (triggerNode && typeMap[triggerNode.type]) {
        flow.triggerType = typeMap[triggerNode.type];
      }
    }

    flow.publishedVersion = (flow.publishedVersion || 0) + 1;
    flow.version = Math.max(flow.version || 1, flow.publishedVersion);
    flow.status = 'published';
    flow.publishedAt = new Date();
    flow.publishedSnapshot = {
      nodes,
      edges: flow.edges || [],
      triggerType: flow.triggerType,
      triggerConfig: flow.triggerConfig,
    };
    flow.updatedBy = userId;
    await flow.save();

    await createVersionSnapshot({
      flow,
      nodes,
      edges: flow.edges || [],
      userId,
      published: true,
      note: 'Published',
    });

    return NextResponse.json({ success: true, data: flow });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
