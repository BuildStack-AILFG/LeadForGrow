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

export async function chatCompletion(args) {
  // Bring-Your-Own-Key: when a business runs AI on their own account, the
  // caller passes providerConfig={ provider, apiKey, model, baseUrl }. We route
  // straight to that provider with their key instead of the platform env key.
  const cfg = args?.providerConfig;
  if (cfg?.apiKey && cfg.provider === 'openai') {
    return openai.chatCompletion({
      ...args,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl || undefined,
      model: cfg.model || args.model,
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
