/**
 * The callback URLs a client pastes into the Meta developer dashboard.
 *
 *  - WhatsApp (and Meta Lead Ads) use a per-business URL: /api/webhooks/meta/<businessId>. It is verified
 *    against the verify token saved for that business.
 *  - Instagram and Facebook Pages use the shared URL: /api/webhooks/meta, verified against the server's
 *    META_VERIFY_TOKEN.
 *
 * Meta does NOT follow redirects for webhooks, so the origin must be the host that answers directly
 * (in production https://www.leadforgrow.com, because the apex domain answers 308).
 */

export const SHARED_WEBHOOK_PATH = '/api/webhooks/meta';

export function businessWebhookPath(businessId) {
  const id = String(businessId || '').trim();
  return id ? `${SHARED_WEBHOOK_PATH}/${id}` : '';
}

/** origin + path without a doubled slash; '' when either part is missing. */
export function joinWebhookUrl(origin, path) {
  const base = String(origin || '').trim().replace(/\/+$/, '');
  if (!base || !path) return '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Meta can only call a public https address — localhost / plain http / raw IPs will never receive events. */
export function isPublicHttpsOrigin(origin) {
  try {
    const u = new URL(origin);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname;
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return false;
    return true;
  } catch {
    return false;
  }
}
