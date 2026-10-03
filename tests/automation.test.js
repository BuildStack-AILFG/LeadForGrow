import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCondition, evaluateSingleCondition, getFieldValue } from '../lib/sequences/conditions.js';
import { TRIGGER_TYPES, ACTION_TYPES, CONDITION_OPERATORS, createNode } from '../lib/sequences/constants.js';
import { getAutomationSettings, isWithinBusinessHours } from '../lib/automation/businessHours.js';
import { shouldRunSchedule, matchesCronExpression } from '../lib/automation/scheduleEvaluator.js';
import { pickAbVariant, compareAbVariants, requiresApproval } from '../lib/automation/approvalGate.js';

describe('Workflow conditions', () => {
  const lead = {
    name: 'Alice',
    status: 'new',
    email: 'alice@test.com',
    tags: ['vip', 'nurture'],
    metadata: { score: 85 },
    industry: 'SaaS',
    source: 'website',
  };

  it('evaluates equals operator', () => {
    assert.equal(evaluateSingleCondition({ field: 'status', operator: 'equals', value: 'new' }, lead), true);
    assert.equal(evaluateSingleCondition({ field: 'status', operator: 'equals', value: 'lost' }, lead), false);
  });

  it('evaluates score comparisons', () => {
    assert.equal(evaluateSingleCondition({ field: 'score', operator: 'gte', value: '70' }, lead), true);
    assert.equal(evaluateSingleCondition({ field: 'score', operator: 'lt', value: '50' }, lead), false);
  });

  it('evaluates contains on strings', () => {
    assert.equal(evaluateSingleCondition({ field: 'email', operator: 'contains', value: 'test' }, lead), true);
  });

  it('evaluates empty / not_empty', () => {
    assert.equal(evaluateSingleCondition({ field: 'phone', operator: 'empty' }, lead), true);
    assert.equal(evaluateSingleCondition({ field: 'email', operator: 'not_empty' }, lead), true);
  });

  it('evaluates AND/OR condition groups', () => {
    const andPass = evaluateCondition({
      logic: 'and',
      conditions: [
        { field: 'status', operator: 'equals', value: 'new' },
        { field: 'score', operator: 'gte', value: '80' },
      ],
    }, lead);
    assert.equal(andPass, true);

    const orPass = evaluateCondition({
      logic: 'or',
      conditions: [
        { field: 'status', operator: 'equals', value: 'lost' },
        { field: 'score', operator: 'gte', value: '80' },
      ],
    }, lead);
    assert.equal(orPass, true);
  });

  it('resolves field values from lead', () => {
    assert.equal(getFieldValue('score', lead), 85);
    assert.equal(getFieldValue('industry', lead), 'SaaS');
  });
});

describe('Workflow constants', () => {
  it('defines comprehensive trigger catalog', () => {
    assert.ok(TRIGGER_TYPES.length >= 30);
    assert.ok(TRIGGER_TYPES.some((t) => t.triggerKey === 'deal_won'));
    assert.ok(TRIGGER_TYPES.some((t) => t.triggerKey === 'email_opened'));
  });

  it('defines CRM and communication actions', () => {
    assert.ok(ACTION_TYPES.some((a) => a.type === 'create_deal'));
    assert.ok(ACTION_TYPES.some((a) => a.type === 'wait_reply'));
    assert.ok(ACTION_TYPES.some((a) => a.type === 'http_request'));
  });

  it('creates nodes with defaults', () => {
    const node = createNode('send_whatsapp', { x: 100, y: 200 });
    assert.equal(node.type, 'send_whatsapp');
    assert.ok(node.data.message);
    assert.equal(node.position.x, 100);
  });

  it('defines advanced flow control nodes', () => {
    assert.ok(ACTION_TYPES.some((a) => a.type === 'parallel_branch'));
    assert.ok(ACTION_TYPES.some((a) => a.type === 'loop'));
    assert.ok(ACTION_TYPES.some((a) => a.type === 'approval'));
    assert.ok(ACTION_TYPES.some((a) => a.type === 'sub_workflow'));
  });

  it('defines condition operators', () => {
    assert.ok(CONDITION_OPERATORS.some((o) => o.id === 'starts_with'));
    assert.ok(CONDITION_OPERATORS.some((o) => o.id === 'not_empty'));
  });
});

