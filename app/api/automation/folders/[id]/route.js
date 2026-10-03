import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WorkflowFolder from '@/models/automation/WorkflowFolder';
import AutomationSequence from '@/models/automation/AutomationSequence';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

export const PUT = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const folder = await WorkflowFolder.findOne({ _id: id, businessId: req.user.businessId });
    if (!folder) return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });

    if (body.name !== undefined) folder.name = body.name.trim();
    if (body.color !== undefined) folder.color = body.color;
    if (body.parentId !== undefined) folder.parentId = body.parentId || null;
    if (body.order !== undefined) folder.order = body.order;
    if (body.isFavorite !== undefined) folder.isFavorite = body.isFavorite;
    if (body.archived !== undefined) folder.archived = body.archived;

    await folder.save();
    return NextResponse.json({ success: true, data: folder });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;

    const folder = await WorkflowFolder.findOne({ _id: id, businessId: req.user.businessId });
    if (!folder) return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });

    await AutomationSequence.updateMany(
      { businessId: req.user.businessId, folderId: id },
      { $set: { folderId: null } }
    );
    await WorkflowFolder.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
