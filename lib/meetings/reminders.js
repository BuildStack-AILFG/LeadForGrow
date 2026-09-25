import MeetingReminder from '@/models/meetings/MeetingReminder';
import Business from '@/models/Business';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { sendMeetingEmail } from '@/lib/meetings/email';
import {
  DEFAULT_WHATSAPP_CONFIRMATION,
  DEFAULT_WHATSAPP_REMINDER,
  DEFAULT_NO_SHOW_RECOVERY,
  DEFAULT_EMAIL_CONFIRMATION,
  DEFAULT_EMAIL_REMINDER,
  DEFAULT_REMINDER_SCHEDULE,
} from './constants';

function renderTemplate(template, vars) {
  let out = template || '';
  Object.entries(vars).forEach(([key, val]) => {
    out = out.replace(new RegExp(`{{${key}}}`, 'g'), val ?? '');
  });
  return out;
}

/**
 * Ordered resolvedVars for Meta template body params. The order MUST match
 * how the approved template's {{1}}..{{n}} placeholders were written.
 * Convention used for LeadForGrow meeting templates:
 *   {{1}} = guest name
 *   {{2}} = meeting title
 *   {{3}} = business name
 *   {{4}} = date/time
 *   {{5}} = meeting link
 */
function resolvedVarsFromBooking({ guestName, meetingTitle, businessName, dateTime, meetingLink }) {
  return [
    guestName || 'there',
    meetingTitle || 'your meeting',
    businessName || 'our team',
    dateTime || '',
    meetingLink || '',
  ];
}

export async function scheduleBookingReminders({ booking, meetingType, business }) {
  const rules = meetingType.automationRules || {};
  const reminders = [];

  // --- Immediate confirmations ---
  if (rules.whatsappConfirmation !== false) {
    reminders.push({
      businessId: booking.businessId,
      bookingId: booking._id,
      channel: 'whatsapp',
      type: 'confirmation',
      scheduledFor: new Date(),
      payload: {
        template: rules.whatsappConfirmationTemplate,
        templateName: rules.whatsappConfirmationTemplateName || null,
        templateLanguage: rules.whatsappConfirmationTemplateLanguage || 'en',
        label: 'Confirmation',
      },
    });
  }

  if (rules.emailReminder !== false && booking.guest?.email) {
    reminders.push({
      businessId: booking.businessId,
      bookingId: booking._id,
      channel: 'email',
      type: 'confirmation',
      scheduledFor: new Date(),
      payload: {
        template: rules.emailConfirmationTemplate || DEFAULT_EMAIL_CONFIRMATION,
        label: 'Confirmation',
      },
    });
  }

  // --- Sequence of "join the meeting" reminders ---
  const scheduleSource =
    Array.isArray(rules.reminderSchedule) && rules.reminderSchedule.length > 0
      ? rules.reminderSchedule
      : DEFAULT_REMINDER_SCHEDULE;

  const startTime = new Date(booking.startTime);
  const now = new Date();

  for (const step of scheduleSource) {
    const minutes = Number(step.minutesBefore);
    if (!Number.isFinite(minutes) || minutes < 0) continue;

    const scheduledFor = new Date(startTime.getTime() - minutes * 60000);
    if (scheduledFor <= now) continue; // Skip steps that are already in the past

    const wantWhatsApp = step.whatsapp !== false && rules.whatsappReminder !== false;
    const wantEmail =
      step.email !== false && rules.emailReminder !== false && !!booking.guest?.email;

    if (wantWhatsApp) {
      reminders.push({
        businessId: booking.businessId,
        bookingId: booking._id,
        channel: 'whatsapp',
        type: 'reminder',
        scheduledFor,
        payload: {
          minutes,
          label: step.label || `${minutes} minutes before`,
          template:
            step.whatsappMessageTemplate ||
            rules.whatsappReminderTemplate ||
            DEFAULT_WHATSAPP_REMINDER,
          templateName:
            step.whatsappTemplateName || rules.whatsappReminderTemplateName || null,
          templateLanguage:
            step.whatsappTemplateLanguage ||
            rules.whatsappReminderTemplateLanguage ||
            'en',
        },
      });
    }

    if (wantEmail) {
      reminders.push({
        businessId: booking.businessId,
        bookingId: booking._id,
        channel: 'email',
        type: 'reminder',
        scheduledFor,
        payload: {
          minutes,
          label: step.label || `${minutes} minutes before`,
          template:
            step.emailBodyTemplate ||
            rules.emailReminderTemplate ||
            DEFAULT_EMAIL_REMINDER,
          subject: step.emailSubject || null,
        },
      });
    }
  }

  if (reminders.length) {
    await MeetingReminder.insertMany(reminders);
    booking.remindersScheduled = true;
    await booking.save();
  }

  // Process confirmation emails/WhatsApp immediately (don't wait for cron)
  await processPendingReminders(20);

  return booking;
}

