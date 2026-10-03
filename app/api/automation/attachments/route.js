import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import CrmAttachment from '@/models/automation/CrmAttachment';
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

    const attachments = await CrmAttachment.find({
      businessId: tenant.business._id,
      entityType,
      entityId,
      deletedAt: null,
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: attachments });
  } catch (error) {
    console.error('[Attachments GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const body = await request.json();
    if (!body.entityType || !body.entityId || !body.fileName || !body.fileUrl) {
      return NextResponse.json({ success: false, error: 'entityType, entityId, fileName, fileUrl required' }, { status: 400 });
    }

    await dbConnect();

    const attachment = await CrmAttachment.create({
      businessId: tenant.business._id,
      entityType: body.entityType,
      entityId: body.entityId,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileSize: body.fileSize || 0,
      mimeType: body.mimeType || 'application/octet-stream',
      uploadedBy: tenant.user._id,
      createdBy: tenant.user._id,
    });

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: body.entityType,
      entityId: body.entityId,
      leadId: body.entityType === 'lead' ? body.entityId : body.leadId,
      type: 'attachment_added',
      description: `File "${body.fileName}" attached`,
      performedBy: tenant.user._id,
      metadata: { attachmentId: attachment._id },
    });

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (error) {
    console.error('[Attachments POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
