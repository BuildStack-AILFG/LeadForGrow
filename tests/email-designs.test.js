/**
 * Designed email templates for broadcasts.
 *
 * Run: node --test tests/email-designs.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EMAIL_DESIGN_TEMPLATES, UNSUBSCRIBE_TOKEN, renderEmailDesign, defaultDesignValues,
  emailHtmlToText, withUnsubscribeLink, applyHtmlVars,
} from '../lib/emailDesigns/index.js';
import { normalizeBroadcastEmailContent, normalizeSavedEmailDesign, EmailContentError } from '../lib/broadcasts/emailContent.js';

describe('design templates', () => {
  it('ships 22 templates with unique ids and grouped fields', () => {
    assert.equal(EMAIL_DESIGN_TEMPLATES.length, 22);
    assert.equal(new Set(EMAIL_DESIGN_TEMPLATES.map((t) => t.id)).size, 22);
    for (const id of ['gandhi-jayanti', 'diwali-offer', 'navratri', 'christmas', 'new-year', 'holi', 'independence-day', 'eid', 'raksha-bandhan', 'mega-sale', 'birthday', 'feedback', 'win-back']) {
      assert.ok(EMAIL_DESIGN_TEMPLATES.some((t) => t.id === id), id);
    }
    for (const t of EMAIL_DESIGN_TEMPLATES) {
      assert.ok(t.name && t.description && t.category, t.id);
      for (const f of t.fields) assert.ok(f.key && f.label && f.group && ['text', 'textarea', 'url', 'image', 'color'].includes(f.type), `${t.id}.${f.key}`);
    }
  });

  for (const t of EMAIL_DESIGN_TEMPLATES) {
    it(`${t.id}: renders an email-safe document with an unsubscribe link`, () => {
      const html = renderEmailDesign(t.id, {});
      assert.match(html, /^<!DOCTYPE html>/);
      assert.match(html, /<table role="presentation" class="container" width="600"/);
      assert.match(html, /@media only screen and \(max-width:620px\)/);
      assert.ok(html.includes(`href="${UNSUBSCRIBE_TOKEN}"`), 'footer unsubscribe link');
      assert.doesNotMatch(html, /display:\s*(flex|grid)/, 'no flex/grid — Outlook ignores them');
      assert.doesNotMatch(html, /undefined|\[object Object\]/);
    });
  }

  it('escapes every value and blocks unsafe links', () => {
    const html = renderEmailDesign('spotlight', {
      headline: '<script>alert(1)</script>',
      ctaUrl: 'javascript:alert(2)',
      secondaryUrl: 'data:text/html,x',
      heroImage: 'javascript:alert(3)',
      bgColor: 'red;background:url(x)',
    });
    assert.doesNotMatch(html, /<script>|javascript:|data:text/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(html, /bgcolor="#000000"/, 'invalid colour falls back to the default');
  });

  it('fills unknown or missing values from the template defaults', () => {
    const d = defaultDesignValues('offer');
    assert.equal(d.code, 'THANKYOU30');
    assert.match(renderEmailDesign('offer', { code: 'DIWALI20', notAField: 'x' }), /DIWALI20/);
    assert.equal(renderEmailDesign('nope', {}), '');
  });
});

describe('send helpers', () => {
  it('personalises HTML with escaped values', () => {
    const out = applyHtmlVars('<p>Hi {{name}} from {{business.name}}</p>', { name: '<b>Sam</b>', businessName: 'A & B' });
    assert.equal(out, '<p>Hi &lt;b&gt;Sam&lt;/b&gt; from A &amp; B</p>');
  });

  it('fills the unsubscribe token, or appends a link to custom HTML that has none', () => {
    assert.equal(withUnsubscribeLink(`<a href="${UNSUBSCRIBE_TOKEN}">x</a>`, 'https://u.test/1'), '<a href="https://u.test/1">x</a>');
    assert.match(withUnsubscribeLink('<html><body><p>Hi</p></body></html>', 'https://u.test/1'), /Unsubscribe<\/a><\/p><\/body>/);
    assert.equal(withUnsubscribeLink(`<a href="${UNSUBSCRIBE_TOKEN}">x</a>`, null), '<a href="#">x</a>', 'test sends have no link');
  });

  it('builds a readable plain-text part', () => {
    const text = emailHtmlToText(renderEmailDesign('offer', {}));
    assert.match(text, /30% OFF/);
    assert.match(text, /THANKYOU30/);
    assert.doesNotMatch(text, /<|@media|&nbsp;/);
  });
});

describe('normalizeBroadcastEmailContent', () => {
  it('renders designs on the server and ignores HTML sent by the browser', () => {
    const out = normalizeBroadcastEmailContent({
      subject: 'Hi',
      bodyFormat: 'design',
      bodyDesign: { templateId: 'welcome', values: { headline: 'Hello {{name}}', evil: '<script>' } },
      bodyHtml: '<script>alert(1)</script>',
    });
    assert.equal(out.bodyFormat, 'design');
    assert.deepEqual(Object.keys(out.bodyDesign.values), ['headline']);
    assert.match(out.bodyHtml, /Hello \{\{name\}\}/);
    assert.doesNotMatch(out.bodyHtml, /alert\(1\)/);
    assert.match(out.body, /Hello \{\{name\}\}/, 'plain-text part generated');
  });

  it('sanitises custom HTML and rejects empty or oversized input', () => {
    const out = normalizeBroadcastEmailContent({ bodyFormat: 'html', bodyHtml: '<style>.a{color:red}</style><p class="a" onclick="x()">Hi</p><script>x()</script>' });
    assert.equal(out.bodyHtml, '<style>.a{color:red}</style><p class="a">Hi</p>');
    assert.throws(() => normalizeBroadcastEmailContent({ bodyFormat: 'html', bodyHtml: ' ' }), EmailContentError);
    assert.throws(() => normalizeBroadcastEmailContent({ bodyFormat: 'html', bodyHtml: 'x'.repeat(310 * 1024) }), /300 KB/);
    assert.throws(() => normalizeBroadcastEmailContent({ bodyFormat: 'design', bodyDesign: { templateId: 'nope' } }), EmailContentError);
  });

  it('leaves the existing editor format untouched', () => {
    const out = normalizeBroadcastEmailContent({ body: 'x', bodyHtml: '<p>x</p>' });
    assert.equal(out.bodyFormat, 'rich');
    assert.equal(out.bodyHtml, '<p>x</p>');
  });
});

describe('My templates', () => {
  it('validates saved templates with the same rules as a campaign body', () => {
    const d = normalizeSavedEmailDesign({ name: '  Diwali 2026  ', format: 'design', baseTemplateId: 'diwali-offer', values: { code: 'D26', junk: 1 }, subject: 'Offer' });
    assert.deepEqual(d, { name: 'Diwali 2026', format: 'design', baseTemplateId: 'diwali-offer', values: { code: 'D26' }, html: undefined, subject: 'Offer' });
    const h = normalizeSavedEmailDesign({ name: 'Mine', format: 'html', html: '<p onclick="x()">Hi</p><script>x()</script>' });
    assert.equal(h.html, '<p>Hi</p>');
    assert.throws(() => normalizeSavedEmailDesign({ name: '', format: 'design', baseTemplateId: 'offer' }), EmailContentError);
    assert.throws(() => normalizeSavedEmailDesign({ name: 'x', format: 'pdf' }), EmailContentError);
    assert.throws(() => normalizeSavedEmailDesign({ name: 'x', format: 'design', baseTemplateId: 'nope' }), EmailContentError);
  });

  it('every saved-template query is scoped to the business and the list omits HTML', () => {
    const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
    const list = read('app/api/automation/email-designs/route.js');
    const one = read('app/api/automation/email-designs/[id]/route.js');
    assert.match(list, /find\(\{ businessId: req\.user\.businessId \}\)/);
    assert.match(list, /\.select\('-html'\)/);
    assert.match(list, /MAX_SAVED_DESIGNS = 100/);
    assert.equal((one.match(/_id: id, businessId: req.user.businessId/g) || []).length, 3, 'GET, PUT and DELETE');
  });
});

describe('wiring', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

  it('both broadcast write routes normalise email content', () => {
    for (const p of ['app/api/automation/broadcasts/route.js', 'app/api/automation/broadcasts/[id]/route.js']) {
      assert.match(read(p), /normalizeBroadcastEmailContent\(/, p);
    }
  });

  it('the engine sends designed emails as-is, with escaped personalisation', () => {
    const engine = read('lib/broadcasts/engine.js');
    assert.match(engine, /const html = designed\s*\? withUnsubscribeLink\(bodyHtml, unsubscribeUrl\)/);
    assert.match(engine, /applyHtmlVars\(broadcast\.content\.bodyHtml/);
    assert.match(engine, /Designed emails need a connected mailbox/);
  });
});

describe('link fields', () => {
  it('fixes pasted, doubled and scheme-less links', async () => {
    const { normalizeUrl } = await import('../lib/emailDesigns/index.js');
    assert.equal(normalizeUrl('https://https://www.scaledesktechnology.com/'), 'https://www.scaledesktechnology.com/');
    assert.equal(normalizeUrl('http://https://x.com'), 'https://x.com');
    assert.equal(normalizeUrl('www.site.com/offer?a=1'), 'https://www.site.com/offer?a=1');
    assert.equal(normalizeUrl('https://'), '');
    assert.equal(normalizeUrl('mailto:a@b.com'), 'mailto:a@b.com');
  });

  it('buttons render the fixed link, and empty links fall back safely', () => {
    assert.match(renderEmailDesign('offer', { ctaUrl: 'https://https://shop.example.com/' }), /href="https:\/\/shop\.example\.com\/"/);
    assert.match(renderEmailDesign('offer', { ctaUrl: 'https://' }), /href="#"/);
  });

  it('preview links open in a new tab', () => {
    const studio = readFileSync(new URL('../app/automation/broadcasts/EmailDesignStudio.jsx', import.meta.url), 'utf8');
    assert.match(studio, /sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"/);
    assert.match(studio, /<base target="_blank">/);
  });
});

describe('sender name + sent copy', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

  it('the brand field is labelled as the business name and warns about recipient placeholders', () => {
    const brand = EMAIL_DESIGN_TEMPLATES[0].fields.find((f) => f.key === 'brandName');
    assert.equal(brand.label, 'Your business name');
    assert.equal(brand.default, '{{business.name}}');
    const studio = read('app/automation/broadcasts/EmailDesignStudio.jsx');
    assert.ok(studio.includes(String.raw`field.key === 'brandName' && /\{\{\s*(name|email|phone)\s*\}\}/i.test(value)`));
  });

  it('the preview fills {{business.name}} with the real business name', () => {
    const route = read('app/api/automation/broadcasts/preview-message/route.js');
    assert.ok(route.includes(String.raw`.replace(/\{\{business\.name\}\}/gi, businessName)`));
    assert.match(route, /businessName,\n?\s*to: \{|businessName,\r?\n\s*to: \{/);
  });

  it('the inbox records the broadcast email exactly as sent', () => {
    assert.match(read('lib/broadcasts/engine.js'), /content: \{ body, html, participantId: lead\.email/);
  });
});

describe('weekly report', () => {
  it('colours changes red for a fall, green for a rise', () => {
    const html = renderEmailDesign('weekly-report', { stat1Change: '-3.05%', stat2Change: '+1.12%', stat3Change: '0.40%', stat4Change: '' });
    assert.match(html, /color:#dc2626;[^"]*">-3\.05%/);
    assert.match(html, /color:#16a34a;[^"]*">\+1\.12%/);
    assert.match(html, /color:#16a34a;[^"]*">0\.40%/);
  });

  it('bolds "Label:" lines and keeps one bullet per line', () => {
    const html = renderEmailDesign('weekly-report', { highlights: 'Crude: rose\nplain line', summary: 'one\ntwo\n\nthree' });
    assert.match(html, /<strong style="color:#0f2a20;">Crude:<\/strong> rose/);
    assert.equal((html.match(/&bull;/g) || []).length, 3);
  });

  it('hides empty sections and only shows social icons that have links', () => {
    const empty = renderEmailDesign('weekly-report', { summary: '', highlights: '', nextItems: '', faqLabel: '', disclaimer: '' });
    assert.doesNotMatch(empty, /&bull;|contact-faq\.png|social-/);
    const withX = renderEmailDesign('weekly-report', { xUrl: 'x.com/brand' });
    assert.match(withX, /href="https:\/\/x\.com\/brand"[^>]*><img src="[^"]*social-x\.png"/);
    assert.doesNotMatch(withX, /social-facebook\.png/);
  });
});
