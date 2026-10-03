/**
 * Unexpected (500) errors must not send raw error text to the client — it leaked
 * database errors, field names and provider responses from ~145 routes.
 * Routes use serverErrorMessage(err): full error in the log, generic text in production.
 *
 * Run: node --test tests/error-leakage.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
const { serverErrorMessage, GENERIC_SERVER_ERROR } = await import('../lib/api/serverError.js');

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function routes(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...routes(p));
    else if (name === 'route.js') out.push(p);
  }
  return out;
}

const LEAK = /NextResponse\.json\((?:(?!NextResponse\.json\()[^;])*?\berror:\s*(?:error|err|e)\.message\b(?:(?!NextResponse\.json\()[^;])*?\bstatus:\s*500\b/s;

describe('500 responses', () => {
  it('no API route returns error.message with status 500', () => {
    const leaking = routes(join(ROOT, 'app', 'api')).filter((f) => LEAK.test(readFileSync(f, 'utf8')));
    assert.deepEqual(leaking, []);
  });

  it('serverErrorMessage hides the message in production and keeps it in development', () => {
    const env = process.env.NODE_ENV;
    const quiet = console.error;
    console.error = () => {};
    try {
      process.env.NODE_ENV = 'production';
      assert.equal(serverErrorMessage(new Error('E11000 duplicate key collection: leads')), GENERIC_SERVER_ERROR);
      process.env.NODE_ENV = 'development';
      assert.equal(serverErrorMessage(new Error('boom')), 'boom');
    } finally {
      process.env.NODE_ENV = env;
      console.error = quiet;
    }
  });
});
