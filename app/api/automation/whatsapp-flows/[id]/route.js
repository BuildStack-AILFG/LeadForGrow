import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowNode from '@/models/automation/FlowNode';
import FlowVersion from '@/models/automation/FlowVersion';
import FlowExecution from '@/models/automation/FlowExecution';
import FlowVariable from '@/models/automation/FlowVariable';
import {
  loadFlowGraph,
  saveFlowGraph,
  createVersionSnapshot,
} from '@/lib/whatsappFlows/service';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const flow = await WhatsAppFlow.findOne({ _id: id, businessId }).lean();
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const nodes = await loadFlowGraph(id, businessId);
    const variables = await FlowVariable.find({ businessId, flowId: id }).lean();
    const versions = await FlowVersion.find({ flowId: id, businessId }).sort({ version: -1 }).limit(20).lean();

    return NextResponse.json({
      success: true,
      data: { ...flow, nodes, edges: flow.edges || [], variables, versions },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const body = await req.json();

    const flow = await WhatsAppFlow.findOne({ _id: id, businessId });
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    if (body.name != null) flow.name = String(body.name).trim();
    if (body.description != null) flow.description = body.description;
    if (body.triggerType != null) flow.triggerType = body.triggerType;
    if (body.triggerConfig != null) flow.triggerConfig = body.triggerConfig;
    if (body.tags != null) flow.tags = body.tags;
    if (Array.isArray(body.edges)) flow.edges = body.edges;

    if (Array.isArray(body.nodes)) {
      await saveFlowGraph({
        flowId: flow._id,
        businessId,
        nodes: body.nodes,
        edges: body.edges || flow.edges,
        userId,
      });
    }

    flow.updatedBy = userId;
    flow.version = (flow.version || 1) + (body.createVersion ? 1 : 0);
    await flow.save();

    if (body.createVersion) {
      const nodes = body.nodes || (await loadFlowGraph(id, businessId));
      await createVersionSnapshot({
        flow,
        nodes,
        edges: flow.edges,
        userId,
        note: body.versionNote || 'Autosave version',
      });
    }

    const nodes = await loadFlowGraph(id, businessId);
    return NextResponse.json({
      success: true,
      data: { ...flow.toObject(), nodes, edges: flow.edges },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const flow = await WhatsAppFlow.findOneAndDelete({ _id: id, businessId });
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    await Promise.all([
      FlowNode.deleteMany({ flowId: id, businessId }),
      FlowVersion.deleteMany({ flowId: id, businessId }),
      FlowVariable.deleteMany({ flowId: id, businessId }),
      FlowExecution.deleteMany({ flowId: id, businessId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
