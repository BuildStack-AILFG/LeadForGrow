import { chatCompletion } from '@/lib/ai/providers';
import { buildSystemPrompt, EMAIL_TYPES } from '@/lib/ai/prompts';
import { retrieveKnowledge, formatKnowledgeContext } from '@/lib/ai/rag/retriever';
import { getAiSettings } from '@/lib/ai/settings';

export async function generateEmail({
  businessId,
  businessName,
  type = 'followup',
  tone,
  length = 'medium',
  recipientName,
  context = '',
  subject,
}) {
  const aiSettings = await getAiSettings(businessId);
  const chunks = await retrieveKnowledge(businessId, context || type);
  const system = buildSystemPrompt({ businessName, aiSettings, knowledgeContext: formatKnowledgeContext(chunks) });

  const result = await chatCompletion({
      businessId: businessId,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `Write a ${EMAIL_TYPES[type] || type} email.
Recipient: ${recipientName || 'Customer'}
Tone: ${tone || aiSettings.tone || 'professional'}
Length: ${length}
${subject ? `Subject: ${subject}` : 'Include a subject line.'}
Context: ${context || 'General follow-up'}

Return format:
Subject: ...
Body:
...` },
    ],
    temperature: 0.5,
  });

  const text = result.content || `Subject: Following up\n\nHi ${recipientName || 'there'},\n\nThank you for your interest. I'd love to connect and discuss how we can help.\n\nBest regards,\n${businessName}`;
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const bodyMatch = text.split(/Body:\s*/i)[1] || text.replace(/Subject:.+\n?/i, '');

  return {
    subject: subjectMatch?.[1]?.trim() || subject || 'Following up',
    body: bodyMatch.trim(),
    provider: result.provider || 'fallback',
  };
}

export default { generateEmail };
