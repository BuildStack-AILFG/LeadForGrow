/**
 * Text embeddings for semantic (vector) knowledge retrieval.
 *
 * Uses OpenAI's text-embedding-3-small (1536 dims) — cheap, fast, and strong
 * for short business-knowledge chunks. Works with the platform OPENAI_API_KEY
 * or a business's own BYOK key (same key that powers their AI replies), so a
 * tenant on their own OpenAI account gets vector search too.
 *
 * Everything degrades gracefully: when no key is configured, the functions
 * return null and the retriever falls back to lexical ($text) search — the
 * pre-vector behaviour — so the knowledge base never breaks.
 */

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';

// The model id is stored on every chunk (KnowledgeChunk.embeddingModel) so
// retrieval only compares vectors produced by the same model. Bump this only
// alongside a re-index of existing chunks.
export const EMBEDDING_MODEL = 'text-embedding-3-small';

/** Is an embeddings-capable key available (platform-level)? */
export function embeddingsConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Embed a batch of strings. Returns an array of vectors aligned to `texts`,
 * or null when unavailable (no key, empty input, or a provider error) so the
 * caller can fall back. `apiKey`/`baseUrl` let a business use their own account.
 */
export async function embedTexts(texts, { apiKey, baseUrl } = {}) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  const input = (texts || []).map((t) => String(t || '').slice(0, 8000)).filter(Boolean);
  if (!key || input.length === 0) return null;
  const url = baseUrl ? `${String(baseUrl).replace(/\/$/, '')}/embeddings` : OPENAI_EMBED_URL;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.data)) {
      console.warn('[embeddings] request failed:', data.error?.message || res.status);
      return null;
    }
    // The API preserves input order; sort by index to be safe.
    return data.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  } catch (err) {
    console.warn('[embeddings] error:', err.message);
    return null;
  }
}

/** Embed a single string. Returns the vector or null. */
export async function embedOne(text, opts) {
  const vecs = await embedTexts([text], opts);
  return vecs?.[0] || null;
}

/**
 * Cosine similarity between two equal-length vectors. Returns a value in
 * [-1, 1]; higher is more similar. Guards against zero vectors and mismatched
 * lengths (returns 0) so a bad row can never throw during ranking.
 */
export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export default { EMBEDDING_MODEL, embeddingsConfigured, embedTexts, embedOne, cosineSimilarity };
