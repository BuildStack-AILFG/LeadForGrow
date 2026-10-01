import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import MeetingBooking from '@/models/meetings/MeetingBooking';
import Activity from '@/models/automation/Activity';
import Lead from '@/models/automation/Lead';
import Task from '@/models/automation/Task';
import { triggerNoShowRecovery } from '@/lib/meetings/reminders';
import MeetingType from '@/models/meetings/MeetingType';
import Business from '@/models/Business';

const OUTCOME_STATUSES = ['completed', 'no_show', 'cancelled'];

/** Close the host's "update meeting outcome" task once an outcome is recorded. */
async function closeOutcomeTasks(booking, userId, status) {
  await Task.updateMany(
    { businessId: booking.businessId, meetingBookingId: booking._id, status: 'pending' },
    status === 'cancelled'
      ? { $set: { status: 'cancelled' } }
      : { $set: { status: 'completed', completedAt: new Date(), completedBy: userId } },
  ).catch((err) => console.error('[Meetings] closing outcome task failed:', err.message));
}

/** Fire meeting_completed / meeting_no_show so sequences and rules can follow up. */
async function dispatchOutcome(booking, eventType) {
  if (!booking.leadId) return;
  try {
    const lead = await Lead.findById(booking.leadId);
    if (!lead) return;
    const { dispatchAutomationEvent } = await import('@/lib/automation/triggerHub');
    await dispatchAutomationEvent(lead, eventType, { bookingId: booking._id, meetingTypeId: booking.meetingTypeId });
  } catch (err) {
    console.error(`[Meetings] dispatch ${eventType} failed:`, err.message);
  }
}

export const PATCH = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const booking = await MeetingBooking.findOne({
      _id: id,
      businessId: req.user.businessId,
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Recording the same outcome twice must not resend messages or refire automations.
    const repeatOutcome = OUTCOME_STATUSES.includes(body.status) && booking.status === body.status;

    if (body.status === 'no_show') {
      if (repeatOutcome) return NextResponse.json({ success: true, data: booking });
      const meetingType = await MeetingType.findById(booking.meetingTypeId);
      const business = await Business.findById(booking.businessId);
      await triggerNoShowRecovery(booking, meetingType, business);
      if (booking.leadId) {
        await Activity.create({
          businessId: booking.businessId,
          leadId: booking.leadId,
          type: 'meeting_no_show',
          description: `No-show: ${meetingType?.title || 'meeting'}`,
          metadata: { bookingId: booking._id },
          performedBy: req.user.userId,
        });
      }
      await closeOutcomeTasks(booking, req.user.userId, 'no_show');
      await dispatchOutcome(booking, 'meeting_no_show');
      return NextResponse.json({ success: true, data: booking });
    }

    const updates = {};
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'completed') updates.completedAt = new Date();
      if (body.status === 'cancelled') updates.cancelledAt = new Date();
    }
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.revenueValue !== undefined) updates.revenueValue = body.revenueValue;

    const updated = await MeetingBooking.findOneAndUpdate({ _id: booking._id, businessId: req.user.businessId }, updates, { new: true });

    if (!repeatOutcome && body.status === 'completed') {
      if (updated.leadId) {
        await Activity.create({
          businessId: updated.businessId,
          leadId: updated.leadId,
          type: 'meeting_completed',
          description: 'Meeting completed successfully',
          metadata: { bookingId: updated._id },
          performedBy: req.user.userId,
        });
      }
      await closeOutcomeTasks(updated, req.user.userId, 'completed');
      await dispatchOutcome(updated, 'meeting_completed');
    }
    if (!repeatOutcome && body.status === 'cancelled') {
      await closeOutcomeTasks(updated, req.user.userId, 'cancelled');
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
