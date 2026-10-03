import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { createBooking } from '@/lib/meetings/bookingEngine';
import { processPendingReminders } from '@/lib/meetings/reminders';
import { withRateLimit } from '@/lib/rateLimit';

async function postHandler(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { slug, startTime, guest } = body;

    if (!slug || !startTime || !guest?.name) {
      return NextResponse.json(
        { success: false, error: 'slug, startTime, and guest name are required' },
        { status: 400 }
      );
    }

    if (!guest?.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required for confirmation' },
        { status: 400 }
      );
    }

    const result = await createBooking({
      slug: slug.toLowerCase(),
      startTime,
      guest,
      source: body.source || 'booking_link',
    });

    return NextResponse.json({
      success: true,
      data: {
        bookingId: result.booking._id,
        startTime: result.booking.startTime,
        endTime: result.booking.endTime,
        meetingLink: result.booking.meetingLink,
        whatsappSent: result.booking.whatsappConfirmationSent,
        emailSent: result.booking.emailConfirmationSent,
        hostName: result.business?.businessName,
        meetingTitle: result.meetingType.title,
      },
    });
  } catch (error) {
    console.error('[Book Meeting]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Booking failed' },
      { status: 400 }
    );
  }
}

export const POST = withRateLimit(5, 60, postHandler);
