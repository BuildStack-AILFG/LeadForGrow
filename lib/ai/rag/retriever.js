import KnowledgeChunk from '@/models/ai/KnowledgeChunk';
import { cacheGet, cacheSet, cacheKey } from '@/lib/ai/cache';
import { embedOne, cosineSimilarity, EMBEDDING_MODEL } from '@/lib/ai/providers/embeddings';
import { getBusinessAiProviderConfig } from '@/lib/ai/settings';
import { bm25Rank, reciprocalRankFusion } from '@/lib/ai/rag/lexical';

// Upper bound on chunks scored in-app per query. In-process scoring over a business's
// own knowledge is plenty for small/mid KBs; beyond this, Atlas Vector/Search indexes
// are the scale path.
const MAX_CANDIDATES = 2000;
// Chunks below this cosine score are noise.
const MIN_VECTOR_SCORE = 0.15;

/** Embedding options for this business: its own OpenAI key, else the platform key. */
function embeddingOptions(cfg) {
  // Only OpenAI(-compatible) accounts expose the embedding model we store; a Grok key
  // is for chat, so embeddings fall back to the platform OpenAI key (if any).
  if (cfg?.provider === 'openai' && cfg.apiKey) return { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl };
  return {};
}

/**
 * Hybrid retrieval for the AI knowledge base.
 *  - keyword ranking (BM25 with stemming + English/Hinglish synonyms) always runs;
 *  - when embeddings are available, vector similarity runs too and both rankings are
 *    fused (reciprocal rank fusion) — meaning-based matches and exact terms both count.
 * Works with no embedding provider at all (e.g. a Grok-only setup).
 */
export async function retrieveKnowledge(businessId, query, { limit = 6 } = {}) {
  if (!query?.trim()) return [];

  const q = query.trim();
  const key = cacheKey(['rag2', businessId, q, limit]);
  const cached = cacheGet(key);
  if (cached) return cached;

  let queryVec = null;
  try {
    const cfg = await getBusinessAiProviderConfig(businessId);
    queryVec = await embedOne(q, embeddingOptions(cfg));
  } catch (err) {
    console.warn('[retriever] query embedding failed, keyword ranking only:', err.message);
  }

  const candidates = await KnowledgeChunk.find({ businessId })
    .select(`${queryVec ? '+embedding ' : ''}content metadata sourceId embeddingModel`)
    .limit(MAX_CANDIDATES)
    .lean();
  if (!candidates.length) return [];

  const byId = new Map(candidates.map((c) => [String(c._id), c]));
  const keyword = bm25Rank(candidates, q).slice(0, limit * 4);
  const lists = [keyword.map((r) => String(r.chunk._id))];

  const vectorScore = new Map();
  if (queryVec) {
    const vector = candidates
      .filter((c) => c.embeddingModel === EMBEDDING_MODEL && Array.isArray(c.embedding))
      .map((c) => ({ id: String(c._id), score: cosineSimilarity(queryVec, c.embedding) }))
      .filter((r) => r.score >= MIN_VECTOR_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 4);
    for (const v of vector) vectorScore.set(v.id, v.score);
    if (vector.length) lists.push(vector.map((v) => v.id));
  }

  const keywordScore = new Map(keyword.map((r) => [String(r.chunk._id), r.score]));
  const fused = reciprocalRankFusion(lists).slice(0, limit);
  const results = fused.map((id) => {
    const { embedding, ...rest } = byId.get(id); // never leak vectors downstream
    return { ...rest, score: vectorScore.get(id) ?? keywordScore.get(id) ?? 0 };
  });

  cacheSet(key, results);
  return results;
}

export function formatKnowledgeContext(chunks) {
  if (!chunks?.length) return '';
  return chunks
    .map((c, i) => `[${i + 1}] (${c.metadata?.sourceName || 'source'}): ${c.content}`)
    .join('\n\n');
}

export default { retrieveKnowledge, formatKnowledgeContext };
