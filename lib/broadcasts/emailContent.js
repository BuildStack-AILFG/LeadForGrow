import { EMAIL_BODY_FORMATS, getEmailDesign, renderEmailDesign, emailHtmlToText } from '../emailDesigns/index.js';
import { sanitizeEmailHtml } from '../omnichannel/emailHtml.js';

const MAX_FIELD_LENGTH = 5000;
const MAX_CUSTOM_HTML_BYTES = 300 * 1024;

export class EmailContentError extends Error {}

/**
 * Normalise a broadcast's email content before it is stored.
 *
 * - `design`: the HTML is rendered here from the template id + field values;
 *   HTML sent by the browser is ignored, so a stored design is always one of
 *   our email-safe templates with escaped values.
 * - `html`: custom HTML (e.g. exported from Canva/Stripo/Mailchimp) is
 *   sanitised — no scripts, iframes, forms or javascript: links.
 * - `rich` (default): the existing WYSIWYG body, unchanged.
 *
 * For design/html the plain-text part is generated from the HTML.
 */
export function normalizeBroadcastEmailContent(content) {
  if (!content || typeof content !== 'object') return content;
  const format = EMAIL_BODY_FORMATS.includes(content.bodyFormat) ? content.bodyFormat : 'rich';

  if (format === 'design') {
    const templateId = content.bodyDesign?.templateId;
    const design = getEmailDesign(templateId);
    if (!design) throw new EmailContentError('Choose an email design template.');
    const input = content.bodyDesign?.values || {};
    const values = {};
    for (const field of design.fields) {
      const v = input[field.key];
      if (v !== undefined && v !== null) values[field.key] = String(v).slice(0, MAX_FIELD_LENGTH);
    }
    const bodyHtml = renderEmailDesign(templateId, values);
    return { ...content, bodyFormat: 'design', bodyDesign: { templateId, values }, bodyHtml, body: emailHtmlToText(bodyHtml) };
  }

  if (format === 'html') {
    const raw = String(content.bodyHtml || '');
    if (!raw.trim()) throw new EmailContentError('Paste or upload the email HTML.');
    if (Buffer.byteLength(raw, 'utf8') > MAX_CUSTOM_HTML_BYTES) {
      throw new EmailContentError('Email HTML is larger than 300 KB. Host images online instead of embedding them.');
    }
    const bodyHtml = sanitizeEmailHtml(raw);
    return { ...content, bodyFormat: 'html', bodyDesign: undefined, bodyHtml, body: emailHtmlToText(bodyHtml) };
  }

  return { ...content, bodyFormat: 'rich', bodyDesign: undefined };
}

/**
 * Validate a "My templates" entry with the same rules as a broadcast body.
 * Returns the fields to store: design → baseTemplateId + known values;
 * html → sanitised HTML.
 */
export function normalizeSavedEmailDesign({ name, format, baseTemplateId, values, html, subject } = {}) {
  const cleanName = String(name || '').trim().slice(0, 80);
  if (!cleanName) throw new EmailContentError('Give the template a name.');
  if (format !== 'design' && format !== 'html') throw new EmailContentError('Unknown template format.');
  const normalized = normalizeBroadcastEmailContent(
    format === 'design'
      ? { bodyFormat: 'design', bodyDesign: { templateId: baseTemplateId, values } }
      : { bodyFormat: 'html', bodyHtml: html },
  );
  return {
    name: cleanName,
    format,
    baseTemplateId: format === 'design' ? normalized.bodyDesign.templateId : undefined,
    values: format === 'design' ? normalized.bodyDesign.values : undefined,
    html: format === 'html' ? normalized.bodyHtml : undefined,
    subject: String(subject || '').trim().slice(0, 200) || undefined,
  };
}
