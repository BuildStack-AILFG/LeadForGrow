/**
 * Page-load and request-volume fixes.
 *
 * - CRM boot: the workspace mounts as soon as access is confirmed (its data
 *   requests start immediately) and the loader finishes in ~250 ms, not ~3.5 s.
 * - Reminders ask the server only for tasks due soon, capped, instead of
 *   downloading every pending task every 30 s.
 * - Tasks linked to a contact, deal or company are never auto-cancelled.
 * - "Who am I" requests fired together on page load share one request.
 * - Heavy images are served as small WebP files.
 *
 * Run: node --test tests/load-performance.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const sizeKb = (p) => statSync(new URL(`../${p}`, import.meta.url)).size / 1024;

describe('CRM boot', () => {
  const gate = read('app/automation/components/AccessControl.js');
  const loader = read('app/automation/components/WorkspaceBootLoader.jsx');

  it('mounts the workspace under the loader instead of after it', () => {
    assert.match(gate, /<div className="h-screen w-full">\{children\}<\/div>\s*\{!bootDone && bootLoader\}/);
    assert.match(gate, /if \(checking \|\| \(frozen && !bootDone\)\) return/);
  });

  it('finishes the progress bar quickly once access is confirmed', () => {
    assert.match(loader, /const speed = complete \? 5 : 0\.04;/);
  });
});

describe('tasks API', () => {
  const route = read('app/api/automation/tasks/route.js');

  it('supports a capped "due within N minutes" query for reminders', () => {
    assert.match(route, /searchParams\.get\('dueWithin'\)/);
    assert.match(route, /\$lte: new Date\(now\.getTime\(\) \+ Math\.min\(dueWithin, 1440\) \* 60000\)/);
    assert.match(route, /tasksQuery\.limit\(100\)/);
    assert.match(read('app/automation/components/ReminderMonitor.js'), /\/api\/automation\/tasks\?dueWithin=5/);
  });

  it('only auto-cancels tasks with nothing linked', () => {
    assert.match(route, /const isOrphan = \(t\) => t\.leadId == null && !t\.contactId && !t\.dealId && !t\.companyId;/);
    assert.doesNotMatch(route, /tasks\.filter\(\(t\) => t\.leadId == null\)/);
  });
});

describe('shared "who am I" request', () => {
  const client = read('lib/apiClient.js');

  it('shares /api/auth/me between callers and drops it after any write', () => {
    assert.match(client, /const SHARED_GET_URLS = new Set\(\['\/api\/auth\/me'\]\);/);
    assert.match(client, /return \(await hit\.promise\)\.clone\(\);/);
    assert.match(client, /if \(method !== 'GET'\) sharedGets\.clear\(\);/);
    assert.match(client, /export function clearAuthSession\(\) \{\s*if \(typeof window === 'undefined'\) return;\s*sharedGets\.clear\(\);/);
  });
});

describe('images', () => {
  it('ships small WebP versions of the heavy images', () => {
    assert.ok(sizeKb('public/logo-mark.webp') < 10, 'logo mark');
    for (const p of ['public/portal-integrations.webp', 'public/calling-list.webp', 'public/whatsapp-automation.webp',
      'public/images/hero/builder.webp', 'public/images/hero/crm.webp', 'public/images/hero/forms.webp']) {
      assert.ok(sizeKb(p) < 150, p);
    }
    assert.ok(sizeKb('public/images/interakt-clone/chatbot-builder.webp') < 600, 'animated chatbot demo');
  });

  it('no UI component loads the 172 KB logo PNG any more', () => {
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(new URL(`../${dir}`, import.meta.url), { withFileTypes: true })) {
        const p = `${dir}/${e.name}`;
        if (e.isDirectory()) { if (e.name !== 'api') walk(p); } else if (/\.(jsx?|tsx?)$/.test(e.name)) files.push(p);
      }
    };
    walk('app');
    const offenders = files.filter((f) => /["']\/image\.png["']/.test(read(f)));
    assert.deepEqual(offenders, []);
  });
});

describe('fonts', () => {
  const layout = read('app/layout.js');
  const css = read('app/globals.css');

  it('self-hosts fonts with next/font instead of a render-blocking Google stylesheet', () => {
    assert.match(layout, /from "next\/font\/google"/);
    assert.doesNotMatch(layout, /fonts\.googleapis\.com/);
    assert.match(layout, /<html lang="en" className=\{fontVariables\}/);
  });

  it('routes every CSS font token through the self-hosted fonts', () => {
    assert.match(css, /--font-sans: var\(--nf-inter\), system-ui, sans-serif;/);
    for (const v of ['--nf-inter-tight', '--nf-plus-jakarta', '--nf-barlow', '--nf-libre-baskerville']) {
      assert.ok(css.includes(`var(${v})`), v);
      assert.ok(layout.includes(`variable: "${v}"`), `${v} defined in layout`);
    }
    assert.doesNotMatch(css, /font-family: 'Inter'|'Inter Tight'|'Plus Jakarta Sans'|'Barlow'|'Libre Baskerville'/);
  });
});

describe('homepage', () => {
  it('renders on the server; only interactive sections are client components', () => {
    const page = read('app/user/home/page.js');
    assert.doesNotMatch(page, /^'use client'/);
    assert.doesNotMatch(page, /onGetStarted=|onBookDemo=/, 'no functions passed from a server component');
    for (const n of ['TrustedCompanies', 'ProductHubsSection', 'CapabilitiesGridSection', 'StatsSection', 'IndustriesGridSection', 'SuccessStoriesSection']) {
      assert.doesNotMatch(read(`app/components/landing/${n}.jsx`), /^'use client'/, n);
    }
    for (const n of ['PremiumHero', 'AICapabilitiesSection', 'LandingCTA']) {
      const src = read(`app/components/landing/${n}.jsx`);
      assert.match(src, /^'use client'/, n);
      assert.match(src, /onGetStarted = goToGetStarted, onBookDemo = openBookDemo/, `${n} has its own CTA handlers`);
    }
  });
});
