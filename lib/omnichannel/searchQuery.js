/**
 * Pure helpers for the Inbox search (no DB, no React), so they can be unit tested.
 */

/** "+91 98110-39250", "98110 39250", "(415) 555-2671": nothing but digits and phone punctuation. */
export const looksLikePhone = (raw) => /^[\d\s+\-().]+$/.test(String(raw || '').trim()) && String(raw).replace(/\D/g, '').length >= 3;

/**
 * Regex source that finds these digits in a stored phone however it was formatted ("919811039250",
 * "+91 98110 39250", "98110-39250"): each digit may be followed by non-digits. Digits only, so nothing to escape.
 * null when the query is not phone-like.
 */
export function phoneSearchRegex(raw) {
  if (!looksLikePhone(raw)) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length > 15) return null;
  return digits.split('').join('\\D*');
}

/**
 * Every regex to try for a phone-like query. With a country code typed ("+91 99860 30563") the stored number may be
 * the bare 10 digits ("9986030563"), so the last 10 digits are tried as well.
 */
export function phoneSearchRegexes(raw) {
  const full = phoneSearchRegex(raw);
  if (!full) return [];
  const digits = String(raw).replace(/\D/g, '');
  const list = [full];
  if (digits.length > 10) list.push(phoneSearchRegex(digits.slice(-10)));
  return list;
}

/** Mongo $or clauses matching a lead by name / email / phone / WhatsApp number. `escaped` = regex-escaped query. */
export function leadSearchClauses(raw, escaped) {
  const plain = { $regex: escaped, $options: 'i' };
  const clauses = [{ name: plain }, { email: plain }, { phone: plain }, { whatsapp: plain }];
  for (const re of phoneSearchRegexes(raw)) {
    clauses.push({ phone: { $regex: re } }, { whatsapp: { $regex: re } }, { whatsappId: { $regex: re } });
  }
  return clauses;
}

/**
 * The Mongo filter for every section of the inbox search, in one place so a test can cast each one against its model.
 * (The route used to query Contact with `phones: regex` / `emails: regex`, but both are arrays of sub-documents
 * ({ number } / { address }), so Mongoose threw a CastError and the WHOLE search answered HTTP 500 for every query:
 * the results dropdown never appeared.)
 */
export function buildSearchFilters({ businessId, rawQ, escaped }) {
  const regex = { $regex: escaped, $options: 'i' };
  const phoneRegexes = phoneSearchRegexes(rawQ);
  return {
    messages: { businessId, $or: [{ 'content.body': regex }, { subject: regex }] },
    conversations: {
      businessId,
      $or: [
        { participantName: regex },
        { participantEmail: regex },
        { participantPhone: regex },
        ...phoneRegexes.map((re) => ({ participantPhone: { $regex: re } })),
        { lastMessagePreview: regex },
      ],
    },
    leads: { businessId, $or: leadSearchClauses(rawQ, escaped) },
    contacts: {
      businessId,
      $or: [
        { firstName: regex },
        { lastName: regex },
        { fullName: regex },
        { 'emails.address': regex },
        { 'phones.number': regex },
        ...phoneRegexes.map((re) => ({ 'phones.number': { $regex: re } })),
      ],
    },
    companies: { businessId, name: regex },
    deals: { businessId, title: regex },
  };
}

/** Which conversation to open for a lead: the WhatsApp one if any (that is what "message her" means), else the latest. */
export function pickConversationForLead(conversations = []) {
  if (!conversations.length) return null;
  const latest = (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
  const sorted = [...conversations].sort(latest);
  return sorted.find((c) => c.channel === 'whatsapp') || sorted[0];
}
