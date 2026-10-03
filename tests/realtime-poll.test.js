/**
 * Realtime polling: one poller per tab, token never in the URL, slower when idle.
 *
 * Before: every component using useRealtime ran its own 5 s timer (the Leads
 * page ran three), each sending the JWT as ?token= in the URL.
 *
 * Run: node --test tests/realtime-poll.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../app/automation/hooks/useRealtime.js', import.meta.url), 'utf8');
const route = readFileSync(new URL('../app/api/realtime/poll/route.js', import.meta.url), 'utf8');

describe('useRealtime', () => {
  it('shares one poller across every component in the tab', () => {
    assert.match(src, /const subscribers = new Set\(\);/);
    assert.match(src, /const first = subscribers\.size === 0;/);
    assert.match(src, /if \(subscribers\.size === 0\) \{\s*stopLoop\(\);/);
    assert.doesNotMatch(src, /setInterval\(/, 'no per-component interval timers');
  });

  it('sends the token in the Authorization header, never in the URL', () => {
    assert.match(src, /headers: \{ Authorization: `Bearer \$\{token\}` \}/);
    assert.doesNotMatch(src, /[?&]token=/);
    assert.match(route, /req\.headers\.get\('authorization'\)/, 'server reads the header');
  });

  it('polls every 5 s when active, 20 s when idle, and not at all when hidden', () => {
    assert.match(src, /const ACTIVE_INTERVAL = 5000;/);
    assert.match(src, /const IDLE_INTERVAL = 20000;/);
    assert.match(src, /document\.visibilityState !== 'visible'\) return;/);
    assert.match(src, /idle \? IDLE_INTERVAL : ACTIVE_INTERVAL/);
  });

  it('never overlaps requests', () => {
    assert.match(src, /shared\.inFlight \|\| !subscribers\.size\) return;/);
  });
});
