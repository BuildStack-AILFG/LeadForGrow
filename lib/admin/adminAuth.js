import crypto from 'crypto';

/**
 * Password gate for the /lfgadmin control panel APIs (platform owner only).
 * Constant-time comparison against LFG_ADMIN_PASSWORD; with no password set
 * it refuses everything, and production refuses to run without one.
 */
export function requireAdminPassword(password) {
  const expected = process.env.LFG_ADMIN_PASSWORD;
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Admin] LFG_ADMIN_PASSWORD must be set in production');
    }
    return false;
  }
  if (typeof password !== 'string') return false;
  const a = crypto.createHash('sha256').update(password).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
