export const MEETING_CATEGORY_LABELS = {
  demo_call: 'Demo Call',
  consultation: 'Consultation',
  sales_call: 'Sales Call',
  onboarding: 'Onboarding',
  team_meeting: 'Team Meeting',
  interview: 'Interview',
  support_session: 'Support Session',
};

export const DEFAULT_FORM_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone / WhatsApp', type: 'phone', required: true },
];

export const DEFAULT_WHATSAPP_CONFIRMATION =
  'Hi {{name}}! Your {{meetingTitle}} with {{businessName}} is confirmed for {{dateTime}}. We look forward to speaking with you. Reply here if you need to reschedule.';

export const DEFAULT_WHATSAPP_REMINDER =
  'Reminder: Your {{meetingTitle}} with {{businessName}} starts in {{startsIn}}. Join: {{meetingLink}}';

export const DEFAULT_NO_SHOW_RECOVERY =
  'Hi {{name}}, we missed you at today\'s {{meetingTitle}}. Would you like to rebook? {{rebookLink}}';

export const DEFAULT_EMAIL_CONFIRMATION =
  'Your {{meetingTitle}} with {{businessName}} is confirmed for {{dateTime}}.';

export const DEFAULT_EMAIL_REMINDER =
  'Reminder: Your {{meetingTitle}} with {{businessName}} starts in {{startsIn}}.';

// Default multi-step "join the meeting" sequence, in order of when each step fires.
// Both WhatsApp + Email are sent at every step unless disabled per meeting type.
export const DEFAULT_REMINDER_SCHEDULE = [
  {
    label: '24 hours before',
    minutesBefore: 24 * 60,
    whatsapp: true,
    email: true,
    whatsappMessageTemplate:
      'Hi {{name}}, reminder: your {{meetingTitle}} with {{businessName}} is tomorrow at {{dateTime}}. Join link: {{meetingLink}}',
    emailSubject: 'Tomorrow: {{meetingTitle}} with {{businessName}}',
    emailBodyTemplate:
      'Hi {{name}}, this is a friendly reminder that your {{meetingTitle}} with {{businessName}} is scheduled for {{dateTime}}. Save the join link so you are ready: {{meetingLink}}',
  },
  {
    label: '1 hour before',
    minutesBefore: 60,
    whatsapp: true,
    email: true,
    whatsappMessageTemplate:
      'Starting in 1 hour: {{meetingTitle}} with {{businessName}} at {{dateTime}}. Join here: {{meetingLink}}',
    emailSubject: 'Starting in 1 hour: {{meetingTitle}}',
    emailBodyTemplate:
      'Hi {{name}}, your {{meetingTitle}} with {{businessName}} starts in about 1 hour ({{dateTime}}). Join link: {{meetingLink}}',
  },
  {
    label: '15 minutes before',
    minutesBefore: 15,
    whatsapp: true,
    email: true,
    whatsappMessageTemplate:
      '{{meetingTitle}} starts in 15 minutes. Tap to join: {{meetingLink}}',
    emailSubject: '{{meetingTitle}} starts in 15 minutes',
    emailBodyTemplate:
      'Hi {{name}}, {{meetingTitle}} with {{businessName}} starts in 15 minutes. Join link: {{meetingLink}}',
  },
];

export const MEETING_STATUS_COLORS = {
  scheduled: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  confirmed: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  no_show: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  rescheduled: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
};

/** "1 day", "3 hours", "30 minutes" — for {{startsIn}} in reminder messages. */
export function formatStartsIn(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m >= 1440 && m % 1440 === 0) return m === 1440 ? '1 day' : `${m / 1440} days`;
  if (m >= 60 && m % 60 === 0) return m === 60 ? '1 hour' : `${m / 60} hours`;
  return m === 1 ? '1 minute' : `${m} minutes`;
}

/** Reminder times offered in the meeting setup (minutes before the start). */
export const REMINDER_TIME_OPTIONS = [1440, 180, 60, 30, 15];

/**
 * Build a reminderSchedule from chosen times. Times that match a default step
 * keep its tailored wording; others use the generic reminder text.
 */
export function buildReminderSchedule(minutesList = []) {
  return [...new Set(minutesList.map(Number).filter((m) => Number.isFinite(m) && m > 0))]
    .sort((a, b) => b - a)
    .map((m) => {
      const preset = DEFAULT_REMINDER_SCHEDULE.find((s) => s.minutesBefore === m);
      return preset ? { ...preset } : { label: `${formatStartsIn(m)} before`, minutesBefore: m, whatsapp: true, email: true };
    });
}
