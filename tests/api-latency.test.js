/**
 * API latency: fewer database round trips per request, and functions next to
 * the database.
 *
 * - Functions run in Mumbai (bom1), where the MongoDB cluster lives (AWS
 *   ap-south-1); they used to run in Washington (iad1), ~200 ms per query.
 * - Auth: plan lookup cached briefly; user + business read in parallel.
 * - Dashboard, Reports, Leads list, Lead detail, Companies: independent reads
 *   in one parallel batch instead of one after another.
 * - Reports revenue card counts leads in MongoDB instead of downloading them.
 * - Company list stats: grouped in MongoDB instead of every contact/deal.
 *
 * Run: node --test tests/api-latency.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import mongoose from 'mongoose';

register(new URL('../scripts/test-alias-hooks.mjs', import.meta.url));
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const { revenueStatsFromArray, bucketStatusCounts } = await import('../lib/crm/revenueMetricStats.js');

describe('deployment region', () => {
  it('runs functions in Mumbai, next to the database', () => {
    const cfg = JSON.parse(read('vercel.json'));
    assert.deepEqual(cfg.regions, ['bom1']);
  });
});

describe('auth round trips', () => {
  const auth = read('lib/auth.js');

  it('caches the plan lookup briefly and can invalidate it', () => {
    assert.match(auth, /PLAN_CACHE_TTL_MS = 15 \* 1000/);
    assert.match(auth, /export function invalidateBusinessPlanCache/);
    assert.match(read('app/api/business/activate-trial/route.js'), /invalidateBusinessPlanCache\(business\._id\)/);
  });

  it('reads user and business together but keeps the tenant check', () => {
    assert.match(auth, /await Promise\.all\(\[\s*User\.findById\(req\.user\.userId\)/);
    assert.match(auth, /String\(guessedBusiness\._id\) === String\(user\.businessId\)/);
    assert.match(auth, /Tenant mismatch/);
  });

  it('/me reads role permissions alongside the tenant and escapes the role', () => {
    const me = read('app/api/auth/me/route.js');
    assert.match(me, /Promise\.all\(\[\s*resolveTenant\(req\),\s*findRolePerm\(req\.user\.role\)/);
    assert.match(me, /replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\]\\\\\]\/g/);
  });
});

describe('parallel reads', () => {
  it('reports: no query waits for another', () => {
    const src = read('app/api/automation/reports/route.js');
    assert.doesNotMatch(src, /= await Lead\./);
    assert.match(src, /\] = await Promise\.all\(\[/);
  });

  it('dashboard: pipeline and meeting count are in the main batch', () => {
    const src = read('app/api/automation/dashboard/route.js');
    assert.doesNotMatch(src, /await ensureDefaultPipeline/);
    assert.doesNotMatch(src, /= await MeetingBooking\.countDocuments/);
  });

  it('leads list: deal amounts, follow-ups and messages in one batch', () => {
    const src = read('app/api/automation/leads/route.js');
    assert.match(src, /\[dealAmounts, withFollowUps, convs\] = await Promise\.all/);
    assert.doesNotMatch(src, /enrichedLeads = await enrichLeadsWithNextFollowUp/);
  });

  it('lead detail: history, deal, messages and follow-up in one batch', () => {
    const src = read('app/api/automation/leads/[id]/route.js');
    assert.match(src, /\[activities, deal, newestMessages, \[enrichedLead\]\] = await Promise\.all/);
  });

  it('companies: page and total counted together', () => {
    const src = read('app/api/automation/companies/route.js');
    assert.match(src, /\[companies, total\] = await Promise\.all/);
  });
});

// The original in-memory logic of /api/business/revenue-metric, before the change.
function legacyRevenueNumbers(leads, slaMinutes, now) {
  const won = leads.filter((l) => l.status === 'converted' || String(l.status).toLowerCase() === 'finalized' || String(l.status).toLowerCase() === 'won');
  const lost = leads.filter((l) => l.status === 'lost');
  const followup = leads.filter((l) => l.status === 'follow-up');
  const active = leads.filter((l) => !['converted', 'lost', 'finalized', 'won'].includes(String(l.status).toLowerCase()));
  const contacted = leads.filter((l) => l.lastContactedAt);
  const onTime = contacted.filter((l) => (new Date(l.lastContactedAt) - new Date(l.createdAt)) / 60000 <= slaMinutes);
  const sourceMetrics = {};
  leads.forEach((lead) => {
    const src = lead.source || 'Unknown';
    if (!sourceMetrics[src]) sourceMetrics[src] = { count: 0, converted: 0, lost: 0 };
    sourceMetrics[src].count++;
    if (lead.status === 'converted') sourceMetrics[src].converted++;
    if (lead.status === 'lost') sourceMetrics[src].lost++;
  });
  return {
    won: won.length, lost: lost.length, followup: followup.length, active: active.length,
    contacted: contacted.length, onTime: onTime.length, sourceMetrics,
    last7Days: leads.filter((l) => (now - new Date(l.createdAt)) / 86400000 <= 7).length,
  };
}

describe('revenue metric stats', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  let x = 11;
  const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const statuses = ['new', 'contacted', 'follow-up', 'converted', 'Won', 'FINALIZED', 'lost', 'interested', undefined, null];
  const sources = ['website', 'whatsapp', '', undefined, 'form'];
  const leads = Array.from({ length: 2000 }, () => {
    const createdAt = new Date(now - Math.floor(rnd() * 60 * 86400000));
    return {
      status: statuses[Math.floor(rnd() * statuses.length)],
      source: sources[Math.floor(rnd() * sources.length)],
      createdAt,
      lastContactedAt: rnd() < 0.5 ? new Date(createdAt.getTime() + Math.floor(rnd() * 60) * 60000) : null,
    };
  });

  it('gives the same numbers as the original in-memory logic', () => {
    const stats = revenueStatsFromArray(leads, { slaMinutes: 15, now });
    const buckets = bucketStatusCounts(stats.byStatus);
    const legacy = legacyRevenueNumbers(leads, 15, now);
    assert.equal(stats.total, leads.length);
    assert.equal(buckets.won, legacy.won);
    assert.equal(buckets.lost, legacy.lost);
    assert.equal(buckets.followup, legacy.followup);
    assert.equal(buckets.active, legacy.active);
    assert.equal(stats.contactedWithTime, legacy.contacted);
    assert.equal(stats.onTimeSLA, legacy.onTime);
    assert.equal(stats.last7Days, legacy.last7Days);
    assert.deepEqual(stats.bySource, legacy.sourceMetrics);
  });

  it('the route no longer downloads leads', () => {
    const src = read('app/api/business/revenue-metric/route.js');
    assert.doesNotMatch(src, /Lead\.find\(/);
    assert.match(src, /revenueStatsFromDb\(Lead, query/);
  });
});

describe('company list stats', async () => {
  const { enrichCompaniesWithStats } = await import('../lib/crm/companyService.js');
  const Contact = (await import('../models/automation/Contact.js')).default;
  const Deal = (await import('../models/automation/Deal.js')).default;
  const Activity = (await import('../models/automation/Activity.js')).default;

  it('builds the same stats from grouped rows', async () => {
    const a = new mongoose.Types.ObjectId();
    const b = new mongoose.Types.ObjectId();
    const contactId = new mongoose.Types.ObjectId();
    const orig = { c: Contact.aggregate, d: Deal.aggregate, a: Activity.aggregate, cf: Contact.find, df: Deal.find };
    Contact.find = Deal.find = () => { throw new Error('should not load documents'); };
    Contact.aggregate = async () => [{ _id: a, contactCount: 3, primary: { _id: contactId, firstName: 'Asha', lastName: 'Rao', jobTitle: 'CEO' } }];
    Deal.aggregate = async () => [
      { _id: { companyId: a, stage: 'negotiation' }, count: 2, amount: 300, currency: 'INR' },
      { _id: { companyId: a, stage: 'won' }, count: 1, amount: 1000, currency: 'INR' },
    ];
    Activity.aggregate = async () => [];
    try {
      const [ra, rb] = await enrichCompaniesWithStats(new mongoose.Types.ObjectId(), [{ _id: a }, { _id: b }]);
      assert.deepEqual(ra.primaryContact, { _id: contactId, name: 'Asha Rao', jobTitle: 'CEO', avatar: undefined });
      assert.equal(ra.stats.contactCount, 3);
      assert.equal(ra.stats.dealCount, 3);
      assert.equal(ra.stats.openDealCount, 2);
      assert.equal(ra.stats.pipelineValue, 300);
      assert.equal(ra.stats.totalRevenue, 1300);
      assert.equal(rb.primaryContact, null);
      assert.equal(rb.stats.dealCount, 0);
    } finally {
      Object.assign(Contact, { aggregate: orig.c, find: orig.cf });
      Object.assign(Deal, { aggregate: orig.d, find: orig.df });
      Activity.aggregate = orig.a;
    }
  });
});
