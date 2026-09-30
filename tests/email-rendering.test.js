/**
 * Inbound email rendering: designed emails (Meta receipts, newsletters) must
 * look as the sender built them, without opening an XSS hole.
 *
 * Before: <style> blocks were stripped, the <title> leaked in as body text
 * ("Facebook"), and the app's CSS forced every element to max-width:100%
 * with word-break, so table columns collapsed into one letter per line.
 *
 * Run: node --test tests/email-rendering.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeEmailHtml } from '../lib/omnichannel/emailHtml.js';
import { buildEmailDocument, EMAIL_FRAME_SANDBOX } from '../lib/omnichannel/emailFrame.js';

const META_RECEIPT = `<!doctype html><html><head><title>Facebook</title>
<style>.mmsgLetter{width:600px}.amount{font-size:40px;color:#3b5998}@media (max-width:480px){.col{display:block!important}}</style>
</head><body><table class="mmsgLetter" width="600" cellpadding="0" cellspacing="0" align="center" role="presentation">
<tr><td class="col" width="50%" valign="top" nowrap>Amount billed<div class="amount">3.00 INR</div></td>
<td class="col" width="50%" background="https://example.com/bg.png">Date range</td></tr></table></body></html>`;

describe('sanitizeEmailHtml', () => {
  const out = sanitizeEmailHtml(META_RECEIPT);

  it('keeps the email\'s own <style> rules and table layout attributes', () => {
    assert.match(out, /<style>\.mmsgLetter\{width:600px\}/);
    assert.match(out, /@media \(max-width:480px\)/);
    assert.match(out, /<table class="mmsgLetter" width="600" cellpadding="0" cellspacing="0" align="center" role="presentation">/);
    assert.match(out, /<td class="col" width="50%" valign="top" nowrap(="")?>/);
    assert.match(out, /background="https:\/\/example\.com\/bg\.png"/);
  });

  it('repairs broken markup the way browsers do (HTML5 rules) before sanitizing', () => {
    // Unclosed cells and rows closed early — common in Meta and ESP emails.
    const fixed = sanitizeEmailHtml('<table><tr><td>A</tr><tr><td>B<td>C</table><p>after');
    assert.equal(fixed, '<table><tbody><tr><td>A</td></tr><tr><td>B</td><td>C</td></tr></tbody></table><p>after</p>');
  });

  it('drops the document <title> so it doesn\'t appear as body text', () => {
    assert.doesNotMatch(out, /Facebook/);
  });

  it('still strips scripts, handlers, frames, forms and javascript: links', () => {
    const evil = sanitizeEmailHtml(
      '<script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">x</a>'
      + '<iframe src="https://evil.test"></iframe><form action="https://evil.test"><input name="p"></form>'
      + '<div onclick="alert(4)" style="color:red">ok</div>',
    );
    assert.doesNotMatch(evil, /<script|alert\(1\)|onerror|onclick|javascript:|<iframe|<form|<input/i);
    assert.match(evil, /<div style="color:red">ok<\/div>/);
    assert.match(sanitizeEmailHtml('<a href="https://x.test">x</a>'), /target="_blank" rel="noopener noreferrer"/);
  });
});

describe('email frame', () => {
  const doc = buildEmailDocument('<p>Hello</p>');

  it('never allows scripts in the sandbox', () => {
    assert.doesNotMatch(EMAIL_FRAME_SANDBOX, /allow-scripts/);
    assert.match(EMAIL_FRAME_SANDBOX, /allow-popups-to-escape-sandbox/);
  });

  it('locks the document down with a CSP and opens links in a new tab', () => {
    assert.match(doc, /http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data: cid:; style-src 'unsafe-inline' https:; font-src https: data:"/);
    assert.match(doc, /<base target="_blank">/);
    assert.ok(doc.indexOf('<p>Hello</p>') > doc.indexOf('</head>'), 'email after the base styles so its CSS wins');
  });

  it('the inbox renders email HTML through the sandboxed frame, not innerHTML', () => {
    const bubble = readFileSync(new URL('../app/automation/components/chat/MessageBubble.jsx', import.meta.url), 'utf8');
    const body = bubble.slice(bubble.indexOf('export function EmailHtmlBody'), bubble.indexOf('function MessageBubble('));
    assert.match(body, /<iframe[\s\S]*srcDoc=\{srcDoc\}[\s\S]*sandbox=\{EMAIL_FRAME_SANDBOX\}/);
    assert.doesNotMatch(body, /dangerouslySetInnerHTML/);
  });
});
