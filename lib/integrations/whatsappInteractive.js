import { decryptMaybe } from '@/lib/encryption';
import { fetchExternal } from '@/lib/fetchExternal';
import { prepareWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { recordOutgoingMessage } from '@/lib/integrations/whatsapp';

function getMetaCreds(business) {
  const credentials = business.integrationCredentials?.whatsapp;
  if (!credentials?.enabled) throw new Error('WhatsApp integration not enabled');
  if (!credentials.phoneNumberId || !credentials.apiKey) throw new Error('Meta credentials missing');
  return {
    phoneNumberId: credentials.phoneNumberId,
    token: decryptMaybe(credentials.apiKey),
  };
}

function toPhone(lead) {
  const { phone } = prepareWhatsAppMessage(lead, {}, '');
  return phone.replace('+', '');
}

async function postMeta(business, payload) {
  const { phoneNumberId, token } = getMetaCreds(business);
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  const response = await fetchExternal(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Meta API Error');
  }
  return data;
}

/**
 * Send interactive reply buttons (max 3).
 */
export async function sendInteractiveButtons(lead, business, { body, buttons = [], header, footer }) {
  const to = toPhone(lead);
  const safeButtons = buttons.slice(0, 3).map((b, i) => ({
    type: 'reply',
    reply: {
      id: String(b.id || `btn_${i + 1}`).slice(0, 256),
      title: String(b.title || `Option ${i + 1}`).slice(0, 20),
    },
  }));

  if (!safeButtons.length) throw new Error('At least one button required');

  const interactive = {
    type: 'button',
    body: { text: String(body || '').slice(0, 1024) },
    action: { buttons: safeButtons },
  };
  if (header) interactive.header = { type: 'text', text: String(header).slice(0, 60) };
  if (footer) interactive.footer = { text: String(footer).slice(0, 60) };

  const data = await postMeta(business, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive,
  });

  const messageId = data.messages?.[0]?.id;
  const displayBody = [header, body, footer]
    .filter(Boolean)
    .join('\n')
    + `\n\n🔘 ${safeButtons.map((b) => b.reply.title).join('   |   ')}`;
  await recordOutgoingMessage(lead._id, business._id, displayBody, messageId);
  return { success: true, messageId, provider: 'meta' };
}

/**
 * Send interactive list message.
 */
export async function sendInteractiveList(lead, business, { body, buttonText = 'Options', sections = [], header, footer }) {
  const to = toPhone(lead);
  const safeSections = (sections || []).slice(0, 10).map((section, si) => ({
    title: String(section.title || `Section ${si + 1}`).slice(0, 24),
    rows: (section.rows || []).slice(0, 10).map((row, ri) => ({
      id: String(row.id || `row_${si}_${ri}`).slice(0, 200),
      title: String(row.title || `Row ${ri + 1}`).slice(0, 24),
      ...(row.description ? { description: String(row.description).slice(0, 72) } : {}),
    })),
  })).filter((s) => s.rows.length);

  if (!safeSections.length) throw new Error('At least one list section with rows required');

  const interactive = {
    type: 'list',
    body: { text: String(body || '').slice(0, 1024) },
    action: {
      button: String(buttonText || 'Options').slice(0, 20),
      sections: safeSections,
    },
  };
  if (header) interactive.header = { type: 'text', text: String(header).slice(0, 60) };
  if (footer) interactive.footer = { text: String(footer).slice(0, 60) };

  const data = await postMeta(business, {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive,
  });

  const messageId = data.messages?.[0]?.id;
  const optionLines = safeSections
    .flatMap((s) => s.rows.map((r) => `• ${r.title}`))
    .join('\n');
  const displayBody = [header, body].filter(Boolean).join('\n')
    + `\n\n📋 ${buttonText}:\n${optionLines}`;
  await recordOutgoingMessage(lead._id, business._id, displayBody, messageId);
  return { success: true, messageId, provider: 'meta' };
}

export default { sendInteractiveButtons, sendInteractiveList };
