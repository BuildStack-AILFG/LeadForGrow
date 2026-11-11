import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
const { newVerifyToken, tokensMatch, matchesBusinessInstagramToken } = await import('../lib/instagram/verifyToken.js');

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('newVerifyToken: prefixed, random, URL-safe', () => {
  const a = newVerifyToken();
  const b = newVerifyToken();
  assert.match(a, /^lfg_ig_[0-9a-f]{36}$/);
  assert.notEqual(a, b);
});

test('tokensMatch: exact match only, empty never matches', () => {
  assert.equal(tokensMatch('abc', 'abc'), true);
  assert.equal(tokensMatch('abc', 'abd'), false);
  assert.equal(tokensMatch('abc', 'abcd'), false);
  assert.equal(tokensMatch('', ''), false);
  assert.equal(tokensMatch(undefined, undefined), false);
});

test('matchesBusinessInstagramToken rejects bad input without touching the DB', async () => {
  assert.equal(await matchesBusinessInstagramToken('not-an-id', 'x'), false);
  assert.equal(await matchesBusinessInstagramToken('', 'x'), false);
  assert.equal(await matchesBusinessInstagramToken('6af3533089edcd6ae76581f3', ''), false);
});

test('shared webhook GET accepts the per-business token next to META_VERIFY_TOKEN', () => {
  const s = src('app/api/webhooks/meta/route.js');
  assert.match(s, /process\.env\.META_VERIFY_TOKEN/);
  assert.match(s, /searchParams\.get\('business'\)/);
  assert.match(s, /matchesBusinessInstagramToken\(businessId, token\)/);
});

test('settings API returns the token; page shows URL with ?business= and a copyable token', () => {
  assert.match(src('app/api/business/settings/instagram-status/route.js'), /ensureInstagramVerifyToken\(business\)/);
  const page = src('app/automation/settings/instagram/page.js');
  assert.match(page, /\?business=\$\{status\.webhook\.businessId\}/);
  assert.match(page, /<CopyValueField label="Verify token"/);
  assert.doesNotMatch(page, /META_VERIFY_TOKEN<\/code> value set on the server/);
  assert.match(src('models/Business.js'), /verifyToken: \{ type: String \},\r?\n    profilePicture/);
});
