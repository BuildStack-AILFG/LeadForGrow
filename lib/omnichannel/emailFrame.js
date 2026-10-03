/**
 * Builds the standalone document an email is displayed in (iframe srcdoc).
 *
 * Rendering each email in its own document is what webmail clients do: the
 * email's own CSS applies exactly as the sender designed it, the app's CSS
 * can't squash it, and its CSS can't leak into the app. The iframe is
 * sandboxed without scripts; the CSP below additionally blocks every network
 * request except images, fonts and stylesheets (no tracking beacons via
 * fetch, no form posts, no frames).
 */
export const EMAIL_FRAME_SANDBOX = 'allow-same-origin allow-popups allow-popups-to-escape-sandbox';

const EMAIL_FRAME_CSP = [
  "default-src 'none'",
  'img-src https: http: data: cid:',
  "style-src 'unsafe-inline' https:",
  'font-src https: data:',
].join('; ');

// Neutral defaults for emails that don't style themselves (plain replies,
// messages written in our composer). Designed emails override all of this.
const EMAIL_FRAME_BASE_CSS = [
  'html{-webkit-text-size-adjust:100%;}',
  'body{margin:0;padding:0;background:#ffffff;color:#1f2937;',
  "font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
  'overflow-wrap:break-word;overflow-x:auto;}',
  // Keep fixed-width layout tables (e.g. a 1204px centring cell) inside the
  // pane; tables still never shrink below their content's minimum width.
  'table{max-width:100%;}',
  'img{max-width:100%;height:auto;}',
  'a{color:#2563eb;}',
  'blockquote{margin:8px 0;padding-left:10px;border-left:3px solid #cbd5e1;color:#64748b;}',
  'pre{white-space:pre-wrap;}',
].join('');

export function buildEmailDocument(html) {
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${EMAIL_FRAME_CSP}">`,
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<base target="_blank">',
    `<style>${EMAIL_FRAME_BASE_CSS}</style>`,
    '</head><body>',
    html || '',
    '</body></html>',
  ].join('');
}
