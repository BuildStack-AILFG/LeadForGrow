import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import MeetingType from '@/models/meetings/MeetingType';
import { getDashboardData } from '@/lib/meetings/bookingEngine';
import { DEFAULT_FORM_FIELDS } from '@/lib/meetings/constants';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');

    if (view === 'dashboard') {
      const data = await getDashboardData(req.user.businessId);
      return NextResponse.json({ success: true, data });
    }

    const types = await MeetingType.find({ businessId: req.user.businessId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: types });
  } catch (error) {
    console.error('[Meetings GET]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch meetings' }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const businessId = req.user.businessId;

    const slug =
      body.bookingSlug ||
      `${(body.title || 'meeting')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-4)}`;

    const existing = await MeetingType.findOne({ businessId, bookingSlug: slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Booking slug already in use' },
        { status: 400 }
      );
    }

    const meetingType = await MeetingType.create({
      businessId,
      title: body.title || 'New Meeting',
      description: body.description || '',
      category: body.category || 'sales_call',
      durationMinutes: body.durationMinutes || 30,
      bookingSlug: slug,
      status: body.status || 'draft',
      ownerId: body.ownerId || req.user.userId,
      hostIds: body.hostIds?.length ? body.hostIds : [req.user.userId],
      assignmentMode: body.assignmentMode || 'round_robin',
      availabilityRules: body.availabilityRules || {},
      automationRules: body.automationRules || {},
      branding: body.branding || {},
      formFields: body.formFields?.length ? body.formFields : DEFAULT_FORM_FIELDS,
      calendarIntegrations: body.calendarIntegrations || { googleMeet: true },
    });

    return NextResponse.json({ success: true, data: meetingType });
  } catch (error) {
    console.error('[Meetings POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) || 'Failed to create meeting' }, { status: 500 });
  }
});
