import { renderCrmTemplate, DEFAULT_CRM_TEMPLATES } from '@/lib/crm/templateVars';

/**
 * The "thank you" sent when a lead is marked Won / converted. It used to go out unconditionally to every lead with a
 * phone or email; it is now controlled by two toggles like every other customer message.
 *
 * Pure: returns what WOULD be sent, or null per channel when it must not be.
 *  - WhatsApp only when the lead has a phone AND settings.sendWonThanksWhatsApp
 *  - email only when the lead has an email AND settings.sendWonThanksEmail
 * Default texts equal the old hard-coded message, so existing businesses see no wording change.
 */
export function planWonThanks({ settings = {}, lead = {}, context = {} }) {
  const templates = settings.templates || {};
  const subjects = settings.emailSubjects || {};
  return {
    whatsapp: lead.phone && settings.sendWonThanksWhatsApp
      ? renderCrmTemplate(templates.wonWhatsApp || DEFAULT_CRM_TEMPLATES.won_whatsapp, context)
      : null,
    email: lead.email && settings.sendWonThanksEmail
      ? {
          body: renderCrmTemplate(templates.wonEmail || DEFAULT_CRM_TEMPLATES.won_email, context),
          subject: renderCrmTemplate(subjects.wonEmail || 'Thank you', context),
        }
      : null,
  };
}

export default { planWonThanks };
