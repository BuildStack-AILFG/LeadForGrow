import { EMAIL_DESIGN_TEMPLATES as CORE_TEMPLATES } from './templates.js';
import { FESTIVAL_TEMPLATES, LIFECYCLE_TEMPLATES } from './festivals.js';
import { UNSUBSCRIBE_TOKEN, EMAIL_ASSET_BASE } from './blocks.js';

export { UNSUBSCRIBE_TOKEN, EMAIL_ASSET_BASE };

export const EMAIL_DESIGN_TEMPLATES = [...CORE_TEMPLATES, ...LIFECYCLE_TEMPLATES, ...FESTIVAL_TEMPLATES];

/** Gallery filter order. */
export const EMAIL_DESIGN_CATEGORIES = ['Festivals', 'Promotion', 'Customer care', 'Product', 'Updates', 'Events', 'Onboarding', 'Personal'];

/** How a broadcast's email body was authored. */
export const EMAIL_BODY_FORMATS = ['rich', 'design', 'html'];

export function getEmailDesign(id) {
  return EMAIL_DESIGN_TEMPLATES.find((t) => t.id === id) || null;
}

export function defaultDesignValues(id) {
  const t = getEmailDesign(id);
  if (!t) return {};
  return Object.fromEntries(t.fields.map((f) => [f.key, f.default ?? '']));
}

/** Render a template with the user's values (unknown keys ignored, missing keys → defaults). */
export function renderEmailDesign(id, values = {}) {
  const t = getEmailDesign(id);
  if (!t) return '';
  const merged = { ...defaultDesignValues(id) };
  for (const f of t.fields) {
    if (values[f.key] !== undefined && values[f.key] !== null) merged[f.key] = String(values[f.key]);
  }
  return t.render(merged);
}

/**
 * Plain-text part for a designed/HTML email. Every marketing email should be
 * multipart: some clients and spam filters look at the text part, and it's
 * what shows in notifications.
 */
export function emailHtmlToText(html) {
  return String(html || '')
    .replace(/<(head|style|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, label) => {
      const text = label.replace(/<[^>]+>/g, '').trim();
      return href.startsWith('http') && text ? `${text} (${href})` : text;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|tr|h[1-6]|li|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#8203;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l, i, arr) => l || (arr[i - 1] && arr[i - 1].trim()))
    .join('\n')
    .trim();
}

/**
 * Insert the recipient's unsubscribe link. Designs carry a placeholder in
 * their footer; custom HTML without one gets a small footer line added
 * before </body> (or at the end), so every marketing email has a working
 * unsubscribe link.
 */
export function withUnsubscribeLink(html, unsubscribeUrl) {
  const source = String(html || '');
  const url = unsubscribeUrl || '#';
  if (source.includes(UNSUBSCRIBE_TOKEN)) return source.split(UNSUBSCRIBE_TOKEN).join(url);
  if (!unsubscribeUrl) return source;
  const line = `<p style="margin:16px 0;font-family:Arial,sans-serif;font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;">Don't want these emails? <a href="${url}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a></p>`;
  return /<\/body>/i.test(source) ? source.replace(/<\/body>/i, `${line}</body>`) : source + line;
}

/**
 * Personalisation for HTML bodies: same variables as the plain-text path,
 * but values are HTML-escaped so a lead named `<b>Sam</b>` can't inject markup.
 */
export function applyHtmlVars(html, { name = '', email = '', phone = '', businessName = '' } = {}) {
  const e = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return String(html || '')
    .replace(/\{\{name\}\}/gi, e(name))
    .replace(/\{\{email\}\}/gi, e(email))
    .replace(/\{\{phone\}\}/gi, e(phone))
    .replace(/\{\{business\.name\}\}/gi, e(businessName));
}
