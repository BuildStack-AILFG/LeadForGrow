import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import MeetingBooking from '@/models/meetings/MeetingBooking';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { buildCalendarData } from '@/lib/crm/dashboardMetrics';

const MEETING_ACTIVE = ['scheduled', 'confirmed'];

// Lightweight, month-scoped sibling of /api/automation/dashboard — that route always
// builds the calendar for the CURRENT month with no way to ask for a different one.
// This lets the dashboard's Calendar card's "month" control actually navigate months
// without re-fetching the whole (much heavier) dashboard payload.
export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const businessId = tenant.business._id;

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = Number(searchParams.get('year')) || now.getFullYear();
    const month = searchParams.has('month') ? Number(searchParams.get('month')) : now.getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    const monthMeetings = await MeetingBooking.find({
      businessId,
      status: { $in: MEETING_ACTIVE },
      startTime: { $gte: monthStart, $lt: monthEnd },
    })
      .sort({ startTime: 1 })
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    const calendar = buildCalendarData(monthMeetings, year, month);

    return NextResponse.json({ success: true, data: calendar });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
