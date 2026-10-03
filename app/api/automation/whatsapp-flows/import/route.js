import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowNode from '@/models/automation/FlowNode';
import FlowVariable from '@/models/automation/FlowVariable';
import { ensureDefaultVariables } from '@/lib/whatsappFlows/service';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const body = await req.json();
    const payload = body.data || body;

    if (payload.format !== 'leadforgrow-whatsapp-flow') {
      return NextResponse.json({ success: false, error: 'Invalid import format' }, { status: 400 });
    }

    const meta = payload.flow || {};
    const flow = await WhatsAppFlow.create({
      businessId,
      name: `${meta.name || 'Imported Flow'}`,
      description: meta.description || '',
      status: 'draft',
      triggerType: meta.triggerType || 'incoming_message',
      triggerConfig: meta.triggerConfig || {},
      edges: payload.edges || [],
      tags: meta.tags || [],
      createdBy: userId,
      updatedBy: userId,
    });

    for (const node of payload.nodes || []) {
      await FlowNode.create({
        businessId,
        flowId: flow._id,
        nodeKey: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
      });
    }

    await ensureDefaultVariables(businessId, flow._id);
    for (const v of payload.variables || []) {
      await FlowVariable.findOneAndUpdate(
        { businessId, flowId: flow._id, key: v.key },
        { $set: { label: v.label, defaultValue: v.defaultValue, source: v.source || 'custom' } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, data: flow }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
