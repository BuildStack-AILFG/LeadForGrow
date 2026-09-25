import mongoose from 'mongoose';
import { decryptMaybe } from '../encryption';
import { fetchExternal } from '../fetchExternal';
import { toWhatsAppNumber } from '../whatsapp/waPhone';

/**
 * Generates a WhatsApp message and a direct link
 */
export const prepareWhatsAppMessage = (lead, business, template) => {
  // Replace all supported variables
  let renderedMessage = (template || '')
    .replace(/{{name}}/g, lead.name || 'Customer')
    .replace(/{{serviceInterest}}/g, lead.serviceInterest || 'our services')
    .replace(/{{phone}}/g, lead.phone || '')
    .replace(/{{email}}/g, lead.email || '');

  const cleanPhone = toWhatsAppNumber(lead.whatsapp || lead.phone || '');

  return {
    message: renderedMessage,
    link: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(renderedMessage)}`,
    phone: '+' + cleanPhone
  };
};

// Message.origin values a WhatsApp send can carry.
const SEND_ORIGINS = new Set(['user', 'automation', 'sequence', 'broadcast', 'meeting', 'system']);

/**
 * Sends a WhatsApp message via Business API (Meta or Interakt).
 *
 * `sendOptions.origin` says who caused the send and is stored on the Message
 * ('user' = an agent typed it; 'broadcast' | 'sequence' | 'meeting' | 'system').
 * Defaults to 'automation' because almost every caller is automated; the agent
 * send routes pass 'user'. First-response tracking and the inbox "Human replies"
 * filter depend on this being right.
 */
export const sendAutoWhatsApp = async (lead, business, template, templateName = null, headerMedia = null, templateLanguage = 'en', metaComponents = null, resolvedVars = null, extraMetadata = null, sendOptions = {}) => {
  const credentials = business.integrationCredentials?.whatsapp;

  if (!credentials || !credentials.enabled) {
    console.log(`[WhatsApp] Skipping: Integration not enabled for ${business.businessName}`);
    return { success: false, reason: 'unconfigured' };
  }

  const provider = credentials.provider || 'meta';

  try {
    if (provider === 'interakt') {
      return await sendInteraktMessage(lead, business, template, templateName, headerMedia, extraMetadata, sendOptions);
    } else {
      return await sendMetaMessage(lead, business, template, templateName, headerMedia, templateLanguage, metaComponents, resolvedVars, extraMetadata, sendOptions);
    }
  } catch (error) {
    console.error(`[WhatsApp] ${provider} send failed:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Meta only allows free-form text within 24h of the customer's last reply.
 * Outside that window, an approved template must be used.
 */
async function hasOpenCustomerCareWindow(leadId, businessId) {
  if (!leadId || !businessId) return false;
  try {
    const Message = (await import('../../models/automation/Message')).default;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const inbound = await Message.findOne({
      leadId,
      businessId,
      direction: 'incoming',
      timestamp: { $gte: since },
    }).select('_id').lean();
    return Boolean(inbound);
  } catch {
    return false;
  }
}

/**
 * Meta Cloud API Native Implementation
 */
export async function sendMetaMessage(lead, business, templateText, templateName, headerMedia, templateLanguage = 'en', metaComponents = null, resolvedVars = null, extraMetadata = null, sendOptions = {}) {
  const credentials = business.integrationCredentials.whatsapp;
  const { phoneNumberId, apiKey } = credentials;

  if (!phoneNumberId || !apiKey) throw new Error('Meta credentials missing');

  const token = decryptMaybe(apiKey);
  const { message, phone } = prepareWhatsAppMessage(lead, business, templateText);
  const cleanPhone = phone.replace('+', '');

  // Free-form text outside the 24h window is accepted by Meta then fails with 131047.
  // Fail fast with a clear error instead of a fake "sent" success.
  if (!templateName) {
    const windowOpen = await hasOpenCustomerCareWindow(lead._id, business._id);
    if (!windowOpen) {
      throw new Error(
        'WhatsApp 24h window closed. Customer must message your business number first, or send an approved Meta template message.'
      );
    }
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  let payload;
  if (templateName) {
    payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage }
      }
    };

    // Meta rejects params containing newlines, tabs, or runs of 4+ spaces.
    // Also has a 1024-char cap per parameter.
    const sanitizeParam = (val) => {
      const s = String(val ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s{4,}/g, '   ').trim();
      return s.slice(0, 1024) || 'Customer';
    };
    const paramFromResolved = (index) => ({
      type: "text",
      text: sanitizeParam(
        Array.isArray(resolvedVars) && resolvedVars[index] != null && resolvedVars[index] !== ''
          ? resolvedVars[index]
          : lead.name
      ),
    });

    // Prefer the stored WhatsAppTemplate as the source of truth for what
    // components/variables Meta expects — same source Meta uses for template
    // review. Falls back to legacy metaComponents / templateText parsing.
    let templateComponents = metaComponents;
    if (!templateComponents) {
      try {
        const WhatsAppTemplate = (await import('../../models/automation/WhatsAppTemplate')).default;
        const stored = await WhatsAppTemplate.findOne({
          businessId: business._id,
          name: templateName.toLowerCase(),
          language: templateLanguage,
        }).lean();
        if (stored?.components?.length) templateComponents = stored.components;
      } catch (dbErr) {
        console.warn('[WhatsApp:Meta] Template lookup failed, falling back:', dbErr.message);
      }
    }

    const componentsOut = [];

    if (Array.isArray(templateComponents) && templateComponents.length) {
      const header = templateComponents.find((c) => (c.type || '').toUpperCase() === 'HEADER');
      const body = templateComponents.find((c) => (c.type || '').toUpperCase() === 'BODY');
      const buttons = templateComponents.find((c) => (c.type || '').toUpperCase() === 'BUTTONS');

      // Header parameters
      if (header) {
        const fmt = (header.format || 'TEXT').toUpperCase();
        if (fmt === 'TEXT') {
          const headerVars = (header.text || '').match(/\{\{\d+\}\}/g) || [];
          if (headerVars.length) {
            componentsOut.push({
              type: 'header',
              parameters: headerVars.map((_, i) => paramFromResolved(i)),
            });
          }
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(fmt)) {
          // Media headers at SEND time need a public URL (`link`) — the "4:…"
          // upload handle from template review CANNOT be reused here (Meta
          // returns "violated JSON schema" because it expects an integer id).
          // Broadcasts pass a per-campaign media URL via `headerMedia`.
          if (!headerMedia) {
            throw new Error(
              `Template "${templateName}" has a ${fmt.toLowerCase()} header. Provide a public media URL when sending — the template's sample cannot be reused for sending.`
            );
          }
          const key = fmt.toLowerCase();
          const mediaParam = { type: key, [key]: { link: headerMedia } };
          if (fmt === 'DOCUMENT') {
            mediaParam[key].filename = header.example?.header_filename || 'document.pdf';
          }
          componentsOut.push({
            type: 'header',
            parameters: [mediaParam],
          });
        }
      }

      // Body parameters
      if (body) {
        const bodyVars = (body.text || '').match(/\{\{\d+\}\}/g) || [];
        if (bodyVars.length) {
          // Header vars consumed the first `headerCount` slots of resolvedVars — for
          // simplicity we assume broadcasts either target header OR body but not both.
          // If both, the same resolvedVars array is used in order.
          componentsOut.push({
            type: 'body',
            parameters: bodyVars.map((_, i) => paramFromResolved(i)),
          });
        }
      }

      // URL button parameters (dynamic {{n}} in a URL)
      if (buttons?.buttons?.length) {
        buttons.buttons.forEach((btn, idx) => {
          if ((btn.type || '').toUpperCase() === 'URL' && /\{\{\d+\}\}/.test(String(btn.url || ''))) {
            componentsOut.push({
              type: 'button',
              sub_type: 'url',
              index: String(idx),
              parameters: [{ type: 'text', text: sanitizeParam(resolvedVars?.[0] ?? lead.name) }],
            });
          }
        });
      }
    } else if (Array.isArray(resolvedVars) && resolvedVars.length > 0) {
      // No stored template — trust the mapping the broadcast provided
      componentsOut.push({
        type: 'body',
        parameters: resolvedVars.map((_, i) => paramFromResolved(i)),
      });
    } else {
      const matches = typeof templateText === 'string' ? templateText.match(/\{\{\w+\}\}/g) : null;
      if (matches?.length) {
        componentsOut.push({
          type: 'body',
          parameters: matches.map((_, i) => paramFromResolved(i)),
        });
      }
    }

    // Old callers may have already pushed a headerMedia component. Preserve that
    // path only when we couldn't infer a header from the stored template.
    if (!componentsOut.some((c) => c.type === 'header') && headerMedia) {
      componentsOut.push({
        type: 'header',
        parameters: [{ type: 'video', video: { link: headerMedia } }],
      });
    }

    if (componentsOut.length) payload.template.components = componentsOut;
  } else {
    payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: { body: message }
    };
  }

  // If we don't have a rendered message but have metaComponents (Template body), 
  // let's try to create a preview message for our own records.
  let messagePreview = message;
  if (!messagePreview && metaComponents) {
    const bodyComp = metaComponents.find(c => c.type === 'BODY' || c.type === 'body');
    if (bodyComp && bodyComp.text) {
      messagePreview = bodyComp.text.replace(/\{\{\d+\}\}/g, lead.name || 'Customer');
    }
  }

  const response = await fetchExternal(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log(`[WhatsApp:Meta] API Response for ${lead.name}:`, JSON.stringify(data));
  
  if (!response.ok) {
    console.error(`[WhatsApp:Meta] Error Details:`, data);
    throw new Error(data.error?.message || 'Meta API Error');
  }

  await recordOutgoingMessage(lead._id, business._id, messagePreview, data.messages?.[0]?.id, templateName, extraMetadata, sendOptions.origin);
  return { success: true, provider: 'meta', messageId: data.messages?.[0]?.id };
}

