/**
 * Dashboard lead metrics now come from compact stats (computed in MongoDB in production)
 * instead of every lead document. These tests pin the new builders to the original
 * implementation (tests/fixtures/dashboardMetricsLegacy.js, copied from before the change).
 *
 * Run: node --test tests/dashboard-lead-stats.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
const current = await import('../lib/crm/dashboardMetrics.js');
const legacy = await import('./fixtures/dashboardMetricsLegacy.js');
const { leadStatsFromArray, statWindows, RETENTION_MONTHS } = await import('../lib/crm/leadStats.js');

// Deterministic pseudo-random leads spread over ~9 months, every status/source/priority.
function makeLeads(count, seed = 7) {
  let x = seed;
  const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const statuses = ['new', 'new_lead', 'contacted', 'qualified', 'interested', 'demo_scheduled', 'negotiation', 'lost', 'won', 'converted', undefined];
  // Unequal weights so source ranking has no ties (tie order is the one intended change).
  const sources = ['website', 'website', 'website', 'website', 'whatsapp', 'whatsapp', 'whatsapp', 'form', 'form', 'call', undefined];
  const priorities = ['urgent', 'high', 'medium', 'low', undefined, 'none'];
  const now = Date.now();
  return Array.from({ length: count }, () => {
    const received = new Date(now - Math.floor(rnd() * 280 * 86400000));
    const status = statuses[Math.floor(rnd() * statuses.length)];
    const updated = new Date(received.getTime() + Math.floor(rnd() * 40 * 86400000));
    const convertedAt = rnd() < 0.5 ? new Date(received.getTime() + Math.floor(rnd() * 30 * 86400000)) : undefined;
    return {
      status,
      source: sources[Math.floor(rnd() * sources.length)],
      priority: priorities[Math.floor(rnd() * priorities.length)],
      receivedAt: received,
      updatedAt: updated,
      convertedAt,
    };
  });
}

const leads = makeLeads(3000);

describe('dashboard lead metrics', () => {
  it('hero KPIs match the original implementation', () => {
    const deals = [];
    const revenue = { conversionRate: undefined, openCount: 0, pipelineRevenue: 0 };
    assert.deepEqual(current.buildHeroKpis(leads, deals, revenue), legacy.buildHeroKpis(leads, deals, revenue));
  });

  it('leads management matches the original implementation', () => {
    assert.deepEqual(current.buildLeadsManagement(leads), legacy.buildLeadsManagement(leads));
  });

  it('retention matches the original implementation', () => {
    assert.deepEqual(current.buildRetentionData(leads), legacy.buildRetentionData(leads));
  });

  it('builders give the same result from an array and from precomputed stats', () => {
    const stats = leadStatsFromArray(leads);
    assert.deepEqual(current.buildHeroKpis(stats, [], {}), current.buildHeroKpis(leads, [], {}));
    assert.deepEqual(current.buildLeadsManagement(stats), current.buildLeadsManagement(leads));
    assert.deepEqual(current.buildRetentionData(stats), current.buildRetentionData(leads));
  });

  it('empty CRM gives zeros, not NaN', () => {
    const hero = current.buildHeroKpis([], [], {});
    assert.equal(hero.leads.value, 0);
    assert.equal(hero.avgSalesCycle.value, 0);
    assert.equal(current.buildRetentionData([]).rate, 0);
  });

  it('retention windows: 7 months, oldest first, contiguous', () => {
    const { monthStarts } = statWindows(new Date(2026, 9, 3));
    assert.equal(monthStarts.length, RETENTION_MONTHS + 1);
    assert.deepEqual(monthStarts[0], new Date(2026, 3, 1));
    assert.deepEqual(monthStarts[RETENTION_MONTHS], new Date(2026, 10, 1));
  });

  it('the dashboard route aggregates in MongoDB instead of loading every lead', () => {
    const route = readFileSync(new URL('../app/api/automation/dashboard/route.js', import.meta.url), 'utf8');
    assert.match(route, /leadStatsFromDb\(Lead, \{ businessId: toObjectId\(businessId\), archived: false \}\)/);
    assert.doesNotMatch(route, /Lead\.find\(\{ businessId, archived: false \}\)\s*\.select\('status source/);
  });
});
