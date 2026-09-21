import { CONTACT_FORM_TOKEN, getFormSubmitUrl } from '@/lib/publicForms';

/** What the visitor picked on the Contact page, as it should read on the lead (Service interest). */
export const TOPIC_LABELS = {
  sales: 'Sales',
  support: 'Support',
  partners: 'Partnerships',
  media: 'Media',
};

const OK_FALLBACK = 'Thank you! We have received your message.';
const FAIL_FALLBACK = 'We could not send your message. Please try again.';
const NETWORK_FAIL = 'Network error. Please check your connection and try again.';

/**
 * Body for POST /api/forms/submit (the same endpoint and form token the homepage form and the enquiry widget use, so
 * messages land in the LeadForGrow CRM). `consent` is the visitor's cookie-consent choice (getConsentPayloadForForms).
 */
export function buildContactPayload(form, consent = {}) {
  const company = String(form.company || '').trim();
  return {
    token: CONTACT_FORM_TOKEN,
    name: String(form.name || '').trim(),
    email: String(form.email || '').trim(),
    message: String(form.message || '').trim(),
    serviceInterest: TOPIC_LABELS[form.topic] || 'General Inquiry',
    ...(company ? { company } : {}),
    ...consent,
  };
}

/** Sends the Contact page form. Never throws: resolves { ok: true, message } or { ok: false, error }. */
export async function submitContactForm(form, { consent = {}, fetchImpl = fetch, url = getFormSubmitUrl() } = {}) {
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildContactPayload(form, consent)),
    });
    let result = null;
    try { result = await res.json(); } catch { /* non-JSON body */ }
    if (res.ok && result?.success) return { ok: true, message: result.message || OK_FALLBACK };
    return { ok: false, error: result?.error || FAIL_FALLBACK };
  } catch {
    return { ok: false, error: NETWORK_FAIL };
  }
}
