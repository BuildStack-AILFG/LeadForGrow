import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Company from '@/models/automation/Company';
import Contact from '@/models/automation/Contact';
import Deal from '@/models/automation/Deal';
import CrmNote from '@/models/automation/CrmNote';
import CrmAttachment from '@/models/automation/CrmAttachment';
import Task from '@/models/automation/Task';
import Lead from '@/models/automation/Lead';
import MeetingBooking from '@/models/meetings/MeetingBooking';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { logTimelineEvent, getEntityTimeline } from '@/lib/crm/timeline';
import { buildCompanySummary } from '@/lib/crm/companyService';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const company = await Company.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null })
      .populate('ownerId', 'firstName lastName email')
      .lean();

    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });

    const [timeline, contacts, deals, notes, attachments, analytics, tasks, companyLeads] = await Promise.all([
      getEntityTimeline(tenant.business._id, 'company', id, { limit: 50 }),
      Contact.find({ businessId: tenant.business._id, companyId: id, archived: false, deletedAt: null })
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean(),
      Deal.find({ businessId: tenant.business._id, companyId: id, archived: false })
        .sort({ updatedAt: -1 })
        .lean(),
      CrmNote.find({ businessId: tenant.business._id, entityType: 'company', entityId: id, deletedAt: null })
        .populate('createdBy', 'firstName lastName')
        .sort({ pinned: -1, createdAt: -1 })
        .lean(),
      CrmAttachment.find({ businessId: tenant.business._id, entityType: 'company', entityId: id, deletedAt: null })
        .populate('uploadedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .lean(),
      Deal.aggregate([
        { $match: { businessId: tenant.business._id, companyId: company._id, archived: false } },
        { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$amount' } } },
      ]),
      Task.find({ businessId: tenant.business._id, companyId: id, status: 'pending' })
        .populate('assignedTo', 'firstName lastName email')
        .sort({ dueDate: 1 })
        .limit(20)
        .lean(),
      Lead.find({ businessId: tenant.business._id, companyId: id, archived: false })
        .select('_id')
        .lean(),
    ]);

    const leadIds = companyLeads.map((l) => l._id);
    const meetings = leadIds.length
      ? await MeetingBooking.find({
          businessId: tenant.business._id,
          leadId: { $in: leadIds },
          status: { $in: ['scheduled', 'confirmed'] },
        })
          .sort({ startTime: 1 })
          .limit(20)
          .lean()
      : [];

    const summary = buildCompanySummary(company, contacts, deals);

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        timeline: timeline.items,
        contacts,
        deals,
        notes,
        attachments,
        analytics,
        tasks,
        meetings,
        summary,
      },
    });
  } catch (error) {
    console.error('[Company GET]', error);
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

    const company = await Company.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null });
    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });

    const wasArchived = company.archived;
    const allowed = ['name', 'domain', 'industry', 'employeeCount', 'annualRevenue', 'revenueCurrency', 'website', 'phone', 'email', 'address', 'socialLinks', 'description', 'ownerId', 'tags', 'customFields', 'logo', 'archived', 'status', 'gstNumber', 'primaryContactId'];
    for (const key of allowed) {
      if (body[key] !== undefined) company[key] = body[key];
    }
    company.updatedBy = tenant.user._id;
    await company.save();

    const eventType = body.archived === true && !wasArchived ? 'company_updated' : 'company_updated';
    const eventDesc = body.archived === true && !wasArchived ? 'Company archived' : 'Company updated';

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: 'company',
      entityId: id,
      type: eventType,
      description: eventDesc,
      performedBy: tenant.user._id,
    });

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error('[Company PUT]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const company = await Company.findOne({ _id: id, businessId: tenant.business._id });
    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });

    await company.softDelete(tenant.user._id);
    return NextResponse.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    console.error('[Company DELETE]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
