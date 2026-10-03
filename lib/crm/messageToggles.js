/**
 * Every automatic message the CRM can send to a CUSTOMER on its own (WhatsApp / email), as a settings toggle.
 *
 * Existing businesses: an unset toggle still means "on" (getCrmSettings uses !== false), so nothing changes for them.
 * New businesses: the toggles are stored explicitly as OFF when the business is created (see the pre-validate hook in
 * models/Business.js), so a new account never messages its customers until the owner turns a message on in
 * Settings -> CRM -> Message automation.
 *
 * No imports on purpose: models/Business.js imports this file.
 */
export const CRM_CUSTOMER_MESSAGE_TOGGLES = [
  'sendWelcomeWhatsApp', 'sendWelcomeEmail',
  'sendMeetingWhatsApp', 'sendMeetingEmail',
  'sendQuotationWhatsApp', 'sendQuotationEmail',
  'sendPaymentReminderWhatsApp', 'sendPaymentReminderEmail',
  'sendWonThanksWhatsApp', 'sendWonThanksEmail',
];

/** The crm settings for a brand-new business: every customer message OFF unless the caller explicitly set it. */
export function withNewBusinessMessageDefaults(crm = {}) {
  const out = { ...(crm || {}) };
  for (const key of CRM_CUSTOMER_MESSAGE_TOGGLES) {
    if (out[key] === undefined) out[key] = false;
  }
  return out;
}

export default { CRM_CUSTOMER_MESSAGE_TOGGLES, withNewBusinessMessageDefaults };
