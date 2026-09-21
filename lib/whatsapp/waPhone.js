/**
 * WhatsApp needs the international number without "+" (wa.me and the Cloud API). Leads often store an Indian
 * mobile as 10 digits ("9986030563"): without the country code, wa.me/9986030563 opens the wrong or an invalid
 * number. The API send path already added "91" to 10-digit numbers; every wa.me link now uses the same rule.
 */
export function toWhatsAppNumber(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * True when this lead has messaged us on WhatsApp before, so a conversation exists in the Inbox. Leads that came
 * from a call, a form or were added by hand have no WhatsApp conversation: the first message to them has to be an
 * approved template (WhatsApp does not allow free text to someone who has not written to you in the last 24 hours).
 */
export function hasWhatsAppHistory(lead) {
  return Boolean(lead && (lead.source === 'whatsapp' || lead.whatsappId));
}
