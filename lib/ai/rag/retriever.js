import KnowledgeChunk from '@/models/ai/KnowledgeChunk';
import { cacheGet, cacheSet, cacheKey } from '@/lib/ai/cache';
import { embedOne, cosineSimilarity, EMBEDDING_MODEL } from '@/lib/ai/providers/embeddings';
import { getBusinessAiProviderConfig } from '@/lib/ai/settings';

// Upper bound on chunks scored in-app per query. In-process cosine over a
// business's own knowledge is plenty for small/mid KBs; beyond this, Atlas
// Vector Search ($vectorSearch) is the scale path (drop-in on the same field).
const MAX_VECTOR_CANDIDATES = 2000;
// Chunks below this cosine score are noise — better to return fewer, on-topic
// chunks than pad the prompt with unrelated text.
const MIN_VECTOR_SCORE = 0.15;

/**
 * Semantic retrieval: embed the query and rank knowledge chunks by cosine
 * similarity to it, so "kitne ka hai" matches a "pricing" chunk even without a
 * shared keyword. Falls back to MongoDB $text + keyword search whenever
 * embeddings are unavailable (no OpenAI key) or nothing is embedded yet — the
 * pre-vector behaviour, so the KB always answers.
 */
export async function retrieveKnowledge(businessId, query, { limit = 6 } = {}) {
  if (!query?.trim()) return [];

  const q = query.trim();
  const key = cacheKey(['rag', businessId, q, limit]);
  const cached = cacheGet(key);
  if (cached) return cached;

  // ── 1. Vector search ───────────────────────────────────────────────────
  try {
    const cfg = await getBusinessAiProviderConfig(businessId);
    const queryVec = await embedOne(q, cfg?.apiKey ? { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl } : {});
    if (queryVec) {
      const candidates = await KnowledgeChunk.find({
        businessId,
        embeddingModel: EMBEDDING_MODEL,
      })
        .select('+embedding content metadata sourceId')
        .limit(MAX_VECTOR_CANDIDATES)
        .lean();

      if (candidates.length) {
        const ranked = candidates
          .map((c) => ({ c, score: cosineSimilarity(queryVec, c.embedding) }))
          .filter((r) => r.score >= MIN_VECTOR_SCORE)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(({ c, score }) => {
            const { embedding, ...rest } = c; // don't leak vectors downstream
            return { ...rest, score };
          });

        if (ranked.length) {
          cacheSet(key, ranked);
          return ranked;
        }
      }
    }
  } catch (err) {
    console.warn('[retriever] vector search failed, falling back to lexical:', err.message);
  }

  // ── 2. Lexical fallback — MongoDB text search ──────────────────────────
  let chunks = await KnowledgeChunk.find(
    { businessId, $text: { $search: q } },
    { score: { $meta: 'textScore' }, content: 1, metadata: 1, sourceId: 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

  if (chunks.length) {
    cacheSet(key, chunks);
    return chunks;
  }

  // ── 3. Keyword fallback ────────────────────────────────────────────────
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return [];

  const regex = terms.map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  chunks = await KnowledgeChunk.find({
    businessId,
    $or: regex.map((r) => ({ content: r })),
  })
    .limit(limit)
    .lean();

  cacheSet(key, chunks);
  return chunks;
}

export function formatKnowledgeContext(chunks) {
  if (!chunks?.length) return '';
  return chunks
    .map((c, i) => `[${i + 1}] (${c.metadata?.sourceName || 'source'}): ${c.content}`)
    .join('\n\n');
}

export default { retrieveKnowledge, formatKnowledgeContext };
