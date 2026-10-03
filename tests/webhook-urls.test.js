/**
 * Meta webhook URL helper + the copyable URL field shown on the channel settings pages.
 * Run: node --test tests/webhook-urls.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
register(new URL('../scripts/test-jsx-hooks.mjs', import.meta.url));

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

let U, React, renderToStaticMarkup, WebhookUrlField;
before(async () => {
  U = await import('../lib/meta/webhookUrls.js');
  ({ default: React } = await import('react'));
  ({ renderToStaticMarkup } = await import('react-dom/server'));
  ({ default: WebhookUrlField } = await import('../app/automation/components/settings/WebhookUrlField.jsx'));
});

const ID = '696956dde910b99089019e29';
const html = (props) => renderToStaticMarkup(React.createElement(WebhookUrlField, props));

describe('webhook url helpers', () => {
  it('the per-business path carries the business id', () => {
    assert.equal(U.businessWebhookPath(ID), `/api/webhooks/meta/${ID}`);
    assert.equal(U.businessWebhookPath('  '), '');
    assert.equal(U.businessWebhookPath(undefined), '');
  });

  it('joins origin and path without a doubled slash', () => {
    assert.equal(U.joinWebhookUrl('https://www.leadforgrow.com', '/api/webhooks/meta'), 'https://www.leadforgrow.com/api/webhooks/meta');
    assert.equal(U.joinWebhookUrl('https://www.leadforgrow.com/', '/api/webhooks/meta'), 'https://www.leadforgrow.com/api/webhooks/meta');
    assert.equal(U.joinWebhookUrl('', '/x'), '');
    assert.equal(U.joinWebhookUrl('https://a.com', ''), '');
  });

  it('only a public https host counts as reachable for Meta', () => {
    assert.equal(U.isPublicHttpsOrigin('https://www.leadforgrow.com'), true);
    assert.equal(U.isPublicHttpsOrigin('https://abc123.ngrok-free.app'), true);
    assert.equal(U.isPublicHttpsOrigin('http://www.leadforgrow.com'), false);
    assert.equal(U.isPublicHttpsOrigin('http://localhost:3000'), false);
    assert.equal(U.isPublicHttpsOrigin('https://localhost:3000'), false);
    assert.equal(U.isPublicHttpsOrigin('https://192.168.1.4'), false);
    assert.equal(U.isPublicHttpsOrigin('not a url'), false);
  });
});

describe('WebhookUrlField', () => {
  it('shows the full copyable URL with a Copy button on the live host', () => {
    const out = html({ path: U.businessWebhookPath(ID), origin: 'https://www.leadforgrow.com' });
    assert.ok(out.includes(`value="https://www.leadforgrow.com/api/webhooks/meta/${ID}"`));
    assert.ok(out.includes('readOnly') || out.includes('readonly'));
    assert.ok(out.includes('>Copy<'));
    assert.ok(!out.includes('cannot reach it'), 'no warning on a public https address');
  });

  it('warns on localhost that Meta cannot reach it', () => {
    const out = html({ path: '/api/webhooks/meta', origin: 'http://localhost:3000' });
    assert.ok(out.includes('cannot reach it'));
  });

  it('is dark-mode safe: every light surface has a dark counterpart', () => {
    const out = html({ path: '/api/webhooks/meta', origin: 'https://www.leadforgrow.com' });
    assert.ok(out.includes('bg-slate-50 dark:bg-slate-800'));
    assert.ok(out.includes('border-slate-200 dark:border-slate-700'));
    assert.ok(out.includes('bg-white dark:bg-slate-900'));
  });

  it('renders extra hint text passed as children', () => {
    const out = html({ path: '/x', origin: 'https://a.com', children: React.createElement('p', null, 'Verify token: saved') });
    assert.ok(out.includes('Verify token: saved'));
  });
});

describe('pages wire the field up', () => {
  it('the status route returns the business id (no secrets)', () => {
    const src = read('app/api/business/settings/whatsapp-status/route.js');
    assert.ok(/businessId:\s*String\(business\._id\)/.test(src));
  });

  it('the WhatsApp page shows the per-business URL and explains the verify token', () => {
    const src = read('app/automation/settings/whatsapp/page.js');
    assert.ok(src.includes('WebhookUrlField'));
    assert.ok(src.includes('businessWebhookPath(status.businessId)'));
    assert.ok(src.includes('hasVerifyToken'));
  });

  it('the Instagram and Facebook pages show the full shared URL, not a bare path', () => {
    for (const p of ['app/automation/settings/instagram/page.js', 'app/automation/settings/facebook/page.js']) {
      const src = read(p);
      assert.ok(src.includes('<WebhookUrlField path={SHARED_WEBHOOK_PATH}'), p);
      assert.ok(!/<code[^>]*>\/api\/webhooks\/meta<\/code>/.test(src), `${p} still shows a bare relative path`);
    }
  });

  it('never prints the shared verify token itself', () => {
    for (const p of ['app/automation/settings/instagram/page.js', 'app/automation/settings/facebook/page.js', 'app/automation/components/settings/WebhookUrlField.jsx']) {
      assert.ok(!/process\.env\.META_VERIFY_TOKEN/.test(read(p)), p);
    }
  });
});
