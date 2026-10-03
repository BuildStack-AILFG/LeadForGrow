/**
 * The Contact page shows the registered office in the agreed format and nothing else about the address.
 * Run: node --test tests/contact-address.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

let html;
let block;
before(async () => {
  const { default: React } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: Contact } = await import('../app/contact/page.js?jsx');
  html = renderToStaticMarkup(React.createElement(Contact));
  const a = html.indexOf('<address');
  assert.ok(a > 0, 'an <address> element is rendered');
  block = html.slice(a, html.indexOf('</address>', a) + '</address>'.length);
});

// The address as visible text, one entry per line (<br> and block ends become line breaks).
const lines = () =>
  block
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&ndash;|&#8211;/g, '–')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

describe('Contact page: registered office', () => {
  it('shows the company name, the label and the address lines exactly as agreed', () => {
    assert.deepEqual(lines(), [
      'ScaleDesk Technology Private Limited',
      'Registered Office:',
      'Mill Road, Pardaha,',
      'Mau, Sadar,',
      'Mau – 275101,',
      'Uttar Pradesh, India',
    ]);
  });

  it('does not show the "C/O" care-of line or the person named in it, anywhere on the page', () => {
    assert.ok(!/C\/O|care of|Ramp Pravesh|Pravesh Singh/i.test(html));
  });

  it('replaced the old location line', () => {
    assert.ok(!html.includes('Remote-first team'));
    assert.ok(!html.includes('ScaleDesk Technology, India'));
  });

  it('keeps the rest of the contact card and the form', () => {
    assert.ok(html.includes('Mon–Fri, 9:00 AM – 6:00 PM IST'));
    assert.ok(html.includes('sales@leadforgrow.com') && html.includes('support@leadforgrow.com'));
    assert.ok(html.includes('Send message'));
  });

  it('is a plain (non-italic) address that can wrap on a phone', () => {
    assert.ok(block.includes('not-italic') && block.includes('min-w-0'));
    assert.ok(!/whitespace-nowrap/.test(block), 'nothing forces a single line');
  });
});

describe('scope', () => {
  it('only the contact page carries the address (no other page or data file was given it)', () => {
    for (const f of ['app/about/page.js', 'app/components/marketing/AboutPageContent.jsx', 'lib/founders/data.js', 'lib/marketing/footerLinks.js']) {
      assert.ok(!/Pardaha|275101/.test(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')), f);
    }
  });
});
