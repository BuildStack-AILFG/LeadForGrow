import sanitizeHtml from 'sanitize-html';
import { parse, serialize } from 'parse5';

/**
 * sanitize-html config for stored inbound email HTML.
 *
 * Emails are displayed only inside a sandboxed iframe (see emailFrame.js and
 * EmailHtmlBody): scripts can't run there and a CSP blocks every request
 * except images, fonts and stylesheets. That lets us keep what real emails
 * need to look right — their <style> blocks, table layout attributes, ids and
 * classes — while still stripping scripts, iframes, forms, event handlers and
 * javascript:/vbscript: URLs as defence in depth.
 *
 * sanitize-html is used instead of DOMPurify because it is pure JS (no jsdom)
 * and so loads correctly in the serverless/turbopack runtime — isomorphic-
 * dompurify pulled jsdom, which crashed the route at module load.
 *
 * `target=_blank` + `rel=noopener noreferrer` are enforced on every anchor so
 * a malicious sender can't hijack the parent window via window.opener.
 */
export const EMAIL_HTML_SANITIZE_CONFIG = {
  allowedTags: [
    'a', 'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'del', 'ins', 'mark', 'abbr', 'big',
    'br', 'wbr', 'p', 'span', 'div', 'center', 'ul', 'ol', 'li',
    'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'section', 'header', 'footer', 'article', 'main', 'figure', 'figcaption', 'address',
    'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tr', 'td', 'th', 'tfoot',
    'img', 'hr', 'small', 'sub', 'sup', 'dl', 'dt', 'dd', 'font',
    // Most designed emails keep their layout and mobile rules in <style>.
    'style',
  ],
  allowedAttributes: {
    '*': ['style', 'width', 'height', 'align', 'valign', 'border', 'bgcolor', 'color', 'class', 'id', 'name', 'title', 'dir', 'lang', 'role'],
    a: ['href', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: ['cellpadding', 'cellspacing', 'border', 'width', 'bgcolor', 'align', 'background'],
    td: ['colspan', 'rowspan', 'width', 'height', 'align', 'valign', 'bgcolor', 'background', 'nowrap'],
    th: ['colspan', 'rowspan', 'width', 'height', 'align', 'valign', 'bgcolor', 'background', 'nowrap'],
    col: ['span', 'width'],
    font: ['color', 'face', 'size'],
  },
  // <style> is only safe because the HTML is rendered in a script-less,
  // CSP-locked iframe; sanitize-html requires this flag to keep it.
  allowVulnerableTags: true,
  // Blocks javascript:/vbscript: everywhere; images may still use data:/cid: URIs.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data', 'cid'] },
  // Drop these tags AND their text content entirely (not just the tag).
  // <title> is here so the document title ("Facebook") doesn't show up as
  // stray text at the top of the email.
  nonTextTags: ['script', 'textarea', 'noscript', 'iframe', 'title', 'option'],
  // Force safe link behaviour on every anchor (merge keeps existing attrs).
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true),
  },
};

/**
 * Repair the markup the way a browser would before sanitizing. Real-world
 * emails (Meta receipts, many ESP templates) leave cells unclosed and close
 * rows early; browsers fix that with the HTML5 parsing rules, but
 * sanitize-html's lenient parser fixes it differently, which moved whole
 * sections into the wrong table columns. parse5 implements the HTML5 spec,
 * so the stored layout matches what Hostinger/Gmail show.
 */
function normalizeHtml(html) {
  try {
    return serialize(parse(html));
  } catch {
    return html;
  }
}

export function sanitizeEmailHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtml(normalizeHtml(html), EMAIL_HTML_SANITIZE_CONFIG);
}
