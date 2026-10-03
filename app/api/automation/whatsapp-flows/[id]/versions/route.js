import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowVersion from '@/models/automation/FlowVersion';
import FlowNode from '@/models/automation/FlowNode';
import { loadFlowGraph } from '@/lib/whatsappFlows/service';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const versions = await FlowVersion.find({ flowId: id, businessId }).sort({ version: -1 }).lean();
    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

/** Restore a version into the draft canvas */
export const POST = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const { version } = await req.json();

    const flow = await WhatsAppFlow.findOne({ _id: id, businessId });
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const ver = await FlowVersion.findOne({ flowId: id, businessId, version }).lean();
    if (!ver) return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });

    const nodes = ver.snapshot?.nodes || [];
    const edges = ver.snapshot?.edges || [];

    await FlowNode.deleteMany({ flowId: id, businessId });
    for (const node of nodes) {
      await FlowNode.create({
        businessId,
        flowId: id,
        nodeKey: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
      });
    }

    flow.edges = edges;
    if (ver.snapshot?.triggerType) flow.triggerType = ver.snapshot.triggerType;
    if (ver.snapshot?.triggerConfig) flow.triggerConfig = ver.snapshot.triggerConfig;
    flow.status = 'draft';
    flow.updatedBy = userId;
    flow.version = (flow.version || 1) + 1;
    await flow.save();

    const loaded = await loadFlowGraph(id, businessId);
    return NextResponse.json({ success: true, data: { ...flow.toObject(), nodes: loaded, edges } });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
