/**
 * Durable job scheduler for serverless.
 *
 * scheduleJob() stores a delayed job in MongoDB; runDueJobs() (called by the scheduler
 * tick, lib/jobs/tick.js) claims due jobs atomically and runs them. A crashed run
 * releases its claim after CLAIM_TTL so the job is retried; a job that fails
 * MAX_ATTEMPTS times is parked with failedAt (kept 30 days).
 */
import ScheduledJob from '@/models/automation/ScheduledJob';

const CLAIM_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** Job handlers, imported lazily so this module stays light. */
export const JOB_HANDLERS = {
  'workflow-node': async ({ executionId, nodeId }) => {
    const { sequenceEngine } = await import('@/lib/sequences/engine');
    await sequenceEngine.processNode(executionId, nodeId);
  },
  'sequence-step': async ({ leadId, sequenceId, stepIndex }) => {
    const { automationEngine } = await import('@/lib/automationEngine');
    await automationEngine.executeSequenceStep(leadId, sequenceId, stepIndex);
  },
  'email-auto-reply': async (payload) => {
    const { runAutoReplyJob } = await import('@/lib/emailAutoReply');
    await runAutoReplyJob(payload);
  },
  'lead-trigger': async ({ leadId, trigger }) => {
    const Lead = (await import('@/models/automation/Lead')).default;
    const { automationEngine } = await import('@/lib/automationEngine');
    const lead = await Lead.findById(leadId);
    if (lead) await automationEngine.processLeadTrigger(lead, trigger);
  },
};

export async function scheduleJob(name, payload, delayMs = 0, { dedupeKey } = {}) {
  if (!JOB_HANDLERS[name]) throw new Error(`Unknown job ${name}`);
  const doc = { name, payload, runAt: new Date(Date.now() + Math.max(0, delayMs || 0)) };
  if (dedupeKey) doc.dedupeKey = dedupeKey;
  try {
    return await ScheduledJob.create(doc);
  } catch (err) {
    if (err?.code === 11000) return null; // already scheduled
    throw err;
  }
}

/** Atomically claim one due job (or one whose previous claim went stale). */
async function claimNext(now) {
  return ScheduledJob.findOneAndUpdate(
    {
      failedAt: null,
      runAt: { $lte: now },
      $or: [{ claimedAt: null }, { claimedAt: { $lt: new Date(now.getTime() - CLAIM_TTL_MS) } }],
    },
    { $set: { claimedAt: now }, $inc: { attempts: 1 } },
    { sort: { runAt: 1 }, new: true }
  );
}

/**
 * Run due jobs until `limit` jobs ran or `budgetMs` elapsed.
 * @returns {{ ran: number, failed: number }}
 */
export async function runDueJobs({ limit = 50, budgetMs = 40000 } = {}) {
  const started = Date.now();
  let ran = 0;
  let failed = 0;
  while (ran + failed < limit && Date.now() - started < budgetMs) {
    const job = await claimNext(new Date());
    if (!job) break;
    try {
      await JOB_HANDLERS[job.name]?.(job.payload || {});
      await ScheduledJob.deleteOne({ _id: job._id });
      ran++;
    } catch (err) {
      failed++;
      const parked = job.attempts >= MAX_ATTEMPTS;
      await ScheduledJob.updateOne(
        { _id: job._id },
        {
          $set: {
            claimedAt: null,
            lastError: String(err?.message || err).slice(0, 500),
            ...(parked ? { failedAt: new Date() } : { runAt: new Date(Date.now() + 2 ** job.attempts * 60000) }),
          },
        }
      );
      console.error(`[Jobs] ${job.name} failed (attempt ${job.attempts}):`, err?.message || err);
    }
  }
  return { ran, failed };
}

export default { scheduleJob, runDueJobs, JOB_HANDLERS };