/**
 * Interakt API Implementation (Preserving complex logic)
 */
async function sendInteraktMessage(lead, business, template, templateName, headerMedia, extraMetadata = null, sendOptions = {}) {
  const credentials = business.integrationCredentials.whatsapp;
  const apiKey = decryptMaybe(credentials.interaktApiKey || credentials.apiKey);
  const { message, phone } = prepareWhatsAppMessage(lead, business, template);

  const authHeader = `Basic ${apiKey}`;

  // 1. Track User
  try {
    await fetchExternal('https://api.interakt.ai/v1/public/track/users/', {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: lead._id,
        fullPhoneNumber: phone,
        traits: { name: lead.name, email: lead.email || '', source: 'LeadForGrow' }
      })
    });
  } catch (e) { console.warn('[WhatsApp] Interakt tracking failed:', e.message); }

  // 2. Build Payload
  let payload;
  if (templateName) {
    const sanitize = (val) => String(val || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    let headerValues = headerMedia ? [headerMedia] : [];

    // Auto-fix localhost media
    if (headerMedia?.includes('localhost')) {
      headerValues = ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"];
    }

    payload = {
      fullPhoneNumber: phone,
      type: 'Template',
      template: {
        name: templateName,
        languageCode: 'en',
        headerValues: headerValues.length > 0 ? headerValues : undefined,
        bodyValues: [sanitize(lead.name)]
      }
    };
  } else {
    payload = {
      fullPhoneNumber: phone,
      type: 'Text',
      data: { message: message }
    };
  }

  const response = await fetchExternal('https://api.interakt.ai/v1/public/message/', {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Interakt API Error');

  await recordOutgoingMessage(lead._id, business._id, message, data.id || data.messageId, templateName, extraMetadata, sendOptions.origin);
  return { success: true, provider: 'interakt', data };
}

/**
 * Save outgoing message to DB and update conversation state
 */
export async function recordOutgoingMessage(leadId, businessId, text, externalId, templateName = null, extraMetadata = null, origin = 'automation') {
  try {
    const safeOrigin = SEND_ORIGINS.has(origin) ? origin : 'automation';
    const bodyText = text
      || (templateName ? `[Template: ${templateName}] Automated message sent.` : 'Automated message sent');

    // Primary: record into the omnichannel conversation so the inbox shows it
    // (with a conversationId) and a realtime event is emitted for live refresh.
    const { recordChannelMessage } = await import('@/lib/omnichannel/conversationService');
    const Lead = (await import('../../models/automation/Lead')).default;
    const lead = await Lead.findById(leadId).select('name phone whatsapp whatsappId').lean();

    // Use the SAME participant key incoming messages use (the wa_id / phone,
    // no leading '+'), so outgoing and incoming land in ONE conversation
    // instead of splitting into two threads for the same person.
    const participantId = String(
      lead?.whatsappId || lead?.whatsapp || lead?.phone || leadId
    ).replace(/^\+/, '');

    await recordChannelMessage({
      businessId,
      channel: 'whatsapp',
      leadId,
      messageId: externalId || `local-${Date.now()}`,
      direction: 'outgoing',
      type: 'text',
      status: 'sent',
      timestamp: new Date(),
      content: {
        body: bodyText,
        participantId,
        participantPhone: lead?.whatsappId || lead?.whatsapp || lead?.phone,
        participantName: lead?.name,
      },
      origin: safeOrigin,
      ...(extraMetadata ? { rawMetadata: extraMetadata } : {}),
    });

    // Legacy store kept in sync for older chat APIs that read WhatsAppConversation.
    const WhatsAppConversation = (await import('../../models/automation/WhatsAppConversation')).default;
    const existingConv = await WhatsAppConversation.findOne({ businessId, leadId });
    const nextStatus = existingConv?.status === 'intervened' ? 'intervened' : 'read';
    await WhatsAppConversation.findOneAndUpdate(
      { businessId, leadId },
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessagePreview: bodyText.substring(0, 100),
          lastMessageDirection: 'outgoing',
          status: nextStatus,
          unreadCount: 0,
        },
      },
      { upsert: true }
    );
  } catch (err) { console.error('[WhatsApp] DB Recording failed:', err); }
}
