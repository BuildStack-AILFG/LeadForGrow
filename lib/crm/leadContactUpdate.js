/**
 * Contact edits on a lead (phone / email), e.g. adding a phone number to an Instagram or Messenger lead.
 *
 * Pure apart from the injected `findClash`, so the rules can be unit-tested without a database:
 *  - phones are stored as digits only, like leads created from WhatsApp (see customerMatching.normalizePhone)
 *  - 8-15 digits (E.164 max), so the country code must be included
 *  - a number that already belongs to ANOTHER lead of the same business (same digits, or same last 10 digits)
 *    is rejected instead of silently creating a duplicate
 *  - an empty value is ignored (this endpoint adds/changes contact data, it never clears it)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mongo filter for "another lead in this business already uses this number". */
export function phoneClashFilter({ businessId, leadId, digits }) {
  // Last 10 digits, allowing spaces / dashes / brackets between them, so leads saved as "+91 98765-43210" still match.
  const tail = digits.slice(-10).split('').join('\\D*') + '$';
  return {
    businessId,
    _id: { $ne: leadId },
    $or: [{ phone: digits }, { whatsappId: digits }, { phone: { $regex: tail } }, { whatsappId: { $regex: tail } }],
  };
}

/**
 * @param {{ body: object, lead: object, findClash: (digits: string) => Promise<{name?: string}|null> }} args
 * @returns {Promise<{ updates: object } | { error: string, status: number }>}
 */
export async function buildContactUpdates({ body = {}, lead, findClash }) {
  const updates = {};

  if (body.phone !== undefined) {
    const digits = String(body.phone || '').replace(/\D/g, '');
    if (digits) {
      if (digits.length < 8 || digits.length > 15) {
        return { error: 'Enter a valid phone number with country code', status: 400 };
      }
      const clash = await findClash(digits);
      if (clash) {
        return { error: `This number already belongs to another lead (${clash.name || 'unnamed'})`, status: 409 };
      }
      updates.phone = digits;
      if (!lead?.whatsapp) updates.whatsapp = digits;
    }
  }

  if (body.email !== undefined) {
    const email = String(body.email || '').trim().toLowerCase();
    if (email) {
      if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address', status: 400 };
      updates.email = email;
    }
  }

  return { updates };
}

export default { phoneClashFilter, buildContactUpdates };
