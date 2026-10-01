/**
 * Meeting automations: every setting in the meeting setup does what it says.
 *
 * Run: node --test tests/meetings-automation.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stageKeyFromRules, MEETING_STAGE_OPTIONS } from '../lib/meetings/leadStage.js';
import { formatStartsIn, buildReminderSchedule, DEFAULT_WHATSAPP_REMINDER, DEFAULT_EMAIL_REMINDER } from '../lib/meetings/constants.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('lead stage on booking', () => {
  it('accepts keys, labels and legacy statuses; ignores junk', () => {
    assert.equal(stageKeyFromRules({ leadStatusOnBook: 'qualified' }), 'qualified');
    assert.equal(stageKeyFromRules({ leadStatusOnBook: 'Qualified' }), 'qualified');
    assert.equal(stageKeyFromRules({ leadStatusOnBook: 'Interested' }), 'nurturing');
    assert.equal(stageKeyFromRules({ leadStatusOnBook: 'demo scheduled' }), 'qualified');
    assert.equal(stageKeyFromRules({ leadStatusOnBook: '', pipelineStageOnBook: 'Contacted' }), 'contacted');
    assert.equal(stageKeyFromRules({ leadStatusOnBook: 'hot prospect!!' }), null);
    assert.equal(stageKeyFromRules({}), null);
    assert.ok(MEETING_STAGE_OPTIONS.some((s) => s.key === 'qualified'));
  });
});

describe('reminder timing', () => {
  it('formats "starts in" for people, not minutes', () => {
    assert.deepEqual([1440, 2880, 180, 60, 30, 15].map(formatStartsIn), ['1 day', '2 days', '3 hours', '1 hour', '30 minutes', '15 minutes']);
    assert.match(DEFAULT_WHATSAPP_REMINDER, /starts in \{\{startsIn\}\}/);
    assert.match(DEFAULT_EMAIL_REMINDER, /starts in \{\{startsIn\}\}/);
  });

  it('builds the schedule from the chosen times, keeping tailored default wording', () => {
    const s = buildReminderSchedule([30, 1440, 60, 1440, 0, 'x']);
    assert.deepEqual(s.map((x) => x.minutesBefore), [1440, 60, 30]);
    assert.ok(s[0].whatsappMessageTemplate, '24 h step keeps its own text');
    assert.equal(s[2].label, '30 minutes before');
  });
});

describe('booking → CRM', () => {
  const sync = read('lib/meetings/crmSync.js');

  it('uses the validated stage and never moves converted leads', () => {
    assert.match(sync, /const stageOnBook = stageKeyFromRules\(rules\);/);
    assert.match(sync, /status: stageOnBook \|\| 'nurturing'/);
    assert.match(sync, /if \(stageOnBook && lead\.status !== 'converted'\) updates\.status = stageOnBook;/);
  });

  it('creates an outcome task for the host and respects the automations switch', () => {
    assert.match(sync, /meetingBookingId: booking\._id,/);
    assert.match(sync, /Update meeting outcome/);
    assert.match(sync, /if \(rules\.triggerAutomationOnBook !== false\) \{/);
    assert.doesNotMatch(sync, /Pipeline stage: \$\{/, 'the misleading pipeline-stage task is gone');
  });
});

describe('reminders', () => {
  const rem = read('lib/meetings/reminders.js');

  it('sends a booking\'s own messages immediately and claims each reminder once', () => {
    assert.match(rem, /await processPendingReminders\(20, \{ bookingId: booking\._id \}\);/);
    assert.match(rem, /export async function processPendingReminders\(limit = 50, \{ bookingId \} = \{\}\)/);
    assert.match(rem, /\$set: \{ status: 'processing', claimedAt: new Date\(\) \}/);
    assert.match(read('models/meetings/MeetingReminder.js'), /enum: \['pending', 'processing', 'sent', 'failed', 'cancelled'\]/);
  });

  it('no-show recovery sends now, can use a template, and can be switched off', () => {
    assert.match(rem, /if \(rules\.noShowRecovery === false\) return booking;/);
    assert.match(rem, /templateName: rules\.noShowRecoveryTemplateName \|\| null,/);
    assert.match(rem, /await processPendingReminders\(5, \{ bookingId: booking\._id \}\);/);
    assert.match(rem, /reminder\.type === 'no_show_recovery' \? vars\.rebookLink : vars\.meetingLink/);
  });

  it('skips pre-meeting reminders once the outcome is recorded', () => {
    assert.match(rem, /reminder\.type === 'reminder' && meetingOver/);
  });
});

describe('outcomes', () => {
  const route = read('app/api/automation/meetings/bookings/[id]/route.js');

  it('fires meeting_completed / meeting_no_show automations and closes the outcome task', () => {
    assert.match(route, /dispatchOutcome\(booking, 'meeting_no_show'\)/);
    assert.match(route, /dispatchOutcome\(updated, 'meeting_completed'\)/);
    assert.match(route, /meetingBookingId: booking\._id, status: 'pending'/);
  });

  it('recording the same outcome twice does nothing new', () => {
    assert.match(route, /const repeatOutcome = OUTCOME_STATUSES\.includes\(body\.status\) && booking\.status === body\.status;/);
    assert.match(route, /if \(repeatOutcome\) return NextResponse\.json/);
  });

  it('"Meeting no-show" is a real automation trigger', () => {
    const hub = read('lib/automation/triggerHub.js');
    assert.match(hub, /meeting_no_show: 'onStatusChange'/);
    assert.match(hub, /meeting_no_show: 'meeting_no_show'/);
    assert.match(read('lib/sequences/constants.js'), /triggerKey: 'meeting_no_show'/);
    assert.match(read('models/automation/AutomationSequence.js'), /'meeting_no_show'/);
  });
});

describe('setup + dashboard UI', () => {
  it('the setup wizard uses the new automation step and can edit existing meeting types', () => {
    assert.match(read('app/automation/components/meetings/CreateMeetingWizard.jsx'), /<MeetingAutomationStep draft=\{draft\} onChange=\{onChange\} \/>/);
    const hook = read('app/automation/hooks/useMeetingsWorkspace.js');
    assert.match(hook, /const startEdit = \(meetingType\) =>/);
    assert.match(hook, /method: 'PATCH'/);
    const step = read('app/automation/components/meetings/MeetingAutomationStep.jsx');
    for (const k of ['whatsappConfirmationTemplateName', 'whatsappReminderTemplateName', 'noShowRecoveryTemplateName', 'reminderSchedule', 'leadStatusOnBook']) {
      assert.ok(step.includes(k), k);
    }
  });

  it('the dashboard lists meetings awaiting an outcome', () => {
    assert.match(read('lib/meetings/bookingEngine.js'), /awaitingOutcome,/);
    assert.match(read('app/automation/components/meetings/MeetingsDashboard.jsx'), /Awaiting outcome/);
  });
});
