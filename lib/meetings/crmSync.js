import Lead from '@/models/automation/Lead';
import Activity from '@/models/automation/Activity';
import Task from '@/models/automation/Task';
import crypto from 'crypto';

/**
 * Create or update CRM lead and log meeting activity on booking.
 */
export async function syncBookingToCrm({
  business,
  meetingType,
  booking,
  guest,
  performedBy = null,
}) {
  const businessId = business._id;
  let lead = null;

  const phone = (guest.phone || guest.whatsapp || '').replace(/\D/g, '');
  const email = guest.email?.toLowerCase();

  if (phone || email) {
    const query = { businessId, archived: false };
    if (phone) query.$or = [{ phone }, { whatsapp: phone }];
    else if (email) query.email = email;

    lead = await Lead.findOne(
      phone && email
        ? { businessId, archived: false, $or: [{ phone }, { whatsapp: phone }, { email }] }
        : query
    );
  }

  if (!lead) {
    lead = await Lead.create({
      businessId,
      name: guest.name,
      email: guest.email,
      phone: guest.phone || guest.whatsapp,
      whatsapp: guest.whatsapp || guest.phone,
      source: 'form',
      sourceDetails: `Meeting: ${meetingType.title}`,
      status: meetingType.automationRules?.leadStatusOnBook || 'interested',
      assignedTo: booking.assignedTo,
      serviceInterest: meetingType.title,
      message: guest.notes,
      isRead: false,
    });

    // Real-time: notify the workspace (sound + toast) of the new lead.
    try {
      const { emitLeadUpdated } = await import('@/lib/realtime/publish');
      emitLeadUpdated(businessId, { leadId: lead._id, action: 'created', source: 'form' }).catch(() => {});
    } catch (err) {
      console.warn('[syncBookingToCrm] emitLeadUpdated failed:', err.message);
    }
  } else {
    const updates = { assignedTo: booking.assignedTo || lead.assignedTo };
    if (meetingType.automationRules?.leadStatusOnBook) {
      updates.status = meetingType.automationRules.leadStatusOnBook;
    }
    lead = await Lead.findByIdAndUpdate(lead._id, updates, { new: true });
  }

  booking.leadId = lead._id;
  await booking.save();

  try {
    await Activity.create({
      businessId,
      leadId: lead._id,
      type: 'meeting_booked',
      description: `Meeting booked: ${meetingType.title} on ${new Date(booking.startTime).toLocaleString()}`,
      metadata: {
        bookingId: booking._id,
        meetingTypeId: meetingType._id,
        startTime: booking.startTime,
        category: meetingType.category,
      },
      performedBy,
    });
  } catch (activityErr) {
    console.error('[Meetings CRM] Activity log failed (booking still saved):', activityErr.message);
  }

  if (meetingType.automationRules?.pipelineStageOnBook) {
    await Task.create({
      businessId,
      leadId: lead._id,
      title: `Follow up after ${meetingType.title}`,
      description: `Pipeline stage: ${meetingType.automationRules.pipelineStageOnBook}`,
      type: 'follow_up',
      status: 'pending',
      dueDate: booking.endTime,
      assignedTo: booking.assignedTo,
      priority: 'medium',
    });
  }

  try {
    const { dispatchAutomationEvent } = await import('@/lib/automation/triggerHub');
    await dispatchAutomationEvent(lead, 'meeting_scheduled', { bookingId: booking._id, meetingTypeId: meetingType._id });
  } catch (dispatchErr) {
    console.error('[Meetings CRM] dispatchAutomationEvent failed:', dispatchErr.message);
  }

  return lead;
}

export function generateRebookToken() {
  return crypto.randomBytes(16).toString('hex');
}
