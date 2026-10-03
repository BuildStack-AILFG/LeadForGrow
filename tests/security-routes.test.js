/**
 * Debug/diagnostic and third-party webhook routes: auth and tenant scoping.
 *
 * Guards the gaps found in the Phase 0 inventory:
 *  - Meta app-association / page-subscription and the SMTP email-test were
 *    public, took any businessId from the query string, could subscribe a
 *    Page on GET, and returned raw webhook payloads of other tenants.
 *  - getRecentWebhookIngress() returned every tenant's rows when called
 *    without a businessId.
 *  - The Interakt webhook accepted anything when INTERAKT_WEBHOOK_TOKEN was
 *    unset and matched leads by phone across all businesses.
 *  - The workflow webhook compared secrets with === and logged x-api-key.
 *
 * Run: node --test tests/security-routes.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyInteraktToken } from '../lib/webhookSecurity.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('diagnostic routes require sign-in and use the caller\'s business', () => {
  for (const p of [
    'app/api/webhooks/meta/app-association/route.js',
    'app/api/webhooks/meta/page-subscription/route.js',
    'app/api/debug/email-test/route.js',
  ]) {
    it(p, () => {
      const src = read(p);
      assert.match(src, /export const GET = withPlanAccess\(/, 'GET must be wrapped in withPlanAccess');
      assert.match(src, /req\.user\.businessId/, 'must use the signed-in business');
      assert.doesNotMatch(src, /searchParams\.get\('(businessId|id)'\)/, 'must not take a business from the query');
      assert.doesNotMatch(src, /export async function GET/, 'no unauthenticated GET');
      assert.doesNotMatch(src, /stack: error\.stack/, 'no stack traces in responses');
    });
  }

  it('Page subscribe is a POST, never a side effect of GET', () => {
    for (const p of ['app/api/webhooks/meta/app-association/route.js', 'app/api/webhooks/meta/page-subscription/route.js']) {
      const src = read(p);
      assert.match(src, /export const GET = withPlanAccess\('integrations', \(req\) => \w+\(req, \{ (forceSubscribe|subscribe): false \}\)\)/);
      assert.match(src, /export const POST = withPlanAccess\('integrations', \(req\) => \w+\(req, \{ (forceSubscribe|subscribe): true \}\)\)/);
    }
  });

  it('never returns a raw ingress document', () => {
    const src = read('app/api/webhooks/meta/app-association/route.js');
    assert.doesNotMatch(src, /lastIngress: ingress\[0\] \?\? null/);
    assert.doesNotMatch(src, /PAGE_ID = '/, 'no hard-coded Page fallback');
  });
});

describe('webhook ingress reads are tenant-scoped', () => {
  const ingress = read('lib/meta/webhookIngress.js');

  it('getRecentWebhookIngress returns nothing without a businessId', () => {
    assert.match(ingress, /if \(!businessId\) return \[\];/);
  });

  it('page matches only pick up unattributed rows', () => {
    assert.match(ingress, /\{ businessId: null, 'parsed\.page_id': String\(pageId\) \}/);
  });

  it('every caller passes a businessId', () => {
    for (const p of [
      'app/api/integrations/meta-ads/webhook-debug/route.js',
      'app/api/webhooks/meta/app-association/route.js',
      'app/api/webhooks/meta/page-subscription/route.js',
    ]) {
      const calls = read(p).match(/getRecentWebhookIngress\(\{[^}]*\}\)/g) || [];
      assert.ok(calls.length > 0, `${p} should call getRecentWebhookIngress`);
      for (const c of calls) assert.match(c, /businessId/, `${p}: ${c}`);
    }
  });

  it('webhook-check no longer reads the whole collection', () => {
    assert.doesNotMatch(read('app/api/debug/webhook-check/route.js'), /MetaWebhookIngress\s*\.find\(\{\}\)/);
  });
});

describe('Interakt webhook', () => {
  it('token check fails closed and accepts only an exact match', () => {
    assert.equal(verifyInteraktToken('abc', undefined), false, 'nothing configured');
    assert.equal(verifyInteraktToken('abc', [undefined, '']), false, 'nothing configured');
    assert.equal(verifyInteraktToken(null, 'abc'), false, 'no token sent');
    assert.equal(verifyInteraktToken('abd', 'abc'), false);
    assert.equal(verifyInteraktToken('abc', 'abc'), true);
    assert.equal(verifyInteraktToken('env-token', ['biz-secret', 'env-token']), true);
  });

  it('route verifies before reading the body and matches leads inside one business', () => {
    const src = read('app/api/integrations/webhooks/interakt-reply/route.js');
    assert.ok(src.indexOf('verifyInteraktToken(') < src.indexOf('request.json()'));
    assert.doesNotMatch(src, /expectedToken && !verifyInteraktToken/, 'no fail-open when unset');
    assert.match(src, /Lead\.findOne\(\{\s*businessId,/);
    assert.match(src, /normalizedPhone\.length < 6/, 'empty phone must not match every lead');
  });

  it('webhook URL carries the business', () => {
    assert.match(read('lib/integrations/catalog.js'), /interakt-reply\?businessId=\{businessId\}/);
  });
});

describe('middleware lets webhook receivers through, and only them', () => {
  const mw = read('middleware.js');
  const literal = mw.match(/const PUBLIC_API_PATTERNS = (\[[\s\S]*?\n\]);/)?.[1];
  const patterns = literal ? new Function(`return ${literal};`)() : [];
  const isPublic = (p) => patterns.some((re) => re.test(p));

  it('pattern list is present and wired into isPublicApi', () => {
    assert.ok(patterns.length >= 3);
    assert.match(mw, /PUBLIC_API_PATTERNS\.some\(\(re\) => re\.test\(pathname\)\)/);
  });

  it('receivers are reachable without a JWT', () => {
    for (const p of [
      '/api/integrations/webhooks/interakt-reply',
      '/api/integrations/webhooks/wh_sec_abc123',
      '/api/automation/webhooks/66aa11bb22cc33dd44ee55ff/9f8e7d',
      '/api/automation/whatsapp-flows/webhook/9f8e7d',
    ]) assert.ok(isPublic(p), p);
  });

  it('management routes next to them stay protected', () => {
    for (const p of [
      '/api/automation/webhooks/replay',
      '/api/automation/whatsapp-flows',
      '/api/automation/whatsapp-flows/66aa11bb22cc33dd44ee55ff/publish',
      '/api/automation/sequences/abc/def',
      '/api/integrations/meta-ads/webhook-debug',
      '/api/integrations/webhooks/a/b',
    ]) assert.ok(!isPublic(p), p);
  });
});

describe('workflow webhook', () => {
  const src = read('app/api/automation/webhooks/[sequenceId]/[secret]/route.js');

  it('compares secrets in constant time', () => {
    assert.match(src, /safeEqual\(secret, expectedSecret\)/);
    assert.match(src, /safeEqual\(apiKey, expectedSecret\)/);
    assert.doesNotMatch(src, /secret === expectedSecret/);
  });

  it('does not store credential headers on the log row', () => {
    assert.doesNotMatch(src, /headers: Object\.fromEntries\(request\.headers\.entries\(\)\)/);
    assert.match(src, /'x-api-key'/);
  });
});
