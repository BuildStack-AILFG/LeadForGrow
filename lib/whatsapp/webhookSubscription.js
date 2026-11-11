/**
 * WhatsApp only delivers webhooks (incoming messages, sent/delivered/read ticks) for a WhatsApp
 * Business Account (WABA) that has subscribed the app: POST /{waba-id}/subscribed_apps.
 * Configuring the Callback URL in the Meta app dashboard is not enough on its own, and nothing in
 * this codebase used to make that call, so a newly connected number could send templates but never
 * received a reply or a delivery tick.
 *
 * We also pass `override_callback_uri` (Meta's per-WABA callback override) pointing at this business's
 * own webhook URL. Several clients can share one Meta app, and the app-level Callback URL can only point
 * at one of them; the override sends each WABA's events to the right business. Meta verifies the
 * override URL immediately with a GET (hub.verify_token), which our per-business route answers using
 * the verify token saved for that business.
 */

const GRAPH = 'https://graph.facebook.com/v21.0';

/** Pure: does the subscription Meta reports already send events to `callbackUrl`? */
export function subscriptionState(apps = [], callbackUrl = '') {
  const list = Array.isArray(apps) ? apps : [];
  if (list.length === 0) return 'not_subscribed';
  const target = String(callbackUrl || '').replace(/\/+$/, '');
  const pointsHere = list.some((a) => String(a?.override_callback_uri || '').replace(/\/+$/, '') === target);
  return pointsHere ? 'ok' : 'subscribed_elsewhere';
}

/** Pure: the POST body for /{waba}/subscribed_apps. Override only when we have a verify token for it. */
export function subscribeParams({ callbackUrl, verifyToken }) {
  const params = new URLSearchParams();
  if (callbackUrl && verifyToken) {
    params.set('override_callback_uri', callbackUrl);
    params.set('verify_token', verifyToken);
  }
  return params;
}

async function graph(path, token, init = {}) {
  try {
    const res = await fetch(`${GRAPH}/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && !data?.error, data };
  } catch (e) {
    return { ok: false, data: { error: { message: e.message } } };
  }
}

/**
 * Make sure the WABA is subscribed and sends its events to `callbackUrl`.
 * Returns { state: 'ok'|'subscribed'|'failed'|'skipped', before, error? } and never throws.
 */
export async function ensureWabaSubscription({ wabaId, token, callbackUrl, verifyToken }) {
  if (!wabaId || !token) {
    return { state: 'skipped', error: 'WhatsApp Business Account ID is not saved, so webhooks could not be subscribed.' };
  }

  const current = await graph(`${wabaId}/subscribed_apps`, token);
  const before = current.ok ? subscriptionState(current.data?.data, callbackUrl) : 'unknown';
  if (before === 'ok') return { state: 'ok', before };

  const params = subscribeParams({ callbackUrl, verifyToken });
  const posted = await graph(`${wabaId}/subscribed_apps`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (posted.ok) return { state: 'subscribed', before, override: params.has('override_callback_uri') };

  const err = posted.data?.error || {};
  const code = err.code ? ` (Meta code ${err.code}${err.error_subcode ? `/${err.error_subcode}` : ''})` : '';
  return { state: 'failed', before, error: `Could not subscribe webhooks${code}: ${err.error_user_msg || err.message || 'unknown error'}` };
}

export default { subscriptionState, subscribeParams, ensureWabaSubscription };