export async function processPendingReminders(limit = 50) {
  const pending = await MeetingReminder.find({
    status: 'pending',
    scheduledFor: { $lte: new Date() },
  })
    .sort({ scheduledFor: 1 })
    .limit(limit);

  const results = [];

  for (const reminder of pending) {
    try {
      const booking = await (
        await import('@/models/meetings/MeetingBooking')
      ).default.findById(reminder.bookingId);

      if (!booking || booking.status === 'cancelled') {
        reminder.status = 'cancelled';
        await reminder.save();
        continue;
      }

      const business = await Business.findById(reminder.businessId);
      if (!business) throw new Error('Business not found');

      const MeetingType = (await import('@/models/meetings/MeetingType')).default;
      const meetingType = await MeetingType.findById(booking.meetingTypeId);

      const dateTime = new Date(booking.startTime).toLocaleString('en-IN', {
        timeZone:
          booking.timezone || meetingType?.availabilityRules?.timezone || 'Asia/Kolkata',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const vars = {
        name: booking.guest?.name || 'there',
        meetingTitle: meetingType?.title || 'meeting',
        businessName: business.businessName || 'our team',
        dateTime,
        minutes: reminder.payload?.minutes ?? 30,
        meetingLink: booking.meetingLink || '',
        rebookLink: booking.rebookToken
          ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/book/${meetingType?.bookingSlug}?rebook=${booking.rebookToken}`
          : '',
      };

      if (reminder.channel === 'email') {
        const template =
          reminder.payload?.template ||
          (reminder.type === 'reminder' ? DEFAULT_EMAIL_REMINDER : DEFAULT_EMAIL_CONFIRMATION);
        const rendered = renderTemplate(template, vars);
        const subject = reminder.payload?.subject
          ? renderTemplate(reminder.payload.subject, vars)
          : null;

        const emailResult = await sendMeetingEmail({
          booking,
          meetingType,
          business,
          type: reminder.type,
          templateOverride: rendered,
          subjectOverride: subject,
        });

        reminder.status = emailResult.success ? 'sent' : 'failed';
        reminder.sentAt = new Date();
        reminder.error = emailResult.error || emailResult.reason;
        await reminder.save();

        if (reminder.type === 'confirmation' && emailResult.success) {
          booking.emailConfirmationSent = true;
          await booking.save();
        }

        results.push({ id: reminder._id, channel: 'email', status: reminder.status });
        continue;
      }

      const lead = {
        _id: booking.leadId || null,
        name: booking.guest?.name || 'there',
        phone: booking.guest?.phone || booking.guest?.whatsapp,
        whatsapp: booking.guest?.whatsapp || booking.guest?.phone,
        email: booking.guest?.email,
      };

      let template = DEFAULT_WHATSAPP_CONFIRMATION;
      if (reminder.type === 'reminder') template = DEFAULT_WHATSAPP_REMINDER;
      if (reminder.type === 'no_show_recovery') template = DEFAULT_NO_SHOW_RECOVERY;
      if (reminder.payload?.template) template = reminder.payload.template;

      const message = renderTemplate(template, vars);
      const templateName = reminder.payload?.templateName || null;
      const templateLanguage = reminder.payload?.templateLanguage || 'en';

      const resolvedVars = templateName
        ? resolvedVarsFromBooking({
            guestName: vars.name,
            meetingTitle: vars.meetingTitle,
            businessName: vars.businessName,
            dateTime: vars.dateTime,
            meetingLink: vars.meetingLink,
          })
        : null;

      const waResult = await sendAutoWhatsApp(
        lead,
        business,
        message,
        templateName,
        null,
        templateLanguage,
        null,
        resolvedVars,
        { source: 'meeting_reminder', reminderType: reminder.type, bookingId: String(booking._id) },
        { origin: 'meeting' }
      );

      reminder.status = waResult.success ? 'sent' : 'failed';
      reminder.sentAt = new Date();
      reminder.error = waResult.error || waResult.reason;
      await reminder.save();

      if (reminder.type === 'confirmation' && waResult.success) {
        booking.whatsappConfirmationSent = true;
        await booking.save();
      }

      results.push({ id: reminder._id, channel: 'whatsapp', status: reminder.status });
    } catch (err) {
      reminder.status = 'failed';
      reminder.error = err.message;
      await reminder.save();
      results.push({ id: reminder._id, status: 'failed', error: err.message });
    }
  }

  return results;
}

export async function triggerNoShowRecovery(booking, meetingType, business) {
  const rebookToken = booking.rebookToken || (await import('./crmSync')).generateRebookToken();
  booking.rebookToken = rebookToken;
  booking.status = 'no_show';
  booking.noShowAt = new Date();
  booking.noShowRecoverySent = true;
  await booking.save();

  await MeetingReminder.create({
    businessId: booking.businessId,
    bookingId: booking._id,
    channel: 'whatsapp',
    type: 'no_show_recovery',
    scheduledFor: new Date(),
    payload: {},
  });

  if (meetingType.automationRules?.noShowRecoverySequenceId) {
    // Sequence trigger hook — future: enqueue sequence execution
  }

  return booking;
}
