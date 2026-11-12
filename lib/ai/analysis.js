import { chatCompletion } from '@/lib/ai/providers';
import { retrieveKnowledge, formatKnowledgeContext } from '@/lib/ai/rag/retriever';
import { getLeadMemory, formatMemoryContext, extractMemoriesFromConversation } from '@/lib/ai/memory';
import { getAiSettings } from '@/lib/ai/settings';
import { buildSystemPrompt } from '@/lib/ai/prompts';

export async function analyzeConversation({ businessId, businessName, leadId, messages = [] }) {
  const aiSettings = await getAiSettings(businessId);
  const transcript = messages.map((m) => `${m.direction}: ${m.content?.body || ''}`).join('\n');
  const chunks = await retrieveKnowledge(businessId, transcript.slice(0, 500));
  const memories = leadId ? await getLeadMemory(businessId, leadId) : [];

  const result = await chatCompletion({
      businessId: businessId,
    messages: [
      { role: 'system', content: buildSystemPrompt({ businessName, aiSettings, knowledgeContext: formatKnowledgeContext(chunks), memoryContext: formatMemoryContext(memories) }) },
      { role: 'user', content: `Analyze this conversation. Return JSON: {"sentiment":"positive|neutral|negative","intent":"string","objections":["..."],"purchaseReadiness":"high|medium|low","riskLevel":"high|medium|low","conversationQuality":"good|fair|poor","salespersonPerformance":"good|fair|poor","summary":"string"}\n\n${transcript}` },
    ],
    jsonMode: true,
    temperature: 0.2,
  });

  let analysis = {
    sentiment: 'neutral',
    intent: 'inquiry',
    objections: [],
    purchaseReadiness: 'medium',
    riskLevel: 'low',
    conversationQuality: 'fair',
    salespersonPerformance: 'good',
    summary: '',
    provider: 'fallback',
  };

  if (result.content) {
    try {
      analysis = { ...analysis, ...JSON.parse(result.content), provider: result.provider };
    } catch { /* keep defaults */ }
  }

  if (leadId) await extractMemoriesFromConversation(businessId, leadId, messages);

  return analysis;
}

export default { analyzeConversation };
