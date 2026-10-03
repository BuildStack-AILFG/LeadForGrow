import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import CrmComment from '@/models/automation/CrmComment';
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

    if (!entityType || !entityId) {
      return NextResponse.json({ success: false, error: 'entityType and entityId required' }, { status: 400 });
    }

    const comments = await CrmComment.find({
      businessId: tenant.business._id,
      entityType,
      entityId,
      deletedAt: null,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('[Comments GET]', error);
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

    const comment = await CrmComment.create({
      businessId: tenant.business._id,
      entityType: body.entityType,
      entityId: body.entityId,
      content: body.content,
      mentions: body.mentions || [],
      parentId: body.parentId || null,
      createdBy: tenant.user._id,
    });

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: body.entityType,
      entityId: body.entityId,
      leadId: body.entityType === 'lead' ? body.entityId : body.leadId,
      type: 'comment_added',
      description: 'Comment added',
      performedBy: tenant.user._id,
      metadata: { commentId: comment._id },
    });

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    console.error('[Comments POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
