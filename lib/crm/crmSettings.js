/**
 * CRM business settings — pipeline behavior, payment automation, lost reasons.
 */

export const LOST_REASONS = [
  { key: 'price', label: 'Price' },
  { key: 'competitor', label: 'Competitor' },
  { key: 'budget', label: 'Budget' },
  { key: 'no_response', label: 'No Response' },
  { key: 'timing', label: 'Timing' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'other', label: 'Other' },
];

export const UNQUALIFIED_REASONS = [
  { key: 'no_budget', label: 'No budget' },
  { key: 'wrong_industry', label: 'Wrong industry' },
  { key: 'student', label: 'Student' },
  { key: 'competitor', label: 'Competitor' },
  { key: 'duplicate', label: 'Duplicate' },
  { key: 'fake_enquiry', label: 'Fake enquiry' },
  { key: 'other', label: 'Other' },
];

export const PAYMENT_ON_CONFIRM_MODES = {
  NOTIFY_SALES: 'notify_sales',
  AUTO_MOVE_WON: 'auto_move_won',
};

export function getCrmSettings(business) {
  const crm = business?.settings?.crm || {};
  const templates = crm.templates || {};
  const emailSubjects = crm.emailSubjects || {};
  return {
    paymentOnConfirm: crm.paymentOnConfirm || PAYMENT_ON_CONFIRM_MODES.NOTIFY_SALES,
    autoCreateFollowUpTask: crm.autoCreateFollowUpTask !== false,
    defaultFollowUpHours: crm.defaultFollowUpHours ?? 24,
    notifyTeamOnNewLead: crm.notifyTeamOnNewLead !== false,
    sendWelcomeWhatsApp: crm.sendWelcomeWhatsApp !== false,
    sendWelcomeEmail: crm.sendWelcomeEmail !== false,
    sendMeetingWhatsApp: crm.sendMeetingWhatsApp !== false,
    sendMeetingEmail: crm.sendMeetingEmail !== false,
    sendQuotationWhatsApp: crm.sendQuotationWhatsApp !== false,
    sendQuotationEmail: crm.sendQuotationEmail !== false,
    sendPaymentReminderWhatsApp: crm.sendPaymentReminderWhatsApp !== false,
    sendPaymentReminderEmail: crm.sendPaymentReminderEmail !== false,
    sendWonThanksWhatsApp: crm.sendWonThanksWhatsApp !== false,
    sendWonThanksEmail: crm.sendWonThanksEmail !== false,
    runAiQualificationOnNewLead: crm.runAiQualificationOnNewLead !== false,
    lostNurtureAfterMonths: crm.lostNurtureAfterMonths ?? 3,
    requireLostReason: crm.requireLostReason !== false,
    meetingReminders: {
      hours24: crm.meetingReminders?.hours24 !== false,
      hours1: crm.meetingReminders?.hours1 !== false,
      minutes10: crm.meetingReminders?.minutes10 !== false,
    },
    paymentReminderDays: crm.paymentReminderDays ?? 3,
    templates: {
      welcomeEmail: templates.welcomeEmail || '',
      welcomeWhatsApp: templates.welcomeWhatsApp || '',
      meetingEmail: templates.meetingEmail || '',
      meetingWhatsApp: templates.meetingWhatsApp || '',
      quotationEmail: templates.quotationEmail || '',
      quotationWhatsApp: templates.quotationWhatsApp || '',
      paymentReminderEmail: templates.paymentReminderEmail || '',
      paymentReminderWhatsApp: templates.paymentReminderWhatsApp || '',
      wonEmail: templates.wonEmail || '',
      wonWhatsApp: templates.wonWhatsApp || '',
    },
    emailSubjects: {
      welcomeEmail: emailSubjects.welcomeEmail || '',
      meetingEmail: emailSubjects.meetingEmail || '',
      quotationEmail: emailSubjects.quotationEmail || '',
      paymentReminderEmail: emailSubjects.paymentReminderEmail || '',
      wonEmail: emailSubjects.wonEmail || '',
    },
  };
}

/** Strip read-only GET fields and persist only CRM config */
export function mergeCrmSettingsPayload(body = {}) {
  const out = {};
  const keys = [
    'paymentOnConfirm', 'requireLostReason', 'runAiQualificationOnNewLead',
    'autoCreateFollowUpTask', 'defaultFollowUpHours', 'notifyTeamOnNewLead',
    'sendWelcomeWhatsApp', 'sendWelcomeEmail',
    'sendMeetingWhatsApp', 'sendMeetingEmail',
    'sendQuotationWhatsApp', 'sendQuotationEmail',
    'sendPaymentReminderWhatsApp', 'sendPaymentReminderEmail',
    'sendWonThanksWhatsApp', 'sendWonThanksEmail',
    'lostNurtureAfterMonths', 'paymentReminderDays', 'meetingReminders',
  ];
  for (const key of keys) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (body.templates && typeof body.templates === 'object') {
    out.templates = { ...body.templates };
  }
  if (body.emailSubjects && typeof body.emailSubjects === 'object') {
    out.emailSubjects = { ...body.emailSubjects };
  }
  return out;
}

export default { getCrmSettings, mergeCrmSettingsPayload, LOST_REASONS, UNQUALIFIED_REASONS, PAYMENT_ON_CONFIRM_MODES };
