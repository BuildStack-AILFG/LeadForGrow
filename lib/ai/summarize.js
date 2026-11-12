import { chatCompletion } from '@/lib/ai/providers';
import AiSummary from '@/models/ai/AiSummary';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { getAiSettings } from '@/lib/ai/settings';

const TYPE_PROMPTS = {
  conversation: 'Summarize this customer conversation. Include key topics, customer intent, objections, and next steps.',
  meeting: 'Summarize this meeting. Include attendees, decisions, and action items.',
  email: 'Summarize this email thread. Include main request and required response.',
  daily: 'Summarize today\'s business activity: new leads, conversations, deals, and priorities.',
  weekly: 'Provide a weekly business summary with wins, risks, and recommendations.',
  account: 'Summarize this customer account: history, relationship health, and opportunities.',
  deal: 'Summarize this deal: stage, value, blockers, and likelihood to close.',
};

export async function generateSummary({
  businessId,
  businessName,
  type,
  content,
  entityType,
  entityId,
  persist = true,
}) {
  const aiSettings = await getAiSettings(businessId);
  const system = buildSystemPrompt({ businessName, aiSettings });
  const instruction = TYPE_PROMPTS[type] || 'Summarize the following:';

  const result = await chatCompletion({
      businessId: businessId,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `${instruction}\n\n${content}` },
    ],
    temperature: 0.3,
  });

  const summary = result.content?.trim() || 'Summary unavailable — insufficient data or AI not configured.';

  const doc = persist
    ? await AiSummary.create({
        businessId,
        type,
        entityType,
        entityId,
        summary,
        keyPoints: summary.split('\n').filter((l) => l.trim().startsWith('-') || l.trim().startsWith('•')).slice(0, 8),
        metadata: { provider: result.provider },
      })
    : { summary };

  return doc;
}

export default { generateSummary };
