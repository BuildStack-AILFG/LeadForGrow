import { NextResponse } from 'next/server';
import { escapeRegex } from '@/lib/crm/queryBuilder';
import { dbConnect } from '@/lib/mongodb';
import CrmNote from '@/models/automation/CrmNote';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { logTimelineEvent } from '@/lib/crm/timeline';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const search = escapeRegex(searchParams.get('search') || '').slice(0, 200);

    if (!entityType || !entityId) {
      return NextResponse.json({ success: false, error: 'entityType and entityId required' }, { status: 400 });
    }

    const query = { businessId: tenant.business._id, entityType, entityId, deletedAt: null };
    if (search) query.content = { $regex: search, $options: 'i' };

    const notes = await CrmNote.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('[Notes GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const body = await request.json();
    if (!body.entityType || !body.entityId || !body.content) {
      return NextResponse.json({ success: false, error: 'entityType, entityId, and content required' }, { status: 400 });
    }

    await dbConnect();

    const note = await CrmNote.create({
      businessId: tenant.business._id,
      entityType: body.entityType,
      entityId: body.entityId,
      content: body.content,
      contentType: body.contentType || 'plain',
      pinned: body.pinned || false,
      mentions: body.mentions || [],
      visibility: body.visibility || 'team',
      createdBy: tenant.user._id,
    });

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: body.entityType,
      entityId: body.entityId,
      leadId: body.entityType === 'lead' ? body.entityId : body.leadId,
      type: 'note_added',
      description: 'Note added',
      performedBy: tenant.user._id,
      metadata: { noteId: note._id },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error('[Notes POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
