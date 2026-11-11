import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { subscriptionState, subscribeParams, ensureWabaSubscription } from '../lib/whatsapp/webhookSubscription.js';

const URL_HERE = 'https://www.leadforgrow.com/api/webhooks/meta/abc';

test('subscriptionState: none, elsewhere, here', () => {
  assert.equal(subscriptionState([], URL_HERE), 'not_subscribed');
  assert.equal(subscriptionState(undefined, URL_HERE), 'not_subscribed');
  assert.equal(subscriptionState([{ whatsapp_business_api_data: { id: '1' } }], URL_HERE), 'subscribed_elsewhere');
  assert.equal(subscriptionState([{ override_callback_uri: 'https://www.leadforgrow.com/api/webhooks/meta/other' }], URL_HERE), 'subscribed_elsewhere');
  assert.equal(subscriptionState([{ override_callback_uri: URL_HERE + '/' }], URL_HERE), 'ok');
});

test('subscribeParams: override only with a verify token', () => {
  const p = subscribeParams({ callbackUrl: URL_HERE, verifyToken: 'tok' });
  assert.equal(p.get('override_callback_uri'), URL_HERE);
  assert.equal(p.get('verify_token'), 'tok');
  assert.equal(subscribeParams({ callbackUrl: URL_HERE, verifyToken: '' }).toString(), '');
});

function mockFetch(responses) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body });
    const r = responses.shift();
    return { ok: r.ok !== false, json: async () => r.body };
  };
  return calls;
}

test('ensureWabaSubscription: subscribes an unsubscribed WABA with the override', async () => {
  const calls = mockFetch([{ body: { data: [] } }, { body: { success: true } }]);
  const r = await ensureWabaSubscription({ wabaId: 'W1', token: 't', callbackUrl: URL_HERE, verifyToken: 'v' });
  assert.equal(r.state, 'subscribed');
  assert.equal(r.before, 'not_subscribed');
  assert.equal(calls[1].method, 'POST');
  assert.match(calls[1].url, /\/W1\/subscribed_apps$/);
  assert.match(calls[1].body, /override_callback_uri=/);
});

test('ensureWabaSubscription: already pointing here → no POST', async () => {
  const calls = mockFetch([{ body: { data: [{ override_callback_uri: URL_HERE }] } }]);
  const r = await ensureWabaSubscription({ wabaId: 'W1', token: 't', callbackUrl: URL_HERE, verifyToken: 'v' });
  assert.equal(r.state, 'ok');
  assert.equal(calls.length, 1);
});

test('ensureWabaSubscription: Meta error is reported, never thrown; missing WABA id skips', async () => {
  mockFetch([{ body: { data: [] } }, { ok: false, body: { error: { code: 200, message: 'Permissions error' } } }]);
  const r = await ensureWabaSubscription({ wabaId: 'W1', token: 't', callbackUrl: URL_HERE, verifyToken: 'v' });
  assert.equal(r.state, 'failed');
  assert.match(r.error, /Meta code 200/);
  assert.equal((await ensureWabaSubscription({ token: 't' })).state, 'skipped');
});

test('Sync status route subscribes webhooks and never targets a non-public origin', () => {
  const src = readFileSync(new URL('../app/api/business/settings/test-whatsapp/route.js', import.meta.url), 'utf8');
  assert.match(src, /ensureWabaSubscription\(/);
  assert.match(src, /isPublicHttpsOrigin\(origin\)/);
  assert.match(src, /www\.leadforgrow\.com/);
});
