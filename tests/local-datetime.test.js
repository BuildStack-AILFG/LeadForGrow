/**
 * Times typed in <input type="datetime-local"> are saved in the user's timezone, not UTC.
 * Run: TZ=Asia/Kolkata node --test tests/local-datetime.test.js  (works in any TZ)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { localInputToISO, startOfDayInOffset } from '../lib/dates/localDateTime.js';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('localInputToISO', () => {
  it('turns a datetime-local value into the exact instant in the local timezone', () => {
    const iso = localInputToISO('2026-11-12T15:00');
    assert.equal(iso, new Date(2026, 10, 12, 15, 0).toISOString());
    assert.match(iso, /Z$/);
  });
  it('leaves values that already carry a timezone, and drops empty / invalid ones', () => {
    assert.equal(localInputToISO('2026-11-12T09:30:00.000Z'), '2026-11-12T09:30:00.000Z');
    assert.equal(localInputToISO('2026-11-12T15:00+05:30'), '2026-11-12T15:00+05:30');
    assert.equal(localInputToISO(''), undefined);
    assert.equal(localInputToISO(null), undefined);
    assert.equal(localInputToISO('not a date'), undefined);
  });
});

describe('startOfDayInOffset', () => {
  it('IST midnight is 18:30 UTC the previous day', () => {
    const now = new Date('2026-11-12T01:00:00Z'); // 06:30 IST on 12 Nov
    assert.equal(startOfDayInOffset(now, '-330').toISOString(), '2026-11-11T18:30:00.000Z');
  });
  it('just after IST midnight still belongs to the new IST day', () => {
    const now = new Date('2026-11-11T18:45:00Z'); // 00:15 IST on 12 Nov
    assert.equal(startOfDayInOffset(now, -330).toISOString(), '2026-11-11T18:30:00.000Z');
  });
  it('UTC offset 0 and a positive (US) offset', () => {
    const now = new Date('2026-11-12T03:00:00Z');
    assert.equal(startOfDayInOffset(now, 0).toISOString(), '2026-11-12T00:00:00.000Z');
    assert.equal(startOfDayInOffset(now, 300).toISOString(), '2026-11-11T05:00:00.000Z'); // 22:00 on 11 Nov in UTC-5
  });
  it('falls back to the server day for a missing or absurd offset', () => {
    const now = new Date(2026, 10, 12, 10, 0);
    assert.equal(startOfDayInOffset(now, null).getTime(), new Date(2026, 10, 12).getTime());
    assert.equal(startOfDayInOffset(now, '9999').getTime(), new Date(2026, 10, 12).getTime());
  });
});

describe('wiring', () => {
  it('every datetime-local value is converted before it is sent', () => {
    assert.match(read('app/automation/hooks/useTasksWorkspace.js'), /dueDate: localInputToISO\(payload\.dueDate\)/);
    assert.match(read('app/automation/hooks/useTasksWorkspace.js'), /JSON\.stringify\(\{ dueDate: localInputToISO\(dueDate\) \}\)/);
    assert.match(read('app/automation/components/chat/ChatInput.jsx'), /localInputToISO\(scheduledAt\)/);
    assert.match(read('app/automation/components/leads/QualifiedSummaryModal.jsx'), /localInputToISO\(form\.nextFollowUpAt\)/);
    assert.match(read('app/automation/components/LiveDialer.js'), /localInputToISO\(followUpTime\)/);
    assert.match(read('app/automation/components/leads/DemoScheduledModal.jsx'), /meetingAt: localInputToISO\(/);
    assert.match(read('lib/crm/pipelineAutomation.js'), /body\.meetingAt && !Number\.isNaN/);
  });
  it('the task tabs split days in the viewer timezone', () => {
    assert.match(read('app/api/automation/tasks/route.js'), /startOfDayInOffset\(now, searchParams\.get\('tz'\)\)/);
    assert.equal((read('app/automation/hooks/useTasksWorkspace.js').match(/browserTzParam\(\)/g) || []).length, 2);
  });
});

describe('server-side wall clock is IST, not UTC (run with TZ=UTC to mimic the server)', async () => {
  const { register } = await import('node:module');
  register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
  const L = await import('../lib/dates/localDateTime.js');
  const { generateAvailableSlots } = await import('../lib/meetings/slotGenerator.js');
  const BH = await import('../lib/automation/businessHours.js');
  const SE = await import('../lib/automation/scheduleEvaluator.js');

  it('zonedTimeToDate: 15:30 IST is 10:00 UTC', () => {
    assert.equal(L.zonedTimeToDate(2026, 11, 12, 15, 30, 'Asia/Kolkata').toISOString(), '2026-11-12T10:00:00.000Z');
    const p = L.zonedParts(new Date('2026-11-12T10:00:00Z'), 'Asia/Kolkata');
    assert.deepEqual([p.hour, p.minute, p.day, p.weekday], [15, 30, 12, 4]);
  });

  it('formatInTimeZone shows the IST time', () => {
    const s = L.formatInTimeZone('2026-11-12T10:00:00Z');
    assert.match(s, /3:30\s*pm/i);
  });

  it('booking slots start at 09:00 IST and are labelled 9:00', () => {
    const slots = generateAvailableSlots({
      meetingType: { durationMinutes: 30, availabilityRules: { startTime: '09:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5, 6, 7], minNoticeHours: 0, bufferAfterMinutes: 0, timezone: 'Asia/Kolkata' } },
      fromDate: new Date('2026-11-12T00:00:00Z'),
      daysAhead: 2,
    }).filter((s) => s.start.startsWith('2026-11-13'));
    assert.equal(slots[0].start, '2026-11-13T03:30:00.000Z'); // 09:00 IST
    assert.match(slots[0].label, /9:00\s*am/i);
    assert.ok(slots.at(-1).end <= '2026-11-13T12:30:00.000Z'); // ends by 18:00 IST
    assert.ok(slots.at(-1).end > '2026-11-13T11:30:00.000Z'); // and runs into the late afternoon IST
  });

  it('business hours follow IST', () => {
    const biz = { settings: { automation: { timezone: 'Asia/Kolkata', businessHours: { start: '09:00', end: '18:00', days: ['mon', 'tue', 'wed', 'thu', 'fri'] } } } };
    assert.equal(BH.isWithinBusinessHours(biz, new Date('2026-11-12T04:00:00Z')), true);  // Thu 09:30 IST
    assert.equal(BH.isWithinBusinessHours(biz, new Date('2026-11-12T13:00:00Z')), false); // Thu 18:30 IST
    const wait = BH.msUntilNextBusinessWindow(biz, new Date('2026-11-12T13:00:00Z'));
    assert.equal(new Date(Date.parse('2026-11-12T13:00:00Z') + wait).toISOString(), '2026-11-13T03:30:00.000Z'); // Fri 09:00 IST
  });

  it('a daily 09:00 schedule fires at 09:00 IST', () => {
    assert.equal(SE.shouldRunSchedule({ scheduleType: 'daily', time: '09:00' }, null, new Date('2026-11-12T03:30:00Z')), true);
    assert.equal(SE.shouldRunSchedule({ scheduleType: 'daily', time: '09:00' }, null, new Date('2026-11-12T09:00:00Z')), false);
    assert.equal(SE.matchesCronExpression('30 15 * * *', new Date('2026-11-12T10:00:00Z')), true);
  });
});
