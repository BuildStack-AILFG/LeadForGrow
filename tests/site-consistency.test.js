/**
 * Site-wide consistency: one domain (leadforgrow.com), and Terms and Refund Policy that agree with each other.
 * Run: node --test tests/site-consistency.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = (html) => html.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) { if (name !== 'node_modules') walk(p); continue; }
      if (/\.(js|jsx|mjs|json|txt)$/.test(name)) out.push(p);
    }
  };
  for (const d of ['app', 'lib', 'public', 'models', 'scripts']) walk(path.join(ROOT, d));
  return out;
}

describe('one domain: leadforgrow.com', () => {
  const files = sourceFiles();

  it('no source file mentions leadforgrow.online', () => {
    const hits = files.filter((f) => readFileSync(f, 'utf8').includes('leadforgrow.online')).map((f) => path.relative(ROOT, f));
    assert.deepEqual(hits, []);
  });

  it('every canonical URL is on the www host the site really serves', () => {
    const bad = [];
    for (const f of files.filter((x) => /\.(js|jsx)$/.test(x))) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/canonical:\s*['"`](https?:\/\/[^'"`]+)['"`]/g)) {
        if (!m[1].startsWith('https://www.leadforgrow.com')) bad.push(`${path.relative(ROOT, f)} -> ${m[1]}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('the legal pages\' contact mailboxes are on .com', () => {
    for (const [file, mail] of [['app/privacy/page.js', 'privacy@leadforgrow.com'], ['app/terms/page.js', 'legal@leadforgrow.com'], ['app/gdpr/page.js', 'privacy@leadforgrow.com']]) {
      const src = readFileSync(path.join(ROOT, file), 'utf8');
      assert.ok(src.includes(mail), `${file} should use ${mail}`);
    }
    assert.ok(readFileSync(path.join(ROOT, 'lib/googleCalendar.js'), 'utf8').includes("email: 'sales@leadforgrow.com'"));
  });
});

describe('Terms and Refund Policy agree', () => {
  let terms, refund;
  before(async () => {
    const { default: React } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { ThemeProvider } = await import('../app/components/ThemeContext.js');
    const render = async (file) => {
      const { default: Page } = await import(`../${file}?jsx`);
      return renderToStaticMarkup(React.createElement(ThemeProvider, null, React.createElement(Page)));
    };
    terms = await render('app/terms/page.js');
    refund = await render('app/refund-policy/page.js');
  });

  it('Terms no longer say fees are non-refundable "under any circumstances"', () => {
    const t = text(terms);
    assert.ok(!/non-refundable/i.test(t));
    assert.ok(!/under any circumstances/i.test(t));
    assert.ok(!/No-Refund/i.test(t));
    assert.ok(!/no refunds, credits, or chargebacks/i.test(t));
  });

  it('Terms section 6 sends refunds to the Refund Policy page and says it forms part of the Terms', () => {
    assert.ok(text(terms).includes('6. Payments, Cancellation & Refunds'));
    assert.ok(/<a [^>]*href="\/refund-policy"[^>]*>Refund Policy<\/a>/.test(terms), 'a link to /refund-policy');
    assert.ok(text(terms).includes('Refunds, where available, are governed by our Refund Policy'));
    assert.ok(text(terms).includes('which forms part of these Terms'));
  });

  it('cancellation reads the same in both documents (access continues to the end of the billing period)', () => {
    assert.ok(text(terms).includes('access continues until the end of the current billing period'));
    assert.ok(text(refund).includes('Access continues until the end of the billing period'));
  });

  it('the Refund Policy page keeps its own refund terms untouched', () => {
    const r = text(refund);
    assert.ok(r.includes('within 7 days of charge') && r.includes('within 30 days'));
  });
});
