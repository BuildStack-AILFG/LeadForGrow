/**
 * Company identity across the public site:
 *  - ScaleDesk Technology Private Limited is the legal entity, LeadForGrow is its product (never a separate entity).
 *  - PUBLIC pages (Contact, About, footer) never show the "C/O" line; LEGAL pages show the complete registered office.
 *  - The address lives in one place (lib/company.js).
 * Run: node --test tests/company-identity.test.js
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
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const text = (html) => html.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ');

const LEGAL_NAME = 'ScaleDesk Technology Private Limited';
const FULL = ['C/O Ramp Pravesh Singh,', 'Mill Road, Pardaha,', 'Mau, Sadar,', 'Mau – 275101,', 'Uttar Pradesh, India'];
const CARE_OF = /C\/O|Ramp Pravesh/i;

let React, render;
before(async () => {
  ({ default: React } = await import('react'));
  const { renderToStaticMarkup } = await import('react-dom/server');
  render = async (file) => {
    const { default: Page } = await import(`../${file}?jsx`);
    const { ThemeProvider } = await import('../app/components/ThemeContext.js');
    // The app's root layout supplies the theme context that MarketingLayout (Privacy / Terms) reads.
    return renderToStaticMarkup(React.createElement(ThemeProvider, null, React.createElement(Page)));
  };
});

describe('constants', () => {
  it('holds the exact legal name and the two address forms', async () => {
    const c = await import('../lib/company.js');
    assert.equal(c.LEGAL_NAME, LEGAL_NAME);
    assert.equal(c.PRODUCT_NAME, 'LeadForGrow');
    assert.equal(c.PRODUCT_STATEMENT, `LeadForGrow is a product operated by ${LEGAL_NAME}.`);
    assert.deepEqual(c.FULL_ADDRESS_LINES, FULL);
    assert.deepEqual(c.PUBLIC_ADDRESS_LINES, FULL.slice(1));
    assert.ok(!c.PUBLIC_ADDRESS_LINES.some((l) => CARE_OF.test(l)));
  });

  it('is the only source file that contains the address', () => {
    const hits = { care: [], street: [] };
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const p = path.join(dir, name);
        if (statSync(p).isDirectory()) { if (name !== 'node_modules') walk(p); continue; }
        if (!/\.(js|jsx|mjs)$/.test(name) || /-Life\./.test(name)) continue;
        const src = readFileSync(p, 'utf8');
        const rel = path.relative(ROOT, p).replace(/\\/g, '/');
        if (src.includes('Ramp Pravesh')) hits.care.push(rel);
        if (src.includes('Pardaha')) hits.street.push(rel);
      }
    };
    walk(path.join(ROOT, 'app')); walk(path.join(ROOT, 'lib'));
    assert.deepEqual(hits.care, ['lib/company.js']);
    assert.deepEqual(hits.street, ['lib/company.js']);
  });
});

describe('public pages: shortened address, no C/O', () => {
  it('Contact shows the shortened address and no placeholder phone or map', async () => {
    const html = await render('app/contact/page.js');
    assert.ok(text(html).includes(LEGAL_NAME));
    for (const line of FULL.slice(1)) assert.ok(text(html).includes(line), line);
    assert.ok(!CARE_OF.test(html));
    assert.ok(!html.includes('Remote-first') && !html.includes('available on request') && !html.includes('Map placeholder'));
  });

  it('About shows no C/O line and uses the exact legal name (hero and company section)', async () => {
    const html = await render('app/about/page.js');
    assert.ok(!CARE_OF.test(html));
    assert.ok(text(html).includes(`from ${LEGAL_NAME}`) || text(html).includes(LEGAL_NAME));
    assert.ok(!/Pvt\.? ?Ltd/i.test(html), 'no abbreviated company name left on the page');
  });

  it('the footer names the legal owner of the product and shows no C/O line', async () => {
    const src = read('app/components/marketing/EnterpriseFooter.jsx');
    assert.ok(src.includes('a product of ScaleDesk Technology Private Limited'));
    assert.ok(!src.includes('© {year} LeadForGrow. All rights reserved.'));
    assert.ok(!CARE_OF.test(src));
  });
});

describe('legal pages: company identity + complete registered office', () => {
  const pages = [
    ['Privacy Policy', 'app/privacy/page.js'],
    ['Terms of Service', 'app/terms/page.js'],
    ['GDPR', 'app/gdpr/page.js'],
    ['DPA', 'app/dpa/page.js'],
    ['Cookie Policy', 'app/cookie-policy/page.js'],
    ['Refund Policy', 'app/refund-policy/page.js'],
    ['License', 'app/license/page.js'],
  ];
  for (const [name, file] of pages) {
    it(`${name}: exact legal name, product statement and the full address (C/O first)`, async () => {
      const t = text(await render(file));
      assert.ok(t.includes(LEGAL_NAME));
      assert.ok(t.includes('LeadForGrow is a product operated by ScaleDesk Technology Private Limited.'));
      assert.ok(t.includes('Registered Office:'));
      const flat = t.replace(/\s+/g, ' ');
      assert.ok(flat.includes(FULL.join(' ')), 'complete address, in order, including the C/O line');
    });
  }

  it('Terms say LeadForGrow is not a separate legal entity', async () => {
    assert.ok(text(await render('app/terms/page.js')).includes('is not a separate legal entity'));
  });

  it('Privacy names the controller / processor roles the GDPR page already states', async () => {
    const t = text(await render('app/privacy/page.js'));
    assert.ok(t.includes('data controller') && t.includes('data processor'));
  });

  it('GDPR no longer claims compliance in its title or description, and carries the careful wording', async () => {
    const src = read('app/gdpr/page.js');
    assert.ok(!/title="GDPR Compliance"/.test(src) && !src.includes('complies with GDPR'));
    const t = text(await render('app/gdpr/page.js'));
    assert.ok(t.includes('GDPR & Data Protection'));
    assert.ok(t.includes('in accordance with applicable data protection laws'));
    assert.ok(!/GDPR[- ](compliant|certified)/i.test(t));
  });

  it('the address block appears once per page (GDPR shows it in the controller section, not twice)', async () => {
    for (const [, file] of pages) {
      const html = await render(file);
      assert.equal((html.match(/Registered Office:/g) || []).length, 1, file);
    }
  });
});

describe('SEO and structured data', () => {
  it('About metadata uses the legal name, no old spelling, and a canonical on the www host', () => {
    const src = read('app/about/page.js');
    assert.ok(src.includes('ScaleDesk Technology Private Limited'));
    assert.ok(!/Scaledesk Technology/.test(src));
    assert.ok(src.includes("canonical: 'https://www.leadforgrow.com/about'"));
  });

  it('Organization schema names LeadForGrow and its operating company', () => {
    const src = read('app/page.js');
    assert.ok(src.includes("name: 'LeadForGrow'") && src.includes('parentOrganization') && src.includes('legalName: LEGAL_NAME'));
  });

  it('the sitemap lists the contact and legal pages, on the www host', async () => {
    const { default: sitemap } = await import('../app/sitemap.js');
    const urls = sitemap().map((e) => e.url);
    for (const p of ['/contact', '/privacy', '/terms', '/gdpr', '/cookie-policy', '/refund-policy', '/dpa', '/security', '/compliance']) {
      assert.ok(urls.includes(`https://www.leadforgrow.com${p}`), p);
    }
  });
});
