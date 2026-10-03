/**
 * Rate limiting.
 *
 * Regressions this guards:
 *  - With no REDIS_URL every limit was a no-op (login brute-force protection included);
 *    there is now a MongoDB fallback.
 *  - Every route shared one counter per IP, so form posts used up the login allowance.
 *  - The Redis expiry was re-set on every hit, so a busy client's window never closed.
 *  - Public endpoints (chatbot AI replies, chatbot lead capture, meeting booking,
 *    funnel leads, unsubscribe, slug check) had no limit at all.
 *
 * Run: node --test tests/rate-limit.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
const { windowIndex, clientIp } = await import('../lib/rateLimit.js');

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const headers = (h) => ({ headers: new Headers(h) });

describe('rate limit helpers', () => {
  it('windows are fixed: same number inside a window, next number after it', () => {
    const start = 1_700_000_040_000; // divisible by 60 s
    assert.equal(windowIndex(60, start), windowIndex(60, start + 59_999));
    assert.equal(windowIndex(60, start) + 1, windowIndex(60, start + 60_000));
  });

  it('takes the client (first) address from x-forwarded-for', () => {
    assert.equal(clientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' })), '203.0.113.7');
    assert.equal(clientIp(headers({ 'x-real-ip': '198.51.100.4' })), '198.51.100.4');
    assert.equal(clientIp(headers({})), '127.0.0.1');
  });
});

describe('rate limit wiring', () => {
  const lib = read('lib/rateLimit.js');

  it('falls back to MongoDB when Redis is not configured', () => {
    assert.match(lib, /redis \? await countRedis\(key, window\) : await countMongo\(key, window\)/);
    assert.match(lib, /RateLimitCounter\.findOneAndUpdate\(\s*\{ _id: key \},\s*\{ \$inc: \{ count: 1 \}/);
    assert.match(read('models/RateLimitCounter.js'), /expireAfterSeconds: 0/);
  });

  it('keys include the window and the route path', () => {
    assert.match(lib, /`rate_limit:\$\{id\}:\$\{windowIndex\(window\)\}`/);
    assert.match(lib, /rateLimit\(`\$\{path\}:\$\{clientIp\(req\)\}`/);
  });

  for (const [file, method] of [
    ['app/api/public/chatbot/reply/route.js', 'POST'],
    ['app/api/public/chatbot/route.js', 'POST'],
    ['app/api/public/chatbot/event/route.js', 'POST'],
    ['app/api/meetings/book/route.js', 'POST'],
    ['app/api/website-funnel/leads/route.js', 'POST'],
    ['app/api/unsubscribe/[token]/route.js', 'GET'],
    ['app/api/websites/slug-check/route.js', 'GET'],
    ['app/api/auth/login/route.js', 'POST'],
    ['app/api/forms/submit/route.js', 'POST'],
  ]) {
    it(`${file} is rate limited`, () => {
      assert.match(read(file), new RegExp(`export const ${method} = withRateLimit\\(`));
    });
  }
});
