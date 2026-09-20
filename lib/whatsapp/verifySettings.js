/**
 * Which WhatsApp credentials should the "verify connection" endpoint check?
 *
 * The settings screen has two callers:
 *  - the credential form sends the values being typed (`whatsappSettings`)
 *  - the "Sync status" button sends nothing but { verifyOnly: true }, meaning "check what is already saved"
 * The endpoint used to assume the first and crashed on the second with
 * "Cannot read properties of undefined (reading 'provider')" (the button has always been broken this way).
 *
 * Pure so it can be unit-tested. `stored` is the business's integrationCredentials.whatsapp (plain object) or undefined.
 */
export function resolveVerifySettings({ whatsappSettings, stored }) {
  if (whatsappSettings && typeof whatsappSettings === 'object') return { settings: whatsappSettings };

  const hasCredentials = Boolean(stored && (stored.apiKey || stored.interaktApiKey));
  if (!hasCredentials) {
    return { error: 'WhatsApp is not connected yet. Add your credentials first, then sync.', status: 400 };
  }
  return { settings: stored, fromStored: true };
}

/** Fields worth refreshing on the saved settings from Meta's phone-number node (all optional). */
export function metaPhoneFields(data = {}) {
  const out = {};
  if (data.quality_rating) out.qualityRating = String(data.quality_rating).toUpperCase();
  if (data.display_phone_number) out.displayNumber = data.display_phone_number;
  return out;
}

export default { resolveVerifySettings, metaPhoneFields };
