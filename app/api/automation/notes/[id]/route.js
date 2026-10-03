import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import CrmNote from '@/models/automation/CrmNote';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const PUT = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    const body = await request.json();
    await dbConnect();

    const note = await CrmNote.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null });
    if (!note) return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });

    if (body.content && body.content !== note.content) {
      note.versions.push({ content: note.content, editedBy: tenant.user._id, editedAt: new Date() });
      note.content = body.content;
    }
    if (body.pinned !== undefined) note.pinned = body.pinned;
    if (body.mentions) note.mentions = body.mentions;
    note.updatedBy = tenant.user._id;
    await note.save();

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error('[Note PUT]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const note = await CrmNote.findOne({ _id: id, businessId: tenant.business._id });
    if (!note) return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });

    await note.softDelete(tenant.user._id);
    return NextResponse.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('[Note DELETE]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
