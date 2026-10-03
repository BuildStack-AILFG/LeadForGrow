import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import WorkflowFolder from '@/models/automation/WorkflowFolder';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const folders = await WorkflowFolder.find({ businessId: req.user.businessId })
      .sort({ order: 1, name: 1 })
      .lean();
    return NextResponse.json({ success: true, data: folders });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Folder name required' }, { status: 400 });
    }
    const folder = await WorkflowFolder.create({
      businessId: req.user.businessId,
      name: body.name.trim(),
      color: body.color || 'blue',
      parentId: body.parentId || null,
      order: body.order || 0,
    });
    return NextResponse.json({ success: true, data: folder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
