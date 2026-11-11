/**
 * Who is this Instagram token for?
 *
 * With "Instagram API with Instagram Login", webhook events carry the Instagram professional account id
 * (`user_id` from GET graph.instagram.com/me) in entry.id. Clients usually paste a Facebook Page ID (or
 * the app-scoped `id`) into "Connect manually", so the webhook couldn't find their business and comment
 * automations never ran. We now read the real ids from Meta and store them as igUserId / username.
 */
import Business from '@/models/Business';

/** Pure: pick the ids out of Meta's /me response. */
export function accountFieldsFromMe(me = {}) {
  const out = {};
  if (me.user_id) out.igUserId = String(me.user_id);
  if (me.username) out.username = String(me.username);
  return out;
}

/** { igUserId?, username?, error? } — never throws. */
export async function fetchInstagramAccount(token) {
  if (!token) return { error: 'no token' };
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) return { error: data.error?.message || `HTTP ${res.status}` };
    return accountFieldsFromMe(data);
  } catch (e) {
    return { error: e.message };
  }
}

/** Fill igUserId/username on a connected business that lacks them. Returns the fields saved (or {}). */
export async function backfillInstagramAccount(business, token) {
  const ig = business?.integrationCredentials?.instagram || {};
  if (!ig.enabled || ig.igUserId || !token) return {};
  const fields = await fetchInstagramAccount(token);
  if (!fields.igUserId) return {};
  const $set = { 'integrationCredentials.instagram.igUserId': fields.igUserId };
  if (fields.username && !ig.username) $set['integrationCredentials.instagram.username'] = fields.username;
  await Business.updateOne({ _id: business._id }, { $set });
  return fields;
}
