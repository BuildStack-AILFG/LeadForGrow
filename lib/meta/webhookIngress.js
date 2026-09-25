import MetaWebhookIngress from '@/models/MetaWebhookIngress';
import { computeMetaSignature, verifyMetaSignatureCandidates } from '@/lib/webhookSecurity';
import { metaLog } from '@/lib/meta/logger';
import { extractLeadgenFromPayload } from '@/lib/meta/leadgenHandler';

function safeHeaders(headers) {
  const out = {};
  if (!headers) return out;
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      out[key] = key.toLowerCase().includes('signature') ? `${String(value).slice(0, 24)}…` : value;
    });
    return out;
  }
  for (const [key, value] of Object.entries(headers)) {
    out[key] = key.toLowerCase().includes('signature') ? `${String(value).slice(0, 24)}…` : value;
  }
  return out;
}

export function parseLeadgenFields(payload) {
  const leadgen = extractLeadgenFromPayload(payload);
  const value = leadgen?.value || {};
  return {
    object: payload?.object ?? null,
    entry: payload?.entry ?? null,
    changes: (payload?.entry || []).flatMap((e) => e.changes || []),
    field: leadgen ? 'leadgen' : (payload?.entry?.[0]?.changes?.[0]?.field ?? null),
    value: leadgen?.value ?? payload?.entry?.[0]?.changes?.[0]?.value ?? null,
    leadgen_id: value.leadgen_id != null ? String(value.leadgen_id) : null,
    page_id:
      value.page_id != null
        ? String(value.page_id)
        : leadgen?.entryId != null
          ? String(leadgen.entryId)
          : payload?.entry?.[0]?.id != null
            ? String(payload.entry[0].id)
            : null,
    form_id: value.form_id != null ? String(value.form_id) : null,
    leadgenFound: Boolean(leadgen)
  };
}

/**
 * Persist + console-log every Meta webhook POST (proves whether Meta is hitting our server).
 */
export async function recordMetaWebhookIngress({
  route,
  request,
  businessId = null,
  rawBody = '',
  payload = null
}) {
  const url = request?.url || null;
  const headers = safeHeaders(request?.headers);
  const parsed = payload ? parseLeadgenFields(payload) : null;
  const receivedSignature = request?.headers?.get?.('x-hub-signature-256') || null;

  metaLog('Webhook Ingress', `POST ${route}`, {
    url,
    businessId: businessId ? String(businessId) : null,
    object: parsed?.object,
    leadgen_id: parsed?.leadgen_id,
    page_id: parsed?.page_id,
    form_id: parsed?.form_id,
    leadgenFound: parsed?.leadgenFound,
    bodyLength: rawBody?.length ?? 0,
    hasSignature: Boolean(receivedSignature)
  });

  metaLog('Webhook Ingress', 'Headers', headers);
  if (rawBody) metaLog('Webhook Ingress', 'Raw body', rawBody);

  const doc = await MetaWebhookIngress.create({
    route,
    businessId: businessId || undefined,
    method: 'POST',
    url,
    headers,
    rawBody: rawBody?.slice?.(0, 50000) || rawBody,
    payload,
    parsed,
    signature: { received: receivedSignature },
    outcome: 'received'
  });

  return doc;
}

export async function finalizeMetaWebhookIngress(ingressId, { outcome, processing, signature = {} }) {
  if (!ingressId) return;
  await MetaWebhookIngress.findByIdAndUpdate(ingressId, {
    outcome,
    processing,
    ...(Object.keys(signature).length ? { signature } : {})
  });
}

/**
 * Collect App Secret candidates (Integration, env, legacy fields).
 */
export async function collectMetaAppSecretCandidates(metaCreds, business) {
  const candidates = [];
  const seen = new Set();
  const { decrypt } = await import('@/lib/encryption');

  const add = (source, secret) => {
    const s = typeof secret === 'string' ? secret.trim() : secret;
    if (!s || seen.has(s)) return;
    seen.add(s);
    candidates.push({ source, secret: s });
  };

  const resolveMaybeEncrypted = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && value.includes(':')) {
      try {
        return decrypt(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  add('integration.meta-ads', metaCreds?.appSecret);
  add('env.META_APP_SECRET', process.env.META_APP_SECRET);
  add('legacy.facebookAds', resolveMaybeEncrypted(business?.integrationCredentials?.facebookAds?.appSecret));
  add('legacy.whatsapp', resolveMaybeEncrypted(business?.integrationCredentials?.whatsapp?.appSecret));
  // Instagram API with Instagram Login signs webhooks with the *Instagram* app
  // secret, which is different from the Meta app secret. Messenger/Page events
  // use the Meta app secret of the app the Page is subscribed through.
  add('business.instagram', resolveMaybeEncrypted(business?.integrationCredentials?.instagram?.appSecret));
  add('business.facebook', resolveMaybeEncrypted(business?.integrationCredentials?.facebook?.appSecret));
  add('env.INSTAGRAM_APP_SECRET', process.env.INSTAGRAM_APP_SECRET);

  return candidates;
}

/**
 * Verify a webhook's X-Hub-Signature-256 against every secret that could
 * legitimately have signed it: the env secrets plus each involved business's
 * stored secrets. Meta signs the whole body once, so one match is enough.
 *
 * Fails closed: a missing header or no configured secret is NOT valid.
 * Returns the same diagnostic shape as verifyMetaWebhookSignature, with
 * `valid` coerced to a strict boolean.
 */
export async function verifyMetaSignatureForBusinesses(rawBody, signature, businesses = []) {
  const { resolveMetaAdsCredentials } = await import('@/lib/meta/credentials');
  const all = [];
  const seen = new Set();
  const list = businesses.length ? businesses : [null];
  for (const business of list) {
    let metaCreds = null;
    if (business) {
      try { metaCreds = await resolveMetaAdsCredentials(business); } catch { metaCreds = null; }
    }
    for (const candidate of await collectMetaAppSecretCandidates(metaCreds, business)) {
      if (seen.has(candidate.secret)) continue;
      seen.add(candidate.secret);
      all.push(candidate);
    }
  }
  const result = verifyMetaWebhookSignature(rawBody, signature, all);
  return { ...result, valid: result.valid === true };
}

/**
 * Verify signature with full diagnostic logging (received vs expected per candidate).
 */
export function verifyMetaWebhookSignature(rawBody, receivedSignature, candidates) {
  const verification = verifyMetaSignatureCandidates(rawBody, receivedSignature, candidates);

  const expectedPrimary =
    candidates[0]?.secret && receivedSignature
      ? computeMetaSignature(rawBody, candidates[0].secret)
      : null;

  metaLog('Webhook Signature', 'Verification result', {
    received: receivedSignature,
    expectedPrimary,
    verified: verification.valid,
    matchedSource: verification.matchedSource,
    candidates: verification.attempts
  });

  return {
    ...verification,
    received: receivedSignature,
    expected: verification.expected || expectedPrimary,
    candidates: verification.attempts
  };
}

// Ingress rows hold other tenants' raw payloads (names, phones, messages), so
// this only ever returns rows for one business: no businessId, no rows.
export async function getRecentWebhookIngress({ businessId, pageId, limit = 20 } = {}) {
  if (!businessId) return [];
  const query = { $or: [{ businessId }] };
  if (pageId) {
    // Rows for this Page that never got attributed to a business (why a lead
    // went missing). Rows already attributed to someone else stay theirs.
    query.$or.push({ businessId: null, 'parsed.page_id': String(pageId) });
  }
  return MetaWebhookIngress.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}
