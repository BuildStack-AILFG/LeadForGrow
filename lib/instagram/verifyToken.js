/**
 * Per-business Instagram webhook verify token.
 *
 * Instagram webhooks go to the shared URL /api/webhooks/meta (events are matched to a business by the
 * Instagram account id). Its verify token used to be only the server's META_VERIFY_TOKEN, which a client
 * can't see, so they couldn't finish the Meta setup themselves. Each business now gets its own token,
 * generated on first view, stored encrypted, and shown on Settings → Instagram. The client's callback URL
 * carries ?business=<id> so the GET verification knows whose token to compare against.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { encrypt, decryptMaybe } from '@/lib/encryption';
import Business from '@/models/Business';

const PATH = 'integrationCredentials.instagram.verifyToken';

export function newVerifyToken() {
  return `lfg_ig_${crypto.randomBytes(18).toString('hex')}`;
}

/** Constant-time string comparison; false for empty or different lengths. */
export function tokensMatch(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (!x.length || x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

/** The business's plain token, creating and saving one if it has none. */
export async function ensureInstagramVerifyToken(business) {
  const stored = business?.integrationCredentials?.instagram?.verifyToken;
  if (stored) return decryptMaybe(stored);
  const token = newVerifyToken();
  // Targeted update: never re-save the whole business document from a GET.
  await Business.updateOne(
    { _id: business._id, [PATH]: { $in: [null, ''] } },
    { $set: { [PATH]: encrypt(token) } }
  );
  // Two tabs racing: re-read so both show the token that was actually saved.
  const fresh = await Business.findById(business._id).select(PATH).lean();
  return decryptMaybe(fresh?.integrationCredentials?.instagram?.verifyToken) || token;
}

/** For the GET verification on the shared webhook URL. */
export async function matchesBusinessInstagramToken(businessId, token) {
  if (!businessId || !token || !mongoose.isValidObjectId(businessId)) return false;
  const b = await Business.findById(businessId).select(PATH).lean();
  const stored = b?.integrationCredentials?.instagram?.verifyToken;
  return Boolean(stored) && tokensMatch(decryptMaybe(stored), token);
}
