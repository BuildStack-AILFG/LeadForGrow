import { chatCompletion } from '@/lib/ai/providers';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { retrieveKnowledge, formatKnowledgeContext } from '@/lib/ai/rag/retriever';
import { getLeadMemory, formatMemoryContext } from '@/lib/ai/memory';
import { getAiSettings } from '@/lib/ai/settings';

export async function runSalesAgent({
  businessId,
  businessName,
  message,
  leadId,
  conversationHistory = [],
  channel = 'whatsapp',
}) {
  const aiSettings = await getAiSettings(businessId);

  // Handoff check — defaults ON (matches the settings UI's own default display)
  // so an unconfigured business isn't silently unprotected.
  if (aiSettings.handoffEnabled !== false) {
    // Default covers both explicit requests for a human AND topics too risky
    // to answer autonomously (complaints, refunds, legal) — a business can
    // still override this list, but a safe default matters more here than
    // elsewhere since this gates unsupervised customer-facing replies.
    const keywords = aiSettings.handoffKeywords || [
      'human', 'agent', 'call me', 'speak to someone', 'talk to someone',
      'refund', 'cancel', 'cancellation', 'complaint', 'complain',
      'chargeback', 'lawyer', 'legal', 'sue', 'unhappy', 'angry', 'scam', 'fraud',
    ];
    if (keywords.some((k) => message.toLowerCase().includes(k.toLowerCase()))) {
      return {
        reply: "I'll connect you with a team member right away. Someone will be with you shortly.",
        confidence: 1,
        handoff: true,
        provider: 'rules',
      };
    }
  }

  const chunks = await retrieveKnowledge(businessId, message);
  const knowledgeContext = formatKnowledgeContext(chunks);
  const memories = leadId ? await getLeadMemory(businessId, leadId) : [];
  const memoryContext = formatMemoryContext(memories);

  const history = conversationHistory.slice(-10).map((m) => ({
    role: m.direction === 'incoming' ? 'user' : 'assistant',
    content: m.content?.body || m.text || '',
  }));

  const system = buildSystemPrompt({ businessName, aiSettings, knowledgeContext, memoryContext })
    + '\nYou are the customer-facing sales agent. Be helpful, recommend products from the catalog when relevant, and never invent information.';

  const result = await chatCompletion({
      businessId: businessId,
    messages: [
      { role: 'system', content: system },
      ...history,
      { role: 'user', content: message },
    ],
    temperature: 0.4,
  });

  const confidence = chunks.length >= 2 ? 0.9 : chunks.length === 1 ? 0.7 : 0.4;
  const needsHandoff = confidence < (aiSettings.confidenceThreshold || 0.6);

  if (result.content) {
    return {
      reply: result.content.trim(),
      confidence,
      handoff: needsHandoff,
      sources: chunks.map((c) => c.metadata?.sourceName).filter(Boolean),
      provider: result.provider,
    };
  }

  return {
    reply: chunks.length
      ? `Based on our information: ${chunks[0].content.slice(0, 200)}... Would you like more details?`
      : "Thanks for your message! A team member will assist you shortly.",
    confidence: chunks.length ? 0.6 : 0.3,
    handoff: !chunks.length,
    sources: [],
    provider: 'fallback',
  };
}

export default { runSalesAgent };
