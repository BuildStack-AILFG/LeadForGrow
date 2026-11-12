import * as groq from './groq.js';
import * as openai from './openai.js';

/**
 * Which provider is actually usable right now, based on configured env keys.
 * This return value is what actually routes chatCompletion/streamChatCompletion below —
 * it used to be informational only, with every call silently going to Groq regardless.
 */
export function getActiveProvider() {
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.AI_BACKEND_URL) return 'remote';
  return 'local';
}

function activeModule() {
  const provider = getActiveProvider();
  if (provider === 'groq') return groq;
  if (provider === 'openai') return openai;
  return null;
}

/** Business's own provider (OpenAI or Grok key), cached briefly per process. */
const byokCache = new Map(); // businessId -> { at, cfg }
async function businessProviderConfig(businessId) {
  if (!businessId) return null;
  const k = String(businessId);
  const hit = byokCache.get(k);
  if (hit && Date.now() - hit.at < 60000) return hit.cfg;
  let cfg = null;
  try {
    const { getBusinessAiProviderConfig } = await import('@/lib/ai/settings');
    cfg = await getBusinessAiProviderConfig(businessId);
  } catch { cfg = null; }
  byokCache.set(k, { at: Date.now(), cfg });
  return cfg;
}

export function clearBusinessProviderCache(businessId) {
  if (businessId) byokCache.delete(String(businessId));
}

export async function chatCompletion(args) {
  // Bring-Your-Own-Key: when a business runs AI on their own account (OpenAI or
  // xAI Grok), route straight to it with their key. Callers either pass
  // providerConfig, or just businessId and we resolve it here.
  const cfg = args?.providerConfig || await businessProviderConfig(args?.businessId);
  if (cfg?.apiKey && (cfg.provider === 'openai' || cfg.provider === 'grok')) {
    return openai.chatCompletion({
      ...args,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl || undefined,
      // Callers may pass a platform (Groq) model id — never send that to the client's account.
      model: cfg.model || undefined,
    });
  }

  const mod = activeModule();
  if (!mod) {
    return { content: null, provider: null, error: 'No AI provider configured — set GROQ_API_KEY or OPENAI_API_KEY' };
  }
  return mod.chatCompletion(args);
}

export async function* streamChatCompletion(args) {
  const mod = activeModule();
  if (!mod) {
    yield { delta: 'AI is not configured. Set GROQ_API_KEY or OPENAI_API_KEY.', done: true };
    return;
  }
  yield* mod.streamChatCompletion(args);
}

export function isAiConfigured() {
  return activeModule() !== null;
}

/** AI usable for this business — platform key, or the business's own OpenAI/Grok key. */
export async function isAiConfiguredFor(businessId) {
  if (activeModule() !== null) return true;
  const cfg = await businessProviderConfig(businessId);
  return !!cfg?.apiKey;
}
