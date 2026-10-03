/**
 * The company founders' profiles are gone from the site: no data, no page, no About-page section, no blog byline,
 * and the old URLs redirect instead of 404-ing.
 * Run: node --test tests/founders-removed.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const exists = (p) => existsSync(new URL(`../${p}`, import.meta.url));
const NAMES = /S\.Singh|Honey Singh|S\.S Chauhan|Co-?Founder|linkedin\.com\/in\/saurabh/i;

describe('founder data', () => {
  it('lib/founders/data.js exports only the company', async () => {
    const mod = await import('../lib/founders/data.js');
    assert.deepEqual(Object.keys(mod), ['COMPANY']);
    assert.ok(!NAMES.test(read('lib/founders/data.js')));
  });

  it('the founders page and its components are deleted', () => {
    for (const p of [
      'app/founders/page.js',
      'app/components/landing/FoundersPage.jsx',
      'app/components/landing/FounderCard.jsx',
      'app/components/landing/AboutUsPage.jsx',
    ]) assert.ok(!exists(p), `${p} should be gone`);
  });
});

describe('About page', () => {
  let html;
  before(async () => {
    const { default: React } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { default: About } = await import('../app/components/marketing/AboutPageContent.jsx');
    html = renderToStaticMarkup(React.createElement(About));
  });

  it('has no founder names, roles or Leadership section', () => {
    assert.ok(!NAMES.test(html));
    assert.ok(!html.includes('Meet the team behind LeadForGrow'));
    assert.ok(!html.includes('href="/founders"'));
  });

  it('still has the company section and its neighbours', () => {
    assert.ok(html.includes('About Our Company'));
    assert.ok(html.includes('Technology stack'));
    assert.ok(html.includes('Values that guide every decision'));
  });
});

describe('blog and redirects', () => {
  it('no article is credited to a founder; the team author remains', async () => {
    const { BLOG_AUTHORS, getAuthor } = await import('../app/blog/featureData.js');
    assert.deepEqual(Object.keys(BLOG_AUTHORS), ['leadforgrow-team']);
    assert.equal(getAuthor('saurabh-singh').slug, 'leadforgrow-team');
    for (const f of ['app/blog/featureData.js', ...['whatsapp-automation', 'instagram-automation', 'crm', 'business-automation', 'ai-agents'].map((n) => `lib/blog/posts/${n}.js`)]) {
      assert.ok(!read(f).includes("'saurabh-singh'"), `${f} still credits the founder`);
    }
  });

  it('the old URLs redirect permanently', () => {
    const cfg = read('next.config.mjs');
    assert.ok(cfg.includes("source: '/founders', destination: '/about', permanent: true"));
    assert.ok(cfg.includes("source: '/blog/author/saurabh-singh', destination: '/blog/author/leadforgrow-team', permanent: true"));
  });

  it('the discover section no longer has an "Our founders" card', () => {
    const src = read('app/components/landing/DiscoverPlatformSection.jsx');
    assert.ok(!src.includes('Our founders') && !src.includes("'/founders'"));
  });
});