describe('Business hours', () => {
  it('returns default automation settings', () => {
    const settings = getAutomationSettings({});
    assert.equal(settings.timezone, 'Asia/Kolkata');
    assert.ok(settings.businessHours.days.includes('mon'));
  });

  it('checks business hours window', () => {
    const business = { settings: { automation: { businessHours: { start: '09:00', end: '18:00', days: ['mon'] } } } };
    const monday10am = new Date('2026-06-22T10:00:00');
    assert.equal(isWithinBusinessHours(business, monday10am), true);
    const monday8am = new Date('2026-06-22T08:00:00');
    assert.equal(isWithinBusinessHours(business, monday8am), false);
  });
});

describe('Schedule evaluator', () => {
  it('matches cron expressions', () => {
    const date = new Date('2026-06-22T09:30:00');
    assert.equal(matchesCronExpression('30 9 * * 1', date), true);
    assert.equal(matchesCronExpression('0 8 * * 1', date), false);
  });

  it('evaluates interval schedules', () => {
    const now = new Date();
    const last = new Date(now.getTime() - 31 * 60000);
    assert.equal(shouldRunSchedule({ scheduleType: 'minutes', intervalMinutes: 30 }, last, now), true);
  });
});

describe('A/B testing', () => {
  it('picks a variant by weight', () => {
    const seq = {
      abTest: {
        enabled: true,
        variants: [
          { id: 'a', name: 'A', weight: 100, nodes: [{ id: 'n1' }], edges: [] },
          { id: 'b', name: 'B', weight: 0, nodes: [{ id: 'n2' }], edges: [] },
        ],
      },
      nodes: [],
      edges: [],
    };
    // A 0% variant must never be picked (it used to get ~1% of sends).
    for (let i = 0; i < 2000; i += 1) assert.equal(pickAbVariant(seq).variantId, 'a');
  });

  it('treats a missing weight as 1 and splits traffic roughly by weight', () => {
    const seq = { abTest: { enabled: true, variants: [{ id: 'a', weight: 3 }, { id: 'b' }] }, nodes: [], edges: [] };
    let a = 0;
    for (let i = 0; i < 4000; i += 1) if (pickAbVariant(seq).variantId === 'a') a += 1;
    assert.ok(a > 2700 && a < 3300, 'about 75% for weight 3 vs 1');
  });

  it('compares variant performance', () => {
    const result = compareAbVariants([
      { variantId: 'a', name: 'A', enrolled: 100, sent: 80, replies: 40, conversions: 20, revenue: 5000 },
      { variantId: 'b', name: 'B', enrolled: 100, sent: 80, replies: 20, conversions: 10, revenue: 2000 },
    ]);
    assert.ok(result.winner);
    assert.ok(result.liftPercent > 0);
  });
});

describe('Approval gates', () => {
  it('requires approval when enabled', () => {
    const business = { settings: { automation: { approvalRules: { requireApproval: true, channels: ['whatsapp'] } } } };
    const node = { type: 'send_whatsapp', data: {} };
    assert.ok(requiresApproval(node, business, {}));
  });
});

describe('Trigger catalog', () => {
  it('includes instagram, webhook, and recurring triggers', () => {
    assert.ok(TRIGGER_TYPES.some((t) => t.triggerKey === 'instagram_dm'));
    assert.ok(TRIGGER_TYPES.some((t) => t.triggerKey === 'webhook'));
    assert.ok(TRIGGER_TYPES.some((t) => t.triggerKey === 'recurring'));
    assert.ok(TRIGGER_TYPES.some((t) => t.triggerKey === 'no_reply'));
  });
});
