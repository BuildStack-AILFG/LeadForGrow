/**
 * "About Our Company" on the About page: the exact legal name and body text, the four confirmed details,
 * and none of the claims we must not make (Meta approval, invented registration data, a separate legal entity).
 * Run: node --test tests/about-company.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let section;
before(async () => {
  const { default: React } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: About } = await import('../app/components/marketing/AboutPageContent.jsx');
  const html = renderToStaticMarkup(React.createElement(About));
  const start = html.indexOf('aria-labelledby="about-company-heading"');
  assert.ok(start > 0, 'the section is rendered');
  const from = html.lastIndexOf('<section', start);
  section = html.slice(from, html.indexOf('</section>', start) + '</section>'.length);
});

const text = () => section.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ');

describe('About Our Company', () => {
  it('has the heading, labelled for assistive tech', () => {
    assert.match(section, /<h2 id="about-company-heading"[^>]*>About Our Company<\/h2>/);
  });

  it('uses the exact approved body text', () => {
    assert.ok(text().includes(
      'LeadForGrow is a SaaS platform developed and operated by ScaleDesk Technology Private Limited. ' +
      'LeadForGrow helps businesses manage leads, customer conversations, sales pipelines, follow-ups, and ' +
      'business automation through an integrated platform.'
    ));
  });

  it('lists the four confirmed details as a description list', () => {
    assert.ok(section.includes('<dl'));
    const t = text();
    for (const [term, value] of [
      ['Legal Company Name', 'ScaleDesk Technology Private Limited'],
      ['Product Brand', 'LeadForGrow'],
      ['Official Website', 'https://www.leadforgrow.com'],
      ['Country of Operation', 'India'],
    ]) {
      assert.ok(t.includes(`${term} ${value}`), `${term}: ${value}`);
    }
    assert.equal((section.match(/<dt/g) || []).length, 4);
    assert.equal((section.match(/<dd/g) || []).length, 4);
  });

  it('links the official website to the exact address', () => {
    assert.match(section, /<a href="https:\/\/www\.leadforgrow\.com"[^>]*>https:\/\/www\.leadforgrow\.com<\/a>/);
  });

  it('makes no claim we cannot support', () => {
    const t = text().toLowerCase();
    for (const banned of [
      'meta', 'approved', 'verified', 'certified', 'award', 'iso ', 'soc 2', 'gdpr', 'cin', 'gstin',
      'registered office', 'address', 'trusted by', 'separate', 'subsidiary', 'independent',
    ]) {
      assert.ok(!t.includes(banned), `must not mention "${banned}"`);
    }
    assert.ok(!/\d{2,}/.test(text()), 'no numbers or statistics in the section');
  });

  it('does not use the abbreviated name inside the section', () => {
    assert.ok(!/Pvt\.? ?Ltd/i.test(section));
  });
});

describe('scope', () => {
  it('sits between Mission/Vision and Values, once', () => {
    const src = read('app/components/marketing/AboutPageContent.jsx');
    assert.equal((src.match(/about-company-heading"/g) || []).length, 2, 'aria-labelledby + the heading id, nowhere else');
    const mission = src.indexOf('Mission & Vision');
    const company = src.indexOf('About Our Company —');
    const values = src.indexOf('Values — horizontal scroll');
    assert.ok(mission > 0 && mission < company && company < values);
  });

  it('reuses the site tokens and adds no dependency', () => {
    const src = read('app/components/marketing/AboutPageContent.jsx');
    assert.ok(src.includes('MARKETING.sectionTight') && src.includes('MARKETING.h2') && src.includes('MARKETING.card'));
    const pkg = JSON.parse(read('package.json'));
    assert.ok(pkg.dependencies && pkg.dependencies['lucide-react'], 'the icon library is already a dependency');
  });
});
