/**
 * generateAutoReply — context-aware reply for social auto-replies (Instagram /
 * Facebook / WhatsApp comment + DM automation).
 *
 * Reads the incoming message, the business's tone + knowledge base (RAG), and an
 * optional per-rule instruction, and returns a short, natural, relevant reply.
 * Because every reply is generated fresh, no two are identical — which both
 * reads as human and lowers spam-detection risk.
 *
 * Returns a string, or null when AI is unavailable/errored so the caller can
 * fall back to the static (varied) reply.
 */
import { chatCompletion, isAiConfigured } from '@/lib/ai/providers';
import { getAiSettings } from '@/lib/ai/settings';
import { retrieveKnowledge, formatKnowledgeContext } from '@/lib/ai/rag/retriever';

const CHANNEL_LABEL = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook Messenger',
};

export async function generateAutoReply({
  business,
  lead = null,
  channel = 'instagram',
  incomingText = '',
  instruction = '',
  kind = 'dm', // 'dm' | 'public_comment'
}) {
  if (!isAiConfigured()) return null;

  const businessName = business?.businessName || business?.name || 'our business';
  const customerName = lead?.name || '';
  const label = CHANNEL_LABEL[channel] || 'social';

  let tone = 'friendly and helpful';
  let knowledgeContext = '';
  try {
    if (business?._id) {
      const ai = await getAiSettings(business._id);
      // Master kill-switch: if the business turned AI off, don't generate.
      if (ai && ai.enabled === false) return null;
      if (ai?.tone) tone = ai.tone;
      const query = `${instruction || ''} ${incomingText || ''}`.trim();
      if (query) {
        const chunks = await retrieveKnowledge(business._id, query);
        knowledgeContext = formatKnowledgeContext(chunks);
      }
    }
  } catch {
    /* knowledge/tone optional */
  }

  const system = [
    `You are a ${label} assistant for "${businessName}".`,
    `Reply in a ${tone} tone. Keep it SHORT (1-2 sentences), casual and human, no markdown, suitable for ${label}.`,
    `Never invent prices, availability, or promises you cannot keep. If unsure, say the team will follow up.`,
    kind === 'public_comment'
      ? 'This is a PUBLIC reply under a comment — keep it very short, warm, and non-pushy.'
      : '',
    knowledgeContext
      ? `\n\nUse ONLY the following business information. If the answer isn't here, say the team will follow up.\n---\n${knowledgeContext}\n---`
      : '',
  ].filter(Boolean).join(' ');

  const user = [
    instruction ? `Instruction: ${instruction}` : 'Reply helpfully to the person.',
    customerName ? `Person's name: ${customerName}` : '',
    incomingText ? `Their message: "${incomingText}"` : '',
    'Write only the reply message they should receive — nothing else.',
  ].filter(Boolean).join('\n\n');

  try {
    const result = await chatCompletion({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7, // a little variety so replies aren't identical
      maxTokens: 200,
    });
    if (result?.content) return result.content.trim();
  } catch (err) {
    console.error('[autoReply] AI generation failed:', err.message);
  }
  return null;
}

export default { generateAutoReply };
