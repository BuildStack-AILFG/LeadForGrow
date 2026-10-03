import { sendCustomerEmail } from '@/lib/integrations/email';
import { sendResendEmail } from '@/lib/resend';
import { formatStartsIn } from '@/lib/meetings/constants';

function formatDateTime(date, timezone = 'Asia/Kolkata') {
  try {
    return new Date(date).toLocaleString('en-IN', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return new Date(date).toLocaleString();
  }
}

function buildMeetingEmailHtml({
  guestName,
  businessName,
  meetingTitle,
  dateTime,
  meetingLink,
  bodyText,
  accentColor = '#4338ca',
}) {
  const firstName = (guestName || 'there').split(' ')[0];
  const linkBlock = meetingLink
    ? `<div style="text-align:center;margin:28px 0;">
        <a href="${meetingLink}" style="display:inline-block;background:${accentColor};color:#fff;padding:14px 28px;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">Join meeting</a>
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin:0; padding:0; background:#f4f6fa; font-family:'Segoe UI',system-ui,sans-serif; }
    .wrap { max-width:560px; margin:32px auto; background:#fff; border-radius:20px; overflow:hidden; border:1px solid #e8ecf1; }
    .head { background:linear-gradient(135deg, ${accentColor} 0%, #1e1b4b 100%); padding:32px 28px; color:#fff; }
    .head h1 { margin:0; font-size:22px; font-weight:700; }
    .head p { margin:8px 0 0; opacity:0.9; font-size:14px; }
    .body { padding:28px; color:#334155; font-size:15px; line-height:1.65; }
    .card { background:#f8fafc; border-radius:12px; padding:16px 18px; margin:20px 0; border:1px solid #e2e8f0; }
    .card strong { color:#0f172a; display:block; margin-bottom:6px; }
    .footer { padding:20px 28px; border-top:1px solid #f1f5f9; font-size:12px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>${meetingTitle}</h1>
      <p>${businessName}</p>
    </div>
    <div class="body">
      <p>Hi ${firstName},</p>
      <p>${bodyText}</p>
      <div class="card">
        <strong>When</strong>
        ${dateTime}
      </div>
      ${linkBlock}
      <p style="font-size:13px;color:#64748b;">Need to reschedule? Reply to this email or contact us on WhatsApp.</p>
    </div>
    <div class="footer">Sent via LeadForGrow Revenue Scheduling</div>
  </div>
</body>
</html>`;
}

/**
 * Send meeting email — business SMTP first, then Resend fallback.
 */
export async function sendMeetingEmail({
  booking,
  meetingType,
  business,
  type = 'confirmation',
  templateOverride,
  subjectOverride,
  minutes,
}) {
  const email = booking.guest?.email?.trim();
  if (!email) {
    return { success: false, reason: 'no_email', error: 'Guest email not provided' };
  }

  const businessName = business.businessName || 'Our team';
  const meetingTitle = meetingType?.title || 'Your meeting';
  const dateTime = formatDateTime(
    booking.startTime,
    booking.timezone || meetingType?.availabilityRules?.timezone
  );
  const accent = meetingType?.branding?.accentColor || '#4338ca';
  const meetingLink = booking.meetingLink || '';

  const vars = {
    name: booking.guest.name,
    meetingTitle,
    businessName,
    dateTime,
    meetingLink,
    // The reminder step's own timing (24h / 1h / …), not a fixed setting.
    minutes: minutes ?? 30,
    startsIn: formatStartsIn(minutes ?? 30),
  };

  let bodyText =
    type === 'reminder'
      ? `Reminder: your ${meetingTitle} starts in ${vars.startsIn}.`
      : `Your ${meetingTitle} is confirmed. We look forward to meeting you.`;

  if (templateOverride) {
    bodyText = templateOverride.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
  }

  const subject =
    subjectOverride ||
    (type === 'reminder'
      ? `Reminder: ${meetingTitle} in ${vars.startsIn} — ${businessName}`
      : `Confirmed: ${meetingTitle} — ${businessName}`);

  const html = buildMeetingEmailHtml({
    guestName: booking.guest.name,
    businessName,
    meetingTitle,
    dateTime,
    meetingLink,
    bodyText,
    accentColor: accent,
  });

  const leadLike = {
    name: booking.guest.name,
    email,
    serviceInterest: meetingTitle,
  };

  const emailConfig = business.integrationCredentials?.email;
  if (emailConfig?.enabled) {
    const plainTemplate = `${bodyText}\n\nWhen: ${dateTime}${meetingLink ? `\nJoin: ${meetingLink}` : ''}`;
    // Tag as meeting so the inbox filter can group booking confirmations
    // and reminders separately from marketing automations. booking.leadId
    // (if present) enables reply threading; ad-hoc bookings without a lead
    // fall through to Resend without a Message row.
    const result = await sendCustomerEmail(
      { ...leadLike, _id: booking.leadId },
      business,
      plainTemplate,
      subject,
      { origin: 'meeting' }
    );
    if (result.success) return result;
    console.warn('[Meeting Email] Business SMTP failed, trying Resend:', result.error);
  }

  const fromName = emailConfig?.fromName || businessName;
  return sendResendEmail({
    to: email,
    from: `${fromName} <info@leadforgrow.com>`,
    subject,
    html,
    text: `${bodyText}\n\nWhen: ${dateTime}${meetingLink ? `\nJoin: ${meetingLink}` : ''}`,
  });
}
