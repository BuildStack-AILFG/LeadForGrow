/**
 * Marketing claims and feature accuracy on the public site. The platform's own database holds a handful of businesses,
 * so counts like "1,100+ businesses" or "1M+ leads" cannot be shown; testimonials must not be invented; structured data
 * must name the real operating company. The integrations band is an owner decision (all 17 shown; some built to order).
 * Run: node --test tests/claims-accuracy.test.js
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
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');

// Public marketing source: everything under app/ except the signed-in product, APIs, editors and template demo content.
const INTERNAL = /^app\/(automation|agency|lfgadmin|api|editor|s)\//;
// Also excluded: two landing sections that are not rendered anywhere (checked by a test below).
const DEAD = ['app/components/landing/LandingImpactSection.jsx', 'app/components/landing/ImpactNumbersSection.jsx'];
const EXCLUDED = /(-Life\.|^app\/website-funnel\/editor|^app\/components\/(templates|website)\/)/;
function publicFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      const r = rel(p);
      if (/\.(js|jsx)$/.test(name) && !INTERNAL.test(r) && !EXCLUDED.test(r) && !DEAD.includes(r)) out.push(r);
    }
  };
  walk(path.join(ROOT, 'app'));
  walk(path.join(ROOT, 'lib/marketing'));
  return out;
}
const files = publicFiles();
const scan = (re) => files.filter((f) => re.test(read(f))).map((f) => `${f}: ${(read(f).match(re) || [])[0]}`);

describe('numbers the platform data cannot support are gone', () => {
  it('no "1,100+ / 500+ / 2,500+ businesses, agencies, teams, pros" counts', () => {
    assert.deepEqual(scan(/\b(1,?100|2,?500|500)\+\s*(businesses|agencies|teams|pros|successful|companies)/i), []);
    assert.deepEqual(scan(/Join (the )?[\d,]+\+/i), []);
  });
  it('no "1M+ leads managed"', () => assert.deepEqual(scan(/\b1M\+/), []));
  it('the two skipped landing sections (which still hold old figures) really are not rendered anywhere', () => {
    const all = [];
    const walk = (d) => { for (const n of readdirSync(d)) { const p = path.join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|jsx)$/.test(n)) all.push(p); } };
    walk(path.join(ROOT, 'app'));
    for (const dead of DEAD) {
      const base = path.basename(dead, '.jsx');
      const users = all.filter((p) => rel(p) !== dead && new RegExp(`import[^;]*['"/]${base}['"]`).test(readFileSync(p, 'utf8')));
      assert.deepEqual(users.map(rel), [], `${base} must stay unused, or its figures must be fixed`);
    }
  });
  it('no SSO / SAML promises (there is no SSO implementation)', () => assert.deepEqual(scan(/\bSAML\b|\bSSO\b/), []));
  it('no 99.9% uptime / SLA figure and no "millions of interactions daily"', () => {
    assert.deepEqual(scan(/99\.9\s?%/), []);
    assert.deepEqual(scan(/millions of interactions/i), []);
  });
  it('no 24/7 human-support promises (contact hours are Mon-Fri)', () => {
    assert.deepEqual(scan(/24\/7[^\n.]{0,25}(support|live agent|live chat)/i), []);
  });
  it('the homepage contact block shows the same support hours as the Contact page', () => {
    assert.ok(read('app/user/home/C.jsx').includes('Mon–Fri, 9:00 AM – 6:00 PM IST'));
    assert.ok(read('app/contact/page.js').includes('Mon–Fri, 9:00 AM – 6:00 PM IST'));
  });
});

describe('security and compliance wording', () => {
  it('Security page: no "GDPR-ready", "enterprise-grade", TLS version, backup or 2FA promises, no phantom download', () => {
    const t = read('app/security/page.js');
    for (const banned of ['GDPR-ready', 'enterprise-grade', 'TLS 1.2', 'disaster recovery', '2FA architecture', 'Download our security overview']) {
      assert.ok(!t.includes(banned), banned);
    }
    assert.ok(t.includes('We aim to respond within 72 hours'));
  });
  it('no "End-to-end encryption" claim anywhere public', () => assert.deepEqual(scan(/End-to-end encrypt/i), []));
  it('the sign-up and journey copy no longer says "Enterprise-grade security"', () => {
    assert.ok(!read('app/components/auth/AuthLayout.jsx').includes('Enterprise-grade security'));
    assert.ok(!read('app/components/landing/JourneyTabsSection.jsx').includes('Enterprise-grade security'));
  });
  it('the Compliance page does not say "readiness"', () => assert.ok(!read('app/compliance/page.js').includes('readiness')));
});

describe('AI wording', () => {
  it('replies are "grounded in" the knowledge base, not "trained on" it (retrieval, not model training)', async () => {
    const t = read('app/components/marketing/AboutPageContent.jsx');
    assert.ok(!t.includes('trained on your business knowledge'));
    assert.ok(t.includes('grounded in your business knowledge base'));
  });
});

describe('integrations (owner decision: show all 17; some are connected per client requirement)', () => {
  const BUILT_TO_ORDER = ['Calendly', 'Google Sheets', 'HubSpot', 'Salesforce', 'Shopify', 'Slack', 'Zapier', 'Zoho'];

  it('the list and the "17+" count are the approved ones', async () => {
    const { INTEGRATIONS, INTEGRATIONS_COUNT } = await import('../app/components/pricing/pricingData.js');
    assert.equal(INTEGRATIONS.length, 17);
    assert.equal(INTEGRATIONS_COUNT, '17+');
    assert.deepEqual(INTEGRATIONS.slice(0, 5).map((i) => i.name), ['WhatsApp', 'Instagram', 'Gmail', 'Meta Lead Ads', 'Google Calendar']);
  });

  it('the eight built-to-order tools are marked in the data (metadata only), the other nine are not', async () => {
    const { INTEGRATIONS } = await import('../app/components/pricing/pricingData.js');
    assert.deepEqual(INTEGRATIONS.filter((i) => i.onRequest).map((i) => i.name).sort(), BUILT_TO_ORDER);
    assert.deepEqual(
      INTEGRATIONS.filter((i) => !i.onRequest).map((i) => i.name).sort(),
      ['Gmail', 'Google Calendar', 'Instagram', 'Meta Lead Ads', 'Razorpay', 'Stripe', 'Twilio', 'WhatsApp', 'Webhooks'].sort()
    );
  });

  it('the homepage / pricing band shows all 17 logos under "17+ Plug & Play Integrations", as before', async () => {
    const { default: React } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { INTEGRATIONS } = await import('../app/components/pricing/pricingData.js');
    const { default: Teaser } = await import('../app/components/pricing/IntegrationsTeaser.jsx');
    const t = text(renderToStaticMarkup(React.createElement(Teaser)));
    assert.match(t, /17\+ Plug & Play Integrations/);
    for (const { name } of INTEGRATIONS) assert.ok(t.includes(name), name);
    assert.ok(!/on request/i.test(t), 'the marker is not rendered');
  });

  it('the hero comment no longer claims every logo is a ready-made integration', () => {
    const src = read('app/components/landing/PremiumHero.jsx');
    assert.ok(!src.includes('already-supported LeadForGrow integrations'));
    assert.ok(src.includes('connected per client requirement'));
  });

  it('the help FAQ no longer promises native two-way CRM sync (it says such connections are built on request)', () => {
    const src = read('app/resources/help/page.js');
    assert.ok(!src.includes('native integrations with popular CRMs'));
    assert.ok(!/bidirectional/i.test(src));
    assert.ok(src.includes('can be built on request') && src.includes('not part of the standard product'));
  });
});

describe('rendered sections', () => {
  let React, render;
  before(async () => {
    ({ default: React } = await import('react'));
    const { renderToStaticMarkup } = await import('react-dom/server');
    render = async (file) => {
      const { default: C } = await import(`../${file}${file.endsWith('.js') ? '?jsx' : ''}`);
      return renderToStaticMarkup(React.createElement(C));
    };
  });

  it('homepage stats: no percentages or competitor benchmark footnote; product facts only', async () => {
    const html = await render('app/components/landing/StatsSection.jsx');
    const t = text(html);
    assert.ok(!/\d+%/.test(t));
    assert.ok(!/benchmark|typical results|reported by businesses/i.test(t));
    for (const fact of ['Instant', 'One inbox', 'Every lead', 'Follow-ups']) assert.ok(t.includes(fact), fact);
  });

  it('use cases are labelled illustrative: no photos, no quotation marks, no attributed people', async () => {
    const html = await render('app/components/landing/SuccessStoriesSection.jsx');
    const t = text(html);
    assert.ok(!html.includes('<img'), 'no stock-photo faces');
    assert.ok(!/[“”]/.test(t) && !html.includes('&ldquo;'));
    assert.ok(t.includes('These are not customer testimonials'));
    assert.equal((t.match(/Use case:/g) || []).length, 4);
    assert.ok(!/Owner,|Marketing Lead,|Manager,|Broker,/.test(t));
  });

  it('About: no invented counts, keeps the company section', async () => {
    const t = text(await render('app/about/page.js'));
    assert.ok(!/1,100|1M\+|99\.9|uptime target|End-to-end/.test(t));
    assert.ok(t.includes('About Our Company') && t.includes('Built in India'));
  });
});

describe('structured data', () => {
  it('no invented sub-brands or unsourced ratings in JSON-LD', () => {
    assert.deepEqual(scan(/"@type":\s*"LocalBusiness"/), []);
    assert.deepEqual(scan(/aggregateRating|AggregateRating/), []);
    assert.deepEqual(scan(/LeadForGrow (Growth Partners|Automation Lab|Services|Tech Ops|SEO Lab|Creative Lab)/), []);
  });
  it('service pages name the real operating company as the provider', () => {
    for (const s of ['automation-setup', 'dfy-website', 'lead-setup', 'managed-growth', 'seo-setup', 'social-setup']) {
      const src = read(`app/services/${s}/page.js`);
      assert.ok(src.includes('"@type": "Organization"') && src.includes('"name": "ScaleDesk Technology Private Limited"'), s);
    }
  });
});

describe('legal wording and email consistency', () => {
  it('Terms: no old product name or old business description', () => {
    const t = read('app/terms/page.js');
    assert.ok(!t.includes('FollowUpSure'));
    assert.ok(!t.includes('follow-up and execution intelligence'));
    assert.ok(t.includes('a CRM and business automation platform'));
  });

  it('the legal pages use a single, consistent set of mailboxes (all .com, one privacy@ and one legal@)', () => {
    const emails = (f) => [...new Set((read(f).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g) || []))].sort();
    const priv = emails('app/privacy/page.js'), gdpr = emails('app/gdpr/page.js'), terms = emails('app/terms/page.js'), dpa = emails('app/dpa/page.js');
    assert.deepEqual(priv, ['privacy@leadforgrow.com']);
    assert.deepEqual(gdpr, ['privacy@leadforgrow.com']);
    assert.deepEqual(terms, ['legal@leadforgrow.com']);
    assert.ok(dpa.includes('legal@leadforgrow.com') && dpa.every((e) => e.endsWith('@leadforgrow.com')));
  });

  it('the homepage logo strip uses the company\'s brand spelling, not the old "Scaledesk technology"', () => {
    const src = read('app/components/landing/TrustedCompanies.jsx');
    assert.ok(!/Scaledesk/.test(src) && src.includes("'ScaleDesk'"));
  });

  it('the Terms "Last Updated" date reflects this change', () => assert.ok(read('app/terms/page.js').includes('Last Updated: September 22, 2026')));
});
