/**
 * Leak Radar (Leak Guard Phase 1): flags, actions, ledger maths, daily brief, wiring.
 *
 * Run: node --test tests/leak-radar.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeConfig } from '../lib/leak/rules.js';
import { actionableFlags, dedupeKeyFor, holdoutBucket, isHoldout } from '../lib/leak/flagging.js';
import { canActOnFlag, parseActionInput, flagUpdateFor } from '../lib/leak/actionRules.js';
import { summarizeLedger, MIN_SAMPLE } from '../lib/leak/ledgerMath.js';
import { digestContent, digestDueToday } from '../lib/leak/digestContent.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ist = (s) => new Date(`${s}+05:30`);
const cfg = mergeConfig({});
const now = ist('2026-09-25T12:00:00');

describe('flags', () => {
  const base = { id: 'L1', status: 'open', createdAt: ist('2026-09-24T10:00:00') };

  it('only actionable leaks become flags (a late first reply is history, not a to-do)', () => {
    assert.deepEqual(actionableFlags('B', base, cfg, now).map((f) => f.rule), ['R1']);
    const late = { ...base, firstContactAt: ist('2026-09-24T15:00:00') };
    assert.deepEqual(actionableFlags('B', late, cfg, now), []);
  });

  it('one key per episode: same episode → same key, new episode → new key', () => {
    const waiting = { ...base, firstContactAt: ist('2026-09-24T10:10:00'), awaitingReplySince: ist('2026-09-24T12:00:00') };
    const [f] = actionableFlags('B', waiting, cfg, now);
    assert.equal(f.dedupeKey, `B:L1:R2:${ist('2026-09-24T12:00:00').getTime()}`);
    assert.equal(actionableFlags('B', waiting, cfg, ist('2026-09-25T15:00:00'))[0].dedupeKey, f.dedupeKey);
    const later = { ...waiting, awaitingReplySince: ist('2026-09-25T09:00:00') };
    assert.notEqual(dedupeKeyFor('B', later, { rule: 'R2' }), f.dedupeKey);
    assert.equal(dedupeKeyFor('B', base, { rule: 'R1' }), 'B:L1:R1');
  });

  it('holdout is stable per key and close to the chosen share', () => {
    assert.equal(holdoutBucket('B:L1:R1'), holdoutBucket('B:L1:R1'));
    assert.equal(isHoldout('B:L1:R1', 0), false);
    let held = 0;
    for (let i = 0; i < 5000; i += 1) if (isHoldout(`B:L${i}:R2:${i * 7}`, 20)) held += 1;
    assert.ok(held > 800 && held < 1200, `20% expected, got ${held / 50}%`);
  });
});

describe('actions', () => {
  const rep = { userId: 'u1', role: 'team_member' };
  const owner = { userId: 'u9', role: 'owner' };
  const flag = { _id: 'f1', status: 'open', version: 3, assignedTo: 'u1' };

  it('managers act on any leak; a salesperson on their own', () => {
    assert.equal(canActOnFlag(owner, { ...flag, assignedTo: 'someone' }), true);
    assert.equal(canActOnFlag(rep, flag), true);
    assert.equal(canActOnFlag(rep, { ...flag, assignedTo: 'u2' }), false);
    assert.equal(canActOnFlag(rep, { ...flag, assignedTo: null }), false);
  });

  it('validates input: key, reasons where they matter, snooze hours, teammate id', () => {
    assert.match(parseActionInput({ actionType: 'nope', idempotencyKey: 'abcdefgh' }).error, /Unknown/);
    assert.match(parseActionInput({ actionType: 'message_sent' }).error, /idempotencyKey/);
    assert.match(parseActionInput({ actionType: 'dismissed', idempotencyKey: 'abcdefgh' }).error, /reason/);
    assert.match(parseActionInput({ actionType: 'snoozed', idempotencyKey: 'abcdefgh', note: 'on leave' }).error, /snoozeHours/);
    assert.equal(parseActionInput({ actionType: 'snoozed', idempotencyKey: 'abcdefgh', note: 'x', snoozeHours: 999 }).value.snoozeHours, 168);
    assert.match(parseActionInput({ actionType: 'reassigned', idempotencyKey: 'abcdefgh', assignedTo: 'bob' }).error, /assignedTo/);
    assert.equal(parseActionInput({ actionType: 'worked_outside', idempotencyKey: 'abcdefgh' }).value.actionType, 'worked_outside');
  });

  it('moves the flag as expected', () => {
    const t = new Date('2026-09-25T06:30:00Z');
    assert.equal(flagUpdateFor(flag, { actionType: 'message_sent' }, t).$set.status, 'actioned');
    assert.deepEqual(flagUpdateFor(flag, { actionType: 'worked_outside', note: 'called' }, t).$set.resolution, 'worked_outside');
    assert.equal(flagUpdateFor(flag, { actionType: 'dismissed', note: 'duplicate' }, t).$set.status, 'dismissed');
    assert.equal(flagUpdateFor(flag, { actionType: 'snoozed', snoozeHours: 2 }, t).$set.snoozedUntil.toISOString(), '2026-09-25T08:30:00.000Z');
    assert.equal(flagUpdateFor(flag, { actionType: 'reassigned', assignedTo: 'u2' }, t).$set.assignedTo, 'u2');
    assert.deepEqual(flagUpdateFor(flag, { actionType: 'message_sent' }, t).$inc, { version: 1 });
  });

  it('a flag the reply hook already closed only gains actionedAt', () => {
    const resolved = { ...flag, status: 'resolved' };
    assert.deepEqual(Object.keys(flagUpdateFor(resolved, { actionType: 'message_sent' }).$set), ['actionedAt']);
    assert.equal(flagUpdateFor({ ...resolved, actionedAt: new Date() }, { actionType: 'message_sent' }), null);
    assert.equal(flagUpdateFor(resolved, { actionType: 'dismissed', note: 'x' }), null);
  });
});

describe('ledger maths', () => {
  const d = (s) => new Date(s);
  const mk = (i, holdout, extra = {}) => ({ _id: `f${i}`, leadId: `L${i}`, rule: 'R2', holdout, status: 'open', detectedAt: d('2026-09-01T00:00:00Z'), ...extra });

  it('recovery = reply within 7 days or money within 30; revenue once per lead; categories kept apart', () => {
    const flags = [mk(1, false), mk(2, false), mk(3, true), mk(4, false, { status: 'dismissed' })];
    const s = summarizeLedger(flags, {
      firstActionAt: new Map([['f1', d('2026-09-02T00:00:00Z')]]),
      incoming: new Map([['L1', [d('2026-09-03T00:00:00Z')]], ['L3', [d('2026-09-20T00:00:00Z')]]]),
      converted: new Map(),
      revenue: new Map([
        ['L1', [{ at: d('2026-09-10T00:00:00Z'), amount: 5000 }]],
        ['L2', [{ at: d('2026-09-05T00:00:00Z'), amount: 3000 }]],
      ]),
    });
    assert.equal(s.shown.flagged, 2, 'dismissed = not a leak, left out');
    assert.equal(s.shown.actioned, 1);
    assert.equal(s.shown.recovered, 2);
    assert.equal(s.holdout.flagged, 1);
    assert.equal(s.holdout.recovered, 0, 'reply after 19 days is outside the window');
    assert.equal(s.revenue.observed, 8000);
    assert.equal(s.revenue.attributed, 5000, 'only the lead someone acted on, after the action');
    assert.equal(s.difference, null, 'too few to compare');
    assert.equal(s.enoughData, false);
  });

  it('compares shown vs holdout once both groups are big enough', () => {
    const flags = [];
    const incoming = new Map();
    for (let i = 0; i < MIN_SAMPLE; i += 1) {
      flags.push(mk(`s${i}`, false));
      flags.push(mk(`h${i}`, true));
      if (i % 2 === 0) incoming.set(`Ls${i}`, [d('2026-09-02T00:00:00Z')]);
      if (i % 5 === 0) incoming.set(`Lh${i}`, [d('2026-09-02T00:00:00Z')]);
    }
    const s = summarizeLedger(flags, { firstActionAt: new Map(), incoming, converted: new Map(), revenue: new Map() });
    assert.equal(s.enoughData, true);
    assert.equal(s.shown.recoveryRate, 50);
    assert.equal(s.holdout.recoveryRate, 20);
    assert.equal(s.difference, 30);
  });
});

describe('daily brief', () => {
  it('five plain lines, estimate labelled, names escaped', () => {
    const c = digestContent({
      businessName: 'Pistons <Garage>', newYesterday: 3, openNow: 12, atRisk: 45000, recoveredYesterday: 1,
      topRep: { name: 'Asha', open: 7 }, topLeak: { leadName: 'Ravi', reason: "Customer's message has waited 2d for a reply." },
      url: 'https://leadforgrow.com/automation/leak-radar',
    });
    assert.equal(c.lines.length, 5);
    assert.match(c.lines[1], /about ₹45,000 at risk, an estimate/);
    assert.match(c.subject, /12 enquiries slipping/);
    assert.match(c.html, /Pistons &lt;Garage&gt;/);
    assert.doesNotMatch(c.html, /<Garage>/);
  });

  it('quiet day reads as good news', () => {
    const c = digestContent({ businessName: 'X', newYesterday: 0, openNow: 0, atRisk: null, recoveredYesterday: 0, topRep: null, topLeak: null, url: 'u' });
    assert.match(c.subject, /no enquiries slipping/);
    assert.equal(c.lines[0], 'No new enquiries slipped yesterday.');
  });

  it('once a day, after 08:00 local', () => {
    assert.equal(digestDueToday(null, ist('2026-09-25T07:59:00')), false);
    assert.equal(digestDueToday(null, ist('2026-09-25T08:00:00')), true);
    assert.equal(digestDueToday(ist('2026-09-25T08:05:00'), ist('2026-09-25T18:00:00')), false);
    assert.equal(digestDueToday(ist('2026-09-24T08:05:00'), ist('2026-09-25T09:00:00')), true);
  });
});

describe('wiring and safety', () => {
  it('a human reply closes R1/R2 leaks from recordChannelMessage', () => {
    const src = read('lib/omnichannel/conversationService.js');
    assert.match(src, /if \(direction === 'outgoing' && origin === 'user' && !isInternal[^\n]*\n\s*await resolveLeaksOnHumanReply/);
    assert.match(read('lib/leak/hooks.js'), /rule: \{ \$in: \['R1', 'R2'\] \}/);
  });

  it('APIs take the business from the session and never from the request', () => {
    for (const p of ['flags/route.js', 'flags/[id]/actions/route.js', 'summary/route.js', 'ledger/route.js', 'settings/route.js', 'scan/route.js']) {
      const src = read(`app/api/automation/leak/${p}`);
      assert.match(src, /leakRoute\(/, p);
      assert.doesNotMatch(src, /body\.businessId|searchParams\.get\('businessId'\)|get\('businessId'\)/, p);
    }
    assert.match(read('lib/leak/api.js'), /businessId: new mongoose\.Types\.ObjectId\(String\(req\.user\.businessId\)\)/);
  });

  it('salespeople only see their own leaks; settings, ledger and scan are for managers', () => {
    assert.match(read('app/api/automation/leak/flags/route.js'), /const scope = manager \? .* : 'mine';/);
    assert.match(read('app/api/automation/leak/summary/route.js'), /if \(!manager\) base\.assignedTo = userId;/);
    for (const p of ['ledger', 'settings', 'scan']) {
      assert.match(read(`app/api/automation/leak/${p}/route.js`), /if \(!manager\) return bad\(/, p);
    }
  });

  it('holdout leaks are never shown; cron routes need the cron secret', () => {
    assert.match(read('lib/leak/api.js'), /holdout: \{ \$ne: true \}/);
    for (const p of ['leak-scan', 'leak-digest']) {
      assert.match(read(`app/api/cron/${p}/route.js`), /Bearer \$\{process\.env\.CRON_SECRET\}/);
    }
  });

  it('live-tracked conversations count as tracked (not only backfilled ones)', () => {
    assert.match(read('lib/leak/databaseSource.js'), /const hasTracking = \(c\) => Boolean\(c\.responseConfidence \|\| c\.firstInboundAt\);/);
  });

  it('the radar also sees older leads with a waiting customer or an overdue task; stats stay on the window', () => {
    const scanner = read('lib/leak/scanner.js');
    assert.match(scanner, /includeActive: true/);
    assert.match(scanner, /const report = buildLeakReport\(windowRecords, cfg, now\);/);
    assert.match(read('lib/leak/databaseSource.js'), /awaitingReplySince: \{ \$type: 'date' \}/);
  });

  it('unqualified keeps its reason; media-header templates are not offered for one-tap send', () => {
    assert.match(read('app/automation/hooks/useLeakRadar.js'), /status: 'unqualified', unqualifiedReason: note/);
    assert.match(read('app/automation/components/leak/LeakDialogs.jsx'), /!hasMediaHeader\(t\)/);
  });

  it('Leak Radar is off until a business turns it on', () => {
    assert.match(read('models/Business.js'), /leakGuard: \{\s*enabled: \{ type: Boolean, default: false \}/);
  });
});
