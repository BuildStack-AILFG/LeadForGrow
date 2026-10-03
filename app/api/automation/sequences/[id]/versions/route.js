import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import WorkflowVersion from '@/models/automation/WorkflowVersion';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const versions = await WorkflowVersion.find({
      sequenceId: id,
      businessId: req.user.businessId,
    }).sort({ version: -1 }).limit(50).lean();

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

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

    const version = await WorkflowVersion.create({
      businessId,
      sequenceId: sequence._id,
      version: sequence.version,
      name: sequence.name,
      nodes: sequence.nodes,
      edges: sequence.edges,
      steps: sequence.steps,
      triggerType: sequence.triggerType,
      triggerConfig: sequence.triggerConfig,
      publishedBy: req.user.userId,
      changeNote: body.changeNote || `Published v${sequence.version}`,
    });

    sequence.publishedAt = new Date();
    sequence.publishedVersion = sequence.version;
    if (body.activate) sequence.status = 'active';
    await sequence.save();

    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
