/**
 * Scheduler tick — runs everything that is due:
 *   - durable delayed jobs (sequence steps, waits, email safety-net replies)  lib/jobs/scheduler.js
 *   - WhatsApp/Instagram flow delays and reply-wait timeouts                  lib/whatsappFlows/engine.js
 *   - meeting reminders                                                         lib/meetings/reminders.js
 *   - scheduled email sends                                                     lib/omnichannel/scheduledEmailSender.js
 *
 * Who calls it: GET /api/cron/tick (GitHub Actions every 5 min, or any external scheduler)
 * and opportunistically after app traffic / webhooks (maybeTick). A global MongoDB lock
 * makes sure only one tick runs at a time and at most once per MIN_GAP, so calling it
 * often is harmless. Every task inside claims its work atomically as well.
 */
import mongoose from 'mongoose';

const MIN_GAP_MS = 50 * 1000;
const LOCK_TTL_MS = 4 * 60 * 1000;
let lastLocalAttempt = 0;

function lockCollection() {
  return mongoose.connection.db.collection('scheduler_locks');
}

/** Take the tick lock. Returns false when another tick ran recently or is running. */
async function acquireLock(now) {
  try {
    const res = await lockCollection().findOneAndUpdate(
      { _id: 'tick', $or: [{ nextAllowedAt: { $lte: now } }, { nextAllowedAt: { $exists: false } }] },
      { $set: { nextAllowedAt: new Date(now.getTime() + LOCK_TTL_MS), startedAt: now } },
      { upsert: true, returnDocument: 'after' }
    );
    return !!res;
  } catch (err) {
    if (err?.code === 11000) return false; // lock held (upsert raced an existing doc)
    throw err;
  }
}

async function releaseLock(now) {
  await lockCollection().updateOne({ _id: 'tick' }, { $set: { nextAllowedAt: new Date(now.getTime() + MIN_GAP_MS), finishedAt: new Date() } });
}

async function step(name, fn, out) {
  try {
    out[name] = await fn();
  } catch (err) {
    out[name] = { error: String(err?.message || err).slice(0, 200) };
    console.error(`[Tick] ${name} failed:`, err?.message || err);
  }
}

export async function runTick({ force = false } = {}) {
  const { dbConnect } = await import('@/lib/mongodb');
  await dbConnect();
  const startedAt = new Date();
  if (!force && !(await acquireLock(startedAt))) return { skipped: 'locked' };

  const out = {};
  try {
    await step('jobs', async () => (await import('@/lib/jobs/scheduler')).runDueJobs({ limit: 100, budgetMs: 35000 }), out);
    await step('flowDelays', async () => (await import('@/lib/whatsappFlows/engine')).resumeDueFlowDelays(100), out);
    await step('flowWaits', async () => (await import('@/lib/whatsappFlows/engine')).expireFlowWaits(100), out);
    await step('meetingReminders', async () => {
      const r = await (await import('@/lib/meetings/reminders')).processPendingReminders(100);
      return Array.isArray(r) ? r.length : r;
    }, out);
    await step('scheduledEmails', async () => {
      const r = await (await import('@/lib/omnichannel/scheduledEmailSender')).runScheduledEmailSends();
      return { claimed: r?.claimed, sent: r?.sent };
    }, out);
  } finally {
    await releaseLock(startedAt).catch(() => {});
  }
  return { ranAt: startedAt.toISOString(), durationMs: Date.now() - startedAt.getTime(), ...out };
}

/**
 * Fire-and-forget tick from busy code paths (app polling, webhooks). Cheap when not due:
 * an in-process 50 s throttle, then the shared DB lock.
 */
export function maybeTick() {
  const now = Date.now();
  if (now - lastLocalAttempt < MIN_GAP_MS) return Promise.resolve(null);
  lastLocalAttempt = now;
  return runTick().catch((err) => {
    console.error('[Tick] background tick failed:', err?.message || err);
    return null;
  });
}

/** Schedule a tick after the current response (Next.js `after`), for busy routes. */
export async function tickAfterResponse() {
  try {
    const { after } = await import('next/server');
    after(() => maybeTick());
  } catch {
    maybeTick();
  }
}

export default { runTick, maybeTick };
