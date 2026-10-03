/**
 * Instagram webhook subscriptions, per account.
 *
 * Turning a field on in the Meta app dashboard only says the APP accepts that
 * event; each Instagram account must also be subscribed to it via
 * POST /me/subscribed_apps?subscribed_fields=… or Meta never sends it. That is why
 * DMs (subscribed earlier) can work while comments silently never arrive.
 * Docs: instagram-platform → webhooks → "Enable subscriptions".
 */
import { getInstagramToken } from '@/lib/instagram/send';
import { metaErrorText } from '@/lib/social/metaErrors';

const API = 'https://graph.instagram.com/v21.0/me/subscribed_apps';
export const REQUIRED_FIELDS = ['comments', 'messages'];

const errText = (data, fallback) => metaErrorText(data, { channel: 'instagram', fallback });

/** Fields this account is currently subscribed to. Best effort — Meta doesn't document the read. */
export async function getSubscribedFields(business) {
  const token = getInstagramToken(business);
  if (!token) return { success: false, error: 'Instagram not configured', fields: [] };
  try {
    const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) return { success: false, error: errText(data, 'Could not read subscriptions'), fields: [] };
    const fields = new Set();
    for (const app of data.data || []) for (const f of app.subscribed_fields || []) fields.add(f);
    return { success: true, fields: [...fields] };
  } catch (err) {
    return { success: false, error: err.message, fields: [] };
  }
}

/**
 * Subscribe the account to `REQUIRED_FIELDS` plus whatever it already had (the
 * subscribe call replaces the list, so we merge to avoid silently dropping fields).
 */
export async function enableSubscriptions(business, wanted = REQUIRED_FIELDS) {
  const token = getInstagramToken(business);
  if (!token) return { success: false, error: 'Instagram not configured', fields: [] };

  const current = await getSubscribedFields(business);
  const fields = [...new Set([...(current.fields || []), ...wanted])];

  try {
    const res = await fetch(`${API}?subscribed_fields=${encodeURIComponent(fields.join(','))}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || data.success === false) return { success: false, error: errText(data, 'Could not subscribe'), fields: current.fields || [] };
    const after = await getSubscribedFields(business);
    return { success: true, fields: after.success ? after.fields : fields };
  } catch (err) {
    return { success: false, error: err.message, fields: current.fields || [] };
  }
}

/**
 * Stop Meta sending events for this account (used when the owner disconnects Instagram).
 * Best effort: the disconnect proceeds even if this fails, because once the account's page id is removed our
 * webhook can no longer match an incoming event to the business anyway.
 */
export async function disableSubscriptions(business) {
  const token = getInstagramToken(business);
  if (!token) return { success: false, skipped: true, error: 'No Instagram token stored' };
  try {
    const res = await fetch(API, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) return { success: false, error: errText(data, 'Could not stop Instagram events') };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default { getSubscribedFields, enableSubscriptions, disableSubscriptions, REQUIRED_FIELDS };
