import KnowledgeSource from '@/models/ai/KnowledgeSource';
import KnowledgeChunk from '@/models/ai/KnowledgeChunk';
import { chunkText, crawlWebsite, extractTextFromBuffer } from '@/lib/ai/rag/chunker';
import { embedTexts, EMBEDDING_MODEL } from '@/lib/ai/providers/embeddings';
import { getBusinessAiProviderConfig } from '@/lib/ai/settings';

export async function ingestSource(sourceId, businessId) {
  const source = await KnowledgeSource.findOne({ _id: sourceId, businessId });
  if (!source) throw new Error('Source not found');

  await KnowledgeSource.findByIdAndUpdate(sourceId, { status: 'indexing', lastError: null });

  try {
    let text = '';

    if (source.type === 'website' && source.url) {
      const crawled = await crawlWebsite(source.url);
      text = `Title: ${crawled.title}\nDescription: ${crawled.description}\n\n${crawled.text}`;
      source.metadata = { ...(source.metadata || {}), crawledAt: new Date(), title: crawled.title };
    } else if (source.type === 'faq' && source.faqs?.length) {
      text = source.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    } else if (source.type === 'catalog' && source.catalog?.length) {
      text = source.catalog
        .map((p) => `Product: ${p.name}\nSKU: ${p.sku || '—'}\nPrice: ${p.price || '—'}\n${p.description || ''}`)
        .join('\n\n');
    } else if (source.content) {
      text = source.content;
    } else if (source.fileUrl) {
      const res = await fetch(source.fileUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      text = extractTextFromBuffer(buf, source.mimeType, source.fileName);
    } else {
      throw new Error('No content to index');
    }

    await KnowledgeChunk.deleteMany({ sourceId: source._id, businessId });

    const chunks = chunkText(text);
    if (!chunks.length) throw new Error('No text extracted');

    const docs = chunks.map((content, chunkIndex) => ({
      businessId,
      sourceId: source._id,
      content,
      chunkIndex,
      tokenEstimate: Math.ceil(content.length / 4),
      metadata: {
        sourceName: source.name,
        sourceType: source.type,
        category: source.category,
        url: source.url,
      },
    }));

    // Vector embeddings — enables semantic retrieval (meaning, not just
    // keywords). Uses the business's own OpenAI key when they run BYOK, else
    // the platform key. Best-effort: if embeddings are unavailable, chunks are
    // still indexed for lexical search, so the KB never fails to build.
    try {
      const cfg = await getBusinessAiProviderConfig(businessId);
      const opts = cfg?.apiKey ? { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl } : {};
      const BATCH = 96; // OpenAI accepts large batches; keep requests bounded.
      for (let i = 0; i < docs.length; i += BATCH) {
        const slice = docs.slice(i, i + BATCH);
        const vectors = await embedTexts(slice.map((d) => d.content), opts);
        if (!vectors) break; // no key / provider error → leave lexical-only
        slice.forEach((d, j) => {
          if (vectors[j]) { d.embedding = vectors[j]; d.embeddingModel = EMBEDDING_MODEL; }
        });
      }
    } catch (embErr) {
      console.warn('[ingest] embedding step skipped:', embErr.message);
    }

    await KnowledgeChunk.insertMany(docs);

    source.status = 'ready';
    source.chunkCount = chunks.length;
    source.version = (source.version || 0) + 1;
    source.lastIndexedAt = new Date();
    source.content = source.type === 'custom' || source.type === 'company' ? text.slice(0, 10000) : source.content;
    await source.save();

    return { chunkCount: chunks.length, version: source.version };
  } catch (err) {
    await KnowledgeSource.findByIdAndUpdate(sourceId, { status: 'error', lastError: err.message });
    throw err;
  }
}

export default { ingestSource };
