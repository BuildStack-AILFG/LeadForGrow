import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Contact from '@/models/automation/Contact';
import Deal from '@/models/automation/Deal';
import Task from '@/models/automation/Task';
import CrmNote from '@/models/automation/CrmNote';
import CrmAttachment from '@/models/automation/CrmAttachment';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { logTimelineEvent } from '@/lib/crm/timeline';
import { getEntityTimeline } from '@/lib/crm/timeline';
import { findDuplicateContacts } from '@/lib/crm/duplicateDetection';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const contact = await Contact.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null })
      .populate('companyId', 'name domain industry website')
      .populate('ownerId', 'firstName lastName email')
      .lean();

    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });

    const [timeline, deals, tasks, notes, attachments] = await Promise.all([
      getEntityTimeline(tenant.business._id, 'contact', id, { limit: 30 }),
      Deal.find({ businessId: tenant.business._id, contactId: id, archived: false }).limit(10).lean(),
      Task.find({ businessId: tenant.business._id, contactId: id, status: { $ne: 'cancelled' } }).sort({ dueDate: 1 }).limit(10).lean(),
      CrmNote.find({ businessId: tenant.business._id, entityType: 'contact', entityId: id, deletedAt: null }).sort({ pinned: -1, createdAt: -1 }).lean(),
      CrmAttachment.find({ businessId: tenant.business._id, entityType: 'contact', entityId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...contact, timeline: timeline.items, deals, tasks, notes, attachments },
    });
  } catch (error) {
    console.error('[Contact GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    const body = await request.json();
    await dbConnect();

    const contact = await Contact.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null });
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });

    const allowed = ['firstName', 'lastName', 'type', 'jobTitle', 'department', 'phones', 'emails', 'addresses', 'socialProfiles', 'companyId', 'ownerId', 'tags', 'customFields', 'notes', 'avatar', 'archived'];
    for (const key of allowed) {
      if (body[key] !== undefined) contact[key] = body[key];
    }
    contact.updatedBy = tenant.user._id;
    if (body.archived === true) contact.archivedAt = new Date();
    await contact.save();

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: 'contact',
      entityId: id,
      type: body.archived ? 'lead_archived' : 'contact_updated',
      description: body.archived ? 'Contact archived' : 'Contact updated',
      performedBy: tenant.user._id,
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    console.error('[Contact PUT]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const contact = await Contact.findOne({ _id: id, businessId: tenant.business._id });
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });

    await contact.softDelete(tenant.user._id);
    return NextResponse.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('[Contact DELETE]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
