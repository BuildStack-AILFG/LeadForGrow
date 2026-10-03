import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Event from '@/models/automation/Event';
import Lead from '@/models/automation/Lead';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const businessId = tenant.business._id;

    const events = await Event.find({ businessId })
      .populate('formId', 'name token')
      .sort({ date: -1 })
      .lean();

    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const [leadCount, conversionCount] = await Promise.all([
          Lead.countDocuments({ eventId: event._id }),
          Lead.countDocuments({ eventId: event._id, status: 'converted' }),
        ]);
        return { ...event, leadCount, conversionCount };
      })
    );

    return NextResponse.json({ success: true, data: enrichedEvents });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const body = await req.json();
    const { name, description, date, location, formId, sequenceId } = body;

    if (!name || !formId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const newEvent = await Event.create({
      businessId: tenant.business._id,
      name,
      description,
      date: date || new Date(),
      location,
      formId: formId === '' ? null : formId,
      sequenceId: sequenceId === '' ? null : sequenceId,
    });

    return NextResponse.json({ success: true, data: newEvent });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
