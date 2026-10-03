import crypto from 'crypto';

/**
 * Compute expected X-Hub-Signature-256 value for debugging.
 */
export function computeMetaSignature(payload, appSecret) {
  if (!appSecret) return null;
  const hash = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');
  return `sha256=${hash}`;
}

/**
 * Verify Meta Cloud API Webhook Signature
 * @param {string|Buffer} payload - Raw request body
 * @param {string} signature - X-Hub-Signature-256 header value
 * @param {string} appSecret - Meta App Secret
 * @returns {boolean} - True if signature is valid
 */
export function verifyMetaSignature(payload, signature, appSecret) {
    if (!signature || !appSecret) return false;

    try {
        const [algo, hash] = signature.split('=');
        if (algo !== 'sha256') return false;

        const expectedHash = crypto
            .createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    } catch (error) {
        console.error('[Security] Meta signature verification failed:', error.message);
        return false;
    }
}

/**
 * Try multiple App Secret sources (Integration vs env vs legacy).
 */
export function verifyMetaSignatureCandidates(payload, signature, candidates = []) {
  const attempts = [];

  if (!signature) {
    return { valid: null, matchedSource: null, reason: 'no_signature_header', attempts };
  }

  if (!candidates.length) {
    return { valid: null, matchedSource: null, reason: 'no_app_secret_candidates', attempts };
  }

  for (const { source, secret } of candidates) {
    const expected = computeMetaSignature(payload, secret);
    const valid = verifyMetaSignature(payload, signature, secret);
    attempts.push({
      source,
      expected,
      valid,
      secretPreview: secret ? `${secret.slice(0, 4)}…${secret.slice(-4)}` : null
    });
    if (valid) {
      return { valid: true, matchedSource: source, expected, attempts };
    }
  }

  return {
    valid: false,
    matchedSource: null,
    expected: attempts[0]?.expected ?? null,
    reason: 'no_candidate_matched',
    attempts
  };
}

/**
 * Constant-time token check for Interakt webhooks. Fails closed: no expected
 * token (nothing configured) or no received token means "not verified".
 * @param {string} receivedToken - Token from request
 * @param {string|string[]} expectedTokens - Acceptable token(s)
 * @returns {boolean}
 */
export function verifyInteraktToken(receivedToken, expectedTokens) {
    if (!receivedToken || typeof receivedToken !== 'string') return false;
    const received = crypto.createHash('sha256').update(receivedToken).digest();
    return [].concat(expectedTokens || [])
        .filter((t) => typeof t === 'string' && t.length > 0)
        .some((t) => crypto.timingSafeEqual(received, crypto.createHash('sha256').update(t).digest()));
}
