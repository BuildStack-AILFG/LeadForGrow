/**
 * Email-safe building blocks shared by every design template.
 *
 * Designed emails have to survive Gmail, Outlook, Apple Mail and webmail
 * (Hostinger, Yahoo), so everything here follows the rules those clients
 * actually honour: table layout, inline styles, `bgcolor` attributes as a
 * fallback for background colours, absolute image URLs, a 600px container
 * that goes full-width on phones, and no flexbox/grid. The small <style>
 * block only adds mobile tweaks — the email still reads correctly in
 * clients that ignore it.
 *
 * Pure functions, no dependencies: used by the editor preview in the browser
 * and by the send path on the server.
 */

// Default imagery ships with the app. Emails are read outside our origin, so
// these must be absolute production URLs (the editor preview swaps the origin
// so they also show on localhost before a deploy).
export const EMAIL_ASSET_BASE = 'https://www.leadforgrow.com/email-assets';

// Replaced per recipient at send time with that lead's unsubscribe link.
export const UNSUBSCRIBE_TOKEN = '{{unsubscribe_url}}';

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Only http(s)/mailto/tel links and the unsubscribe token survive. */
/**
 * Tidy what people type into link fields: "https://https://site.com" (pasting
 * over the prefilled "https://") → "https://site.com", "www.site.com" →
 * "https://www.site.com", a bare "https://" → empty.
 */
export function normalizeUrl(value) {
  let url = String(value ?? '').trim();
  if (!url || url === UNSUBSCRIBE_TOKEN) return url;
  url = url.replace(/^(https?:\/\/)+/i, '$1');
  if (/^https?:\/\/?$/i.test(url)) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && /^[\w-]+(\.[\w-]+)+([/?#:].*)?$/.test(url)) url = `https://${url}`;
  return url;
}

export function safeUrl(value, fallback = '#') {
  const url = normalizeUrl(value);
  if (!url) return fallback;
  if (url === UNSUBSCRIBE_TOKEN) return url;
  return /^(https?:\/\/[^\s/]|mailto:|tel:)/i.test(url) ? url : fallback;
}

export function safeColor(value, fallback) {
  const c = String(value ?? '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : fallback;
}

/** Multi-line text → paragraphs; blank lines separate paragraphs. */
export function paragraphs(text, style) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;${style}">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function textStyle({ size = 16, color = '#1f2937', weight = 400, line = 1.6, align = 'left' } = {}) {
  return `font-family:${FONT};font-size:${size}px;line-height:${line};color:${color};font-weight:${weight};text-align:${align};`;
}

export function spacer(height) {
  return `<tr><td height="${height}" style="height:${height}px;line-height:${height}px;font-size:0;">&nbsp;</td></tr>`;
}

/** Full-width row with horizontal padding that shrinks on phones. */
export function row(content, { bg, padding = '0 40px', align = 'left' } = {}) {
  const bgAttr = bg ? ` bgcolor="${bg}"` : '';
  const bgStyle = bg ? `background-color:${bg};` : '';
  return `<tr><td class="px" align="${align}"${bgAttr} style="${bgStyle}padding:${padding};">${content}</td></tr>`;
}

export function image({ src, alt = '', width = 600, radius = 0, link }) {
  if (!src) return '';
  const img = `<img src="${esc(safeUrl(src, ''))}" alt="${esc(alt)}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:${radius}px;">`;
  return link ? `<a href="${esc(safeUrl(link))}" target="_blank" style="text-decoration:none;">${img}</a>` : img;
}

/** Bulletproof-style button: the whole cell is coloured, so it shows even when images are off. */
export function button({ label, url, bg = '#111827', color = '#ffffff', radius = 8, align = 'center', size = 16 }) {
  if (!label) return '';
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="${align}" style="margin:0 ${align === 'center' ? 'auto' : '0'};">
<tr><td align="center" bgcolor="${bg}" style="background-color:${bg};border-radius:${radius}px;">
<a href="${esc(safeUrl(url))}" target="_blank" style="display:inline-block;padding:14px 28px;${textStyle({ size, color, weight: 600, line: 1.2 })}text-decoration:none;border-radius:${radius}px;">${esc(label)}</a>
</td></tr></table>`;
}

export function logoOrName({ logoUrl, brandName, color, align = 'left', size = 20, height = 32 }) {
  if (logoUrl) {
    return `<img src="${esc(safeUrl(logoUrl, ''))}" alt="${esc(brandName || 'Logo')}" height="${height}" style="display:inline-block;height:${height}px;width:auto;border:0;">`;
  }
  return `<span style="${textStyle({ size, color, weight: 700, line: 1.2, align })}letter-spacing:-0.01em;">${esc(brandName || 'Your brand')}</span>`;
}

/** Legal/footer block with the per-recipient unsubscribe link. */
export function footer({ brandName, address, note, textColor = '#6b7280', linkColor = '#374151', bg, align = 'center' }) {
  const style = textStyle({ size: 12, color: textColor, line: 1.6, align });
  const parts = [
    note ? paragraphs(note, style) : '',
    address ? `<p style="margin:0 0 10px;${style}">${esc(address)}</p>` : '',
    `<p style="margin:0;${style}">You're receiving this email from ${esc(brandName || 'us')}. <a href="${UNSUBSCRIBE_TOKEN}" target="_blank" style="color:${linkColor};text-decoration:underline;">Unsubscribe</a></p>`,
  ];
  return row(parts.join(''), { bg, padding: '28px 40px 36px', align });
}

/**
 * Wraps the template's rows in a complete email document: preheader, mobile
 * CSS, full-width background and the centred 600px container.
 */
export function emailDocument({ title, preheader, pageBg = '#f3f4f6', containerBg = '#ffffff', rows }) {
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}${'&#8203;&nbsp;'.repeat(40)}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${esc(title || '')}</title>
<style>
body{margin:0;padding:0;-webkit-text-size-adjust:100%;}
img{-ms-interpolation-mode:bicubic;}
a{color:inherit;}
@media only screen and (max-width:620px){
  .container{width:100%!important;max-width:100%!important;}
  .px{padding-left:22px!important;padding-right:22px!important;}
  .stack{display:block!important;width:100%!important;max-width:100%!important;padding-left:0!important;padding-right:0!important;}
  .stack-gap{padding-top:18px!important;}
  .h1{font-size:28px!important;line-height:1.2!important;}
  .big{font-size:44px!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${pageBg};">
${hiddenPreheader}
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${pageBg}" style="background-color:${pageBg};">
<tr><td align="center" style="padding:24px 0;">
<table role="presentation" class="container" width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="${containerBg}" style="width:600px;max-width:600px;background-color:${containerBg};">
${rows.join('\n')}
</table>
</td></tr>
</table>
</body>
</html>`;
}
