/**
 * Merge lead/business/meeting context for email & WhatsApp templates.
 */
export function buildTemplateContext(lead, business = {}, extra = {}) {
  const metadata = lead?.metadata instanceof Map
    ? Object.fromEntries(lead.metadata)
    : (lead?.metadata || {});

  const meeting = extra.meeting || metadata.scheduledMeeting || {};
  const salesperson = extra.salesperson || metadata.salespersonName || 'our team';

  return {
    customer_name: lead?.name || 'there',
    lead_name: lead?.name || 'there',
    name: lead?.name || 'there',
    phone: lead?.phone || '',
    email: lead?.email || '',
    serviceInterest: lead?.serviceInterest || '',
    company: business?.businessName || metadata.businessName || 'LeadForGrow',
    business_name: business?.businessName || 'LeadForGrow',
    salesperson,
    meeting_date: meeting.date || extra.meetingDate || '',
    meeting_time: meeting.time || extra.meetingTime || '',
    meeting_link: meeting.link || extra.meetingLink || '',
    meeting_duration: meeting.duration || extra.meetingDuration || '',
    meeting_platform: meeting.platform || extra.meetingPlatform || '',
    quotation_message: extra.quotationMessage || metadata.quotationMessage || '',
    quotation_url: extra.quotationUrl || metadata.quotationUrl || '',
    'lead.name': lead?.name || 'there',
    'lead.email': lead?.email || '',
    'lead.phone': lead?.phone || '',
    'business.name': business?.businessName || 'LeadForGrow',
  };
}

export function renderCrmTemplate(template, context = {}) {
  if (!template) return '';
  return template.replace(/\{\{(.*?)\}\}/g, (match, field) => {
    const key = field.trim();
    return context[key] !== undefined ? String(context[key]) : match;
  });
}

export const DEFAULT_CRM_TEMPLATES = {
  welcome_email: 'Hi {{customer_name}},\n\nThank you for reaching out to {{company}}. {{salesperson}} will contact you shortly.',
  welcome_whatsapp: 'Hi {{customer_name}}, thanks for reaching out! Our team will contact you shortly.',
  meeting_email: 'Hi {{customer_name}},\n\nYour demo is scheduled on {{meeting_date}} at {{meeting_time}}.\nJoin: {{meeting_link}}\n\n— {{salesperson}}, {{company}}',
  meeting_whatsapp: 'Hi {{customer_name}}, your meeting is on {{meeting_date}} at {{meeting_time}}. Link: {{meeting_link}}',
  quotation_email: 'Hi {{customer_name}},\n\nPlease find our quotation attached.\n\n{{quotation_message}}\n\n— {{salesperson}}, {{company}}',
  quotation_whatsapp: 'Hi {{customer_name}}, we have sent your quotation. {{quotation_message}}',
  payment_reminder_email: 'Hi {{customer_name}},\n\nThis is a friendly reminder regarding your pending payment with {{company}}.',
  payment_reminder_whatsapp: 'Hi {{customer_name}}, please complete your payment. Reply if you need help.',
  won_email: "Thank you {{customer_name}}! We're excited to work with you.",
  won_whatsapp: "Thank you {{customer_name}}! We're excited to work with you.",
};

export default { buildTemplateContext, renderCrmTemplate, DEFAULT_CRM_TEMPLATES };
