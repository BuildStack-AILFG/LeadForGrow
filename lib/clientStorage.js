/**
 * Sign-out storage cleanup.
 *
 * `localStorage.clear()` on logout also wiped things that have nothing to do with the signed-in user:
 *   - the visitor's cookie-consent choice  → the cookie banner came back after EVERY logout
 *   - the anonymous visitor id
 *   - the theme (light/dark) preference
 *   - the marketing popup's "don't show again" timers → the Contact Us popup came back after every logout
 * so anyone who signs in and out (e.g. while testing) saw both again on the landing page each time.
 *
 * clearUserStorage() removes everything EXCEPT those device-level keys. Auth tokens, user/business ids,
 * plan flags etc. are still removed, exactly as before.
 */
const KEEP_EXACT = new Set(['theme', 'lfg_visitor_id', 'lfg_pending_page_views']);
// lfg_ui_* = per-browser layout preferences (e.g. inbox panel collapsed), not user data.
const KEEP_PREFIXES = ['lfg_cookie_', 'lfg_enquiry_', 'lfg_ui_'];

export function isDeviceLevelKey(key) {
  return KEEP_EXACT.has(key) || KEEP_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function clearUserStorage() {
  if (typeof window === 'undefined') return;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    keys.forEach((key) => {
      if (!isDeviceLevelKey(key)) localStorage.removeItem(key);
    });
  } catch {
    // Storage blocked — nothing to clear.
  }
}

export default { clearUserStorage, isDeviceLevelKey };
