/**
 * chatReply — generates a WhatsApp reply for the flow builder's
 * `action_ai_response` node using the configured LLM provider (Groq).
 *
 * Called by lib/whatsappFlows/engine.js. Always returns a usable string;
 * falls back to a safe message if the LLM is unavailable.
 */
import { chatCompletion } from '@/lib/ai/providers';
import { getAiSettings } from '@/lib/ai/settings';
import { retrieveKnowledge, formatKnowledgeContext } from '@/lib/ai/rag/retriever';

function fmtVariables(variables = {}) {
  const skip = new Set(['last_reply', 'button_id', 'list_id']);
  const lines = Object.entries(variables)
    .filter(([k, v]) => v && !skip.has(k))
    .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`);
  return lines.length ? lines.join('\n') : '(none yet)';
}

export async function generateChatReply({ business, lead, prompt, variables = {} }) {
  const businessName = business?.businessName || business?.name || 'our business';
  const customerName = lead?.name || variables.customer_name || '';
  const lastMessage = variables.last_reply || '';

  let tone = 'friendly and professional';
  let knowledgeContext = '';
  try {
    if (business?._id) {
      const ai = await getAiSettings(business._id);
      if (ai?.tone) tone = ai.tone;

      // Ground the reply in the business knowledge base (RAG).
      const query = `${prompt || ''} ${lastMessage || ''}`.trim();
      const chunks = await retrieveKnowledge(business._id, query);
      knowledgeContext = formatKnowledgeContext(chunks);
    }
  } catch {
    /* use defaults; knowledge is optional */
  }

  const system = [
    `You are a WhatsApp assistant for "${businessName}".`,
    `Reply in a ${tone} tone. Keep it short (1-3 sentences), no markdown, suitable for WhatsApp.`,
    `Never invent prices, availability, or promises you cannot keep. If unsure, say the team will follow up.`,
    knowledgeContext
      ? `\n\nUse ONLY the following business information to answer. If the answer isn't here, say the team will follow up.\n---\n${knowledgeContext}\n---`
      : '',
  ].join(' ');

  const user = [
    prompt ? `Instruction: ${prompt}` : 'Reply helpfully to the customer.',
    customerName ? `Customer name: ${customerName}` : '',
    `Known details so far:\n${fmtVariables(variables)}`,
    lastMessage ? `Customer's latest message: "${lastMessage}"` : '',
    'Write only the reply message the customer should receive.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const result = await chatCompletion({
      businessId: business?._id,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.5,
    maxTokens: 400,
  });

  if (result?.content) {
    return result.content.trim();
  }

  // Fallback when the LLM is unavailable / errored.
  return customerName
    ? `Thanks ${String(customerName).split(' ')[0]}! Our team will get back to you shortly.`
    : 'Thanks for your message! Our team will get back to you shortly.';
}

export default { generateChatReply };
