import Business from '@/models/Business';
import { encrypt, decrypt, isEncrypted } from '@/lib/encryption';

/** xAI Grok — OpenAI-compatible chat API. Model is editable in AI settings. */
export const GROK_BASE_URL = 'https://api.x.ai/v1';
export const GROK_DEFAULT_MODEL = 'grok-3-mini';

/**
 * Client-safe AI settings. The BYOK apiKey is `select: false` and never
 * returned; instead we surface a `hasApiKey` boolean so the UI can show
 * "key saved" without ever exposing the secret.
 */
export async function getAiSettings(businessId) {
  // Second query pulls the otherwise-hidden apiKey ONLY to compute hasApiKey.
  const [business, withKey] = await Promise.all([
    Business.findById(businessId).select('settings.ai businessName').lean(),
    Business.findById(businessId).select('+settings.ai.apiKey').lean(),
  ]);
  const ai = business?.settings?.ai || {};
  const { apiKey, ...safe } = ai; // never leak the key
  return {
    ...safe,
    businessName: business?.businessName,
    hasApiKey: !!withKey?.settings?.ai?.apiKey,
  };
}

export async function updateAiSettings(businessId, updates) {
  const allowed = [
    'enabled', 'tone', 'personality', 'languages', 'customInstructions',
    'confidenceThreshold', 'handoffEnabled', 'handoffKeywords', 'workingHoursOnly',
    'escalationRules', 'model', 'agentEnabled', 'replyAssistEnabled',
    'whatsappAutoReply',
    // BYOK — client can run AI on their own OpenAI account.
    'provider', 'replyModel', 'baseUrl',
  ];
  const patch = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) patch[`settings.ai.${key}`] = updates[key];
  }

  // apiKey handled separately: encrypt a new key, keep the old one when the
  // client leaves the field blank (they don't re-enter it every save), and
  // clear it when they explicitly send null.
  if (updates.apiKey === null) {
    patch['settings.ai.apiKey'] = '';
  } else if (typeof updates.apiKey === 'string' && updates.apiKey.trim()) {
    const raw = updates.apiKey.trim();
    patch['settings.ai.apiKey'] = isEncrypted(raw) ? raw : encrypt(raw);
  }

  const business = await Business.findByIdAndUpdate(businessId, { $set: patch }, { new: true });
  return business?.settings?.ai;
}

/**
 * Server-side resolver for the reply/agent paths. Returns the business's own
 * provider config with the DECRYPTED key when BYOK is set up, else null (so the
 * caller falls back to the platform provider). Never send this to a client.
 */
export async function getBusinessAiProviderConfig(businessId) {
  const doc = await Business.findById(businessId).select('+settings.ai.apiKey').lean();
  const ai = doc?.settings?.ai;
  if (!ai || !['openai', 'grok'].includes(ai.provider) || !ai.apiKey) return null;
  const key = isEncrypted(ai.apiKey) ? decrypt(ai.apiKey) : ai.apiKey;
  if (!key) return null;
  if (ai.provider === 'grok') {
    return {
      provider: 'grok',
      apiKey: key,
      model: ai.replyModel || GROK_DEFAULT_MODEL,
      baseUrl: ai.baseUrl || GROK_BASE_URL,
    };
  }
  return {
    provider: 'openai',
    apiKey: key,
    model: ai.replyModel || undefined,
    baseUrl: ai.baseUrl || undefined,
  };
}

export default { getAiSettings, updateAiSettings, getBusinessAiProviderConfig };
