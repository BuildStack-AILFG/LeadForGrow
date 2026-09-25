/**
 * Leak Audit (Leak Guard Phase 0): rules, CSV import, admin API gate.
 *
 * Run: node --test tests/leak-audit.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  businessMinutesBetween, evaluateLead, buildLeakReport, mergeConfig, formatDuration,
} from '../lib/leak/rules.js';
import {
  guessMapping, availableRules, detectDateOrder, parseDate, mapStatus, rowsToRecords,
} from '../lib/leak/csvSource.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
// IST wall clock → Date
const ist = (s) => new Date(`${s}+05:30`);
const cfg = mergeConfig({});
const bh = cfg.businessHours; // Mon–Sat 09:00–19:00 IST

describe('business time', () => {
  it('counts only open hours', () => {
    assert.equal(businessMinutesBetween(ist('2026-09-21T10:00:00'), ist('2026-09-21T11:30:00'), bh), 90); // Mon
    // Mon 18:00 → Tue 10:00 = 60 min Mon + 60 min Tue
    assert.equal(businessMinutesBetween(ist('2026-09-21T18:00:00'), ist('2026-09-22T10:00:00'), bh), 120);
    // Sat 18:30 → Mon 09:30 skips Sunday
    assert.equal(businessMinutesBetween(ist('2026-09-26T18:30:00'), ist('2026-09-28T09:30:00'), bh), 60);
    // enquiry at night, reply next morning at opening: 0 business minutes
    assert.equal(businessMinutesBetween(ist('2026-09-21T23:00:00'), ist('2026-09-22T09:00:00'), bh), 0);
  });

  it('wall-clock when business hours are off; never negative', () => {
    assert.equal(businessMinutesBetween(ist('2026-09-21T23:00:00'), ist('2026-09-22T01:00:00'), { enabled: false }), 120);
    assert.equal(businessMinutesBetween(ist('2026-09-22T01:00:00'), ist('2026-09-21T23:00:00'), bh), 0);
  });

  it('formats durations', () => {
    assert.equal(formatDuration(45), '45m');
    assert.equal(formatDuration(200), '3h 20m');
    assert.equal(formatDuration(60 * 52), '2d 4h');
  });
});

describe('rules', () => {
  const now = ist('2026-09-25T12:00:00'); // Fri
  const base = { id: 'x', status: 'open', createdAt: ist('2026-09-24T10:00:00') };
  const rules = (rec, c = cfg) => evaluateLead(rec, c, now).map((f) => f.rule + (f.kind ? `:${f.kind}` : ''));

  it('R1 never contacted / late / on time', () => {
    assert.deepEqual(rules(base), ['R1:never']);
    assert.deepEqual(rules({ ...base, firstContactAt: ist('2026-09-24T13:00:00') }), ['R1:late']);
    assert.deepEqual(rules({ ...base, firstContactAt: ist('2026-09-24T10:20:00') }), []);
    // a won deal with no logged contact is a data gap, not a leak
    assert.deepEqual(rules({ ...base, status: 'won' }), []);
    // too new to judge
    assert.deepEqual(rules({ ...base, createdAt: ist('2026-09-25T11:30:00') }), []);
  });

  it('R1 says when only bots answered', () => {
    const [f] = evaluateLead({ ...base, onlyAutomatedContact: true }, cfg, now);
    assert.match(f.reason, /Only automated messages/);
  });

  it('R2 customer waiting beyond the target; closed leads are not waiting', () => {
    const rec = { ...base, firstContactAt: ist('2026-09-24T10:10:00'), awaitingReplySince: ist('2026-09-24T12:00:00') };
    assert.deepEqual(rules(rec), ['R2']);
    assert.deepEqual(rules({ ...rec, awaitingReplySince: ist('2026-09-25T10:00:00') }), []);
    assert.deepEqual(rules({ ...rec, status: 'lost' }), []);
  });

  it('R3 follow-up overdue unless something happened after it was due', () => {
    const rec = { ...base, firstContactAt: ist('2026-09-24T10:10:00'), nextFollowUpAt: ist('2026-09-22T10:00:00') };
    assert.deepEqual(rules(rec), ['R3']);
    assert.deepEqual(rules({ ...rec, lastActivityAt: ist('2026-09-23T10:00:00') }), []);
    assert.deepEqual(rules({ ...base, firstContactAt: ist('2026-09-24T10:10:00'), overdueTaskAt: ist('2026-09-20T10:00:00') }), ['R3']);
  });

  it('R4 gone quiet, but not double-counted with "never contacted"', () => {
    const old = { ...base, createdAt: ist('2026-08-01T10:00:00') };
    assert.deepEqual(rules({ ...old, firstContactAt: ist('2026-08-01T10:10:00'), lastActivityAt: ist('2026-08-20T10:00:00') }), ['R4']);
    assert.deepEqual(rules(old), ['R1:never']);
  });

  it('R5 lost without trying', () => {
    const lost = { ...base, status: 'lost', firstContactAt: ist('2026-09-24T10:10:00') };
    assert.deepEqual(rules({ ...lost, attempts: 1 }), ['R5']);
    assert.deepEqual(rules({ ...lost, attempts: 3 }), []);
    // lost with no contact at all: never contacted, and lost without trying
    assert.deepEqual(rules({ ...base, status: 'lost' }), ['R1:never', 'R5']);
  });

  it('only runs the rules the data supports', () => {
    assert.deepEqual(evaluateLead(base, cfg, now, new Set(['R3'])), []);
  });

  it('unqualified leads are left out', () => {
    assert.deepEqual(rules({ ...base, status: 'unqualified' }), []);
  });
});

describe('report', () => {
  const now = ist('2026-09-25T12:00:00');
  const records = [
    { id: 'a', owner: 'Asha', source: 'meta', status: 'open', createdAt: ist('2026-09-24T10:00:00') },                                        // never
    { id: 'b', owner: 'Asha', source: 'meta', status: 'open', createdAt: ist('2026-09-24T10:00:00'), firstContactAt: ist('2026-09-24T10:30:00') }, // ok
    { id: 'c', owner: 'Ravi', source: 'web', status: 'open', createdAt: ist('2026-09-24T10:00:00'), firstContactAt: ist('2026-09-24T15:00:00') },  // late
    { id: 'd', owner: 'Ravi', source: 'web', status: 'unqualified', createdAt: ist('2026-09-24T10:00:00') },                                  // excluded
  ];

  it('counts distinct leaked enquiries, not flags', () => {
    const r = buildLeakReport(records, { avgDealValue: 10000, conversionPct: 20 }, now);
    assert.equal(r.totals.enquiries, 3);
    assert.equal(r.totals.leaked, 2);
    assert.equal(r.totals.leakPct, 66.7);
    assert.equal(r.totals.neverContacted, 1);
    assert.equal(r.totals.withinSlaPct, 50);
    assert.equal(r.items[0].id, 'a', 'most severe first');
    assert.equal(r.totals.estimatedAtRisk, 2 * 10000 * 0.2);
    assert.deepEqual(r.byOwner.map((o) => [o.owner, o.leaked]), [['Asha', 1], ['Ravi', 1]]);
  });

  it('owner-dismissed false positives drop out of the leak count and are measured', () => {
    const r = buildLeakReport(records, {}, now, { dismissed: ['c'] });
    assert.equal(r.totals.leaked, 1);
    assert.equal(r.totals.flagged, 2);
    assert.equal(r.totals.falsePositivePct, 50);
    assert.equal(r.items.find((i) => i.id === 'c').dismissed, true);
  });

  it('no estimate without the owner\'s numbers', () => {
    assert.equal(buildLeakReport(records, {}, now).totals.estimatedAtRisk, null);
  });

  it('accepts JSON dates (strings) from the API', () => {
    const json = JSON.parse(JSON.stringify(records));
    assert.equal(buildLeakReport(json, {}, now).totals.leaked, 2);
  });
});

describe('CSV from another CRM', () => {
  it('guesses Zoho / HubSpot / LeadSquared headers', () => {
    assert.deepEqual(
      guessMapping(['Lead Name', 'Mobile', 'Lead Owner', 'Lead Source', 'Lead Status', 'Created Time', 'Last Activity Time']),
      { name: 'Lead Name', phone: 'Mobile', owner: 'Lead Owner', source: 'Lead Source', status: 'Lead Status', createdAt: 'Created Time', lastActivityAt: 'Last Activity Time' }
    );
    const hs = guessMapping(['Create Date', 'Contact owner', 'Lead Status', 'Last Activity Date', 'Next Activity Date', 'Number of Sales Activities']);
    assert.equal(hs.createdAt, 'Create Date');
    assert.equal(hs.nextFollowUpAt, 'Next Activity Date');
    assert.equal(hs.attempts, 'Number of Sales Activities');
    assert.equal(guessMapping(['Created On', 'Owner', 'Lead Stage']).createdAt, 'Created On');
  });

  it('switches checks on by column', () => {
    assert.deepEqual(availableRules({ createdAt: 'x' }), []);
    assert.deepEqual(availableRules({ createdAt: 'x', firstContactAt: 'y', status: 's', nextFollowUpAt: 'n', lastActivityAt: 'l' }), ['R1', 'R3', 'R4', 'R5']);
  });

  it('reads Indian, US, ISO and text-month dates in IST', () => {
    assert.equal(detectDateOrder(['25/09/2026', '03/04/2026']), 'DMY');
    assert.equal(detectDateOrder(['09/25/2026']), 'MDY');
    assert.equal(detectDateOrder(['2026-09-25 10:00']), 'YMD');
    assert.equal(detectDateOrder(['03/04/2026']), 'DMY', 'ambiguous defaults to day-first');
    assert.equal(parseDate('25/09/2026 10:30', 'DMY').toISOString(), '2026-09-25T05:00:00.000Z');
    assert.equal(parseDate('09/25/2026 03:30 PM', 'MDY').toISOString(), '2026-09-25T10:00:00.000Z');
    assert.equal(parseDate('2026-09-25 10:30:00', 'DMY').toISOString(), '2026-09-25T05:00:00.000Z');
    assert.equal(parseDate('25 Sep 2026 10:30', 'DMY').toISOString(), '2026-09-25T05:00:00.000Z');
    assert.equal(parseDate('Sep 25, 2026 10:30 AM', 'DMY').toISOString(), '2026-09-25T05:00:00.000Z');
    assert.equal(parseDate('2026-09-25T05:00:00Z').toISOString(), '2026-09-25T05:00:00.000Z');
    assert.equal(parseDate('31/02/2026', 'DMY'), null);
    assert.equal(parseDate('', 'DMY'), null);
    assert.equal(parseDate('not a date', 'DMY'), null);
  });

  it('maps CRM statuses', () => {
    assert.equal(mapStatus('Closed Won'), 'won');
    assert.equal(mapStatus('Admitted'), 'won');
    assert.equal(mapStatus('Lost'), 'lost');
    assert.equal(mapStatus('Not Interested'), 'lost');
    assert.equal(mapStatus('Junk Lead'), 'unqualified');
    assert.equal(mapStatus('Contacted'), 'open');
    assert.equal(mapStatus(''), 'open');
  });

  it('rows become records; bad dates are skipped and counted', () => {
    const rows = [
      { 'Created Time': '24/09/2026 10:00', 'Lead Status': 'Contacted', 'Last In': '24/09/2026 12:00', 'Last Out': '24/09/2026 11:00', Attempts: '2' },
      { 'Created Time': '', 'Lead Status': 'New' },
    ];
    const { records, skipped, dateOrder } = rowsToRecords(rows, { createdAt: 'Created Time', status: 'Lead Status', lastCustomerMessageAt: 'Last In', lastReplyAt: 'Last Out', attempts: 'Attempts' });
    assert.equal(skipped, 1);
    assert.equal(dateOrder, 'DMY');
    assert.equal(records[0].id, 'row-2');
    assert.equal(records[0].status, 'open');
    assert.equal(records[0].attempts, 2);
    assert.equal(records[0].awaitingReplySince.toISOString(), '2026-09-24T06:30:00.000Z');
  });
});

describe('admin API and privacy', () => {
  it('leak-audit API requires the admin password and only reads', () => {
    const src = read('app/api/admin/leak-audit/route.js');
    assert.match(src, /if \(!requireAdminPassword\(body\.password\)\)/);
    assert.doesNotMatch(src, /\.(create|updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany|save)\(/);
    assert.doesNotMatch(read('lib/leak/databaseSource.js'), /\.(create|updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany|save)\(/);
  });

  it('the db admin route uses the same shared password check', () => {
    const src = read('app/api/admin/db/route.js');
    assert.match(src, /import \{ requireAdminPassword \} from '@\/lib\/admin\/adminAuth'/);
    assert.doesNotMatch(src, /function requireAdminPassword/);
  });

  it('a prospect CSV is never sent to the server', () => {
    const src = read('app/lfgadmin/components/leak/LeakAudit.jsx');
    const apiCalls = src.match(/leakApi\(password, \{[^}]*\}\)/g) || [];
    assert.ok(apiCalls.length >= 2);
    for (const c of apiCalls) assert.doesNotMatch(c, /rows|csv|records/i, c);
  });
});
