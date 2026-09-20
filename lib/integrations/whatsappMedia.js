import { decryptMaybe } from '../encryption';
import { fetchExternal } from '../fetchExternal';
import { prepareWhatsAppMessage } from './whatsapp';
import { whatsappMediaType } from '@/lib/omnichannel/mediaTypes';

/**
 * Send media message via Meta WhatsApp Cloud API
 */
export async function sendMetaMediaMessage(lead, business, { mediaUrl, mimeType, fileName, caption, messageType }) {
  const credentials = business.integrationCredentials?.whatsapp;
  const { phoneNumberId, apiKey } = credentials || {};
  if (!phoneNumberId || !apiKey) throw new Error('Meta credentials missing');

  const token = decryptMaybe(apiKey);
  const { phone } = prepareWhatsAppMessage(lead, business, '');
  const cleanPhone = phone.replace('+', '');
  const waType = whatsappMediaType(messageType);

  const mediaPayload = { link: mediaUrl };
  if (waType === 'document' && fileName) mediaPayload.filename = fileName;

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: waType,
    [waType]: {
      ...mediaPayload,
      ...(caption && waType !== 'audio' ? { caption } : {}),
    },
  };

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
    throw new Error(data.error?.message || 'Meta media send failed');
  }

  return { success: true, messageId: data.messages?.[0]?.id, provider: 'meta' };
}

export default { sendMetaMediaMessage };
