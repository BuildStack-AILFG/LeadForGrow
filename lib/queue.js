import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

let connection = null;
export let automationQueue = null;

if (REDIS_URL) {
    console.log('[Queue] Initializing Redis connection...');
    connection = new IORedis(REDIS_URL, {
        // BullMQ Workers REQUIRE maxRetriesPerRequest to be null — this is
        // a hard rule from BullMQ (throws on init otherwise). Job-level
        // retries are handled by the `attempts` + `backoff` config below.
        maxRetriesPerRequest: null,
        connectTimeout: 2000,
        retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying
            return Math.min(times * 100, 1000);
        }
    });

    connection.on('error', (err) => {
        console.error('[Queue] Redis connection error:', err.message);
        // Ensure the queue doesn't hang the app if Redis is unreachable
        if (automationQueue) {
            console.warn('[Queue] Disabling Redis queue due to connection failure.');
            automationQueue = null;
        }
    });

    // 1. Automation Queue
    automationQueue = new Queue('automation-queue', {
        connection,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        },
    });
} else {
    console.warn('[Queue] REDIS_URL not found. Background automations are DISABLED.');
}

const WORKER_HEARTBEAT_KEY = 'lfg:automation-worker:heartbeat';
let workerAliveCache = { at: 0, alive: false };

/**
 * Is a BullMQ worker process actually consuming the queue? Workers write a heartbeat
 * every 30 s (see initializeWorker). On Vercel there is normally no worker, so jobs pushed
 * to Redis would sit there forever — when no heartbeat is seen, work runs in-process
 * (immediate jobs) or through the durable scheduler (delayed jobs, lib/jobs/scheduler.js).
 */
export async function isWorkerAlive() {
    if (!automationQueue || !connection) return false;
    if (Date.now() - workerAliveCache.at < 30000) return workerAliveCache.alive;
    let alive = false;
    try {
        const v = await Promise.race([
            connection.get(WORKER_HEARTBEAT_KEY),
            new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
        alive = !!v && Date.now() - Number(v) < 90000;
    } catch {
        alive = false;
    }
    workerAliveCache = { at: Date.now(), alive };
    return alive;
}

async function schedule(name, payload, delayMs, opts) {
    const { scheduleJob } = await import('./jobs/scheduler');
    return scheduleJob(name, payload, delayMs, opts);
}

/**
 * Push an automation task to the queue (or run it now when no worker is alive).
 */
export async function queueAutomation(lead, trigger) {
    if (await isWorkerAlive()) {
        try {
            await automationQueue.add('lead-trigger', { leadId: lead._id, trigger, timestamp: new Date() });
            return;
        } catch (error) {
            console.error('[Queue] Failed to add job to queue, running in-process:', error.message);
        }
    }
    try {
        const { automationEngine } = await import('./automationEngine');
        await automationEngine.processLeadTrigger(lead, trigger);
    } catch (err) {
        console.error('[Queue] In-process automation error:', err);
    }
}

/**
 * Queue a specific step in an automation sequence with a delay
 */
export async function queueAutomationStep(lead, sequenceId, stepIndex, delayMs) {
    const leadId = lead?._id || lead;
    if (delayMs > 0) {
        await schedule('sequence-step', { leadId: String(leadId), sequenceId: String(sequenceId), stepIndex }, delayMs);
        return;
    }
    try {
        const { automationEngine } = await import('./automationEngine');
        await automationEngine.executeSequenceStep(leadId, sequenceId, stepIndex);
    } catch (err) {
        console.error('[Queue] Sequence step error:', err);
    }
}

/**
 * Queue a workflow graph node execution (sequences engine). Delayed nodes are stored
 * durably and run by the scheduler tick; immediate nodes run now.
 */
export async function queueWorkflowNode(executionId, nodeId, delayMs = 0) {
    if (delayMs > 0) {
        await schedule('workflow-node', { executionId: String(executionId), nodeId }, delayMs);
        return;
    }
    try {
        const { sequenceEngine } = await import('./sequences/engine');
        await sequenceEngine.processNode(executionId, nodeId);
    } catch (err) {
        console.error('[Queue] Workflow node execution error:', err);
    }
}

/**
 * Delayed email safety-net auto-reply (one per conversation + trigger message).
 */
export async function enqueueEmailAutoReply(payload, delayMs) {
    try {
        await schedule('email-auto-reply', payload, delayMs, {
            dedupeKey: `auto-reply-${payload.conversationId}-${payload.triggerMessageId}`,
        });
    } catch (error) {
        console.error('[Queue] Failed to schedule email-auto-reply:', error);
    }
}

/**
 * Failed Job Model
 */
async function logFailedJob(job, error) {
    try {
        const mongoose = (await import('mongoose')).default;
        const FailedJob = mongoose.models.FailedJob || mongoose.model('FailedJob', new mongoose.Schema({
            leadId: mongoose.Schema.Types.ObjectId,
            businessId: mongoose.Schema.Types.ObjectId,
            jobId: String,
            data: Object,
            error: String,
            attempts: Number,
            communicationType: String,
            timestamp: { type: Date, default: Date.now }
        }));

        await FailedJob.create({
            leadId: job.data.leadId,
            businessId: job.data.businessId,
            jobId: job.id,
            data: job.data,
            error: error.message,
            attempts: job.attemptsMade,
            communicationType: job.name,
        });
        console.log(`[Queue] Logged failed job ${job.id} to Dead Letter Queue`);
    } catch (err) {
        console.error('[Queue] Fatal error logging failed job:', err);
    }
}

// 2. Initialize Worker
if (REDIS_URL) {
    if (process.env.NODE_ENV === 'production' && !process.env.IS_WORKER) {
        console.log('[Queue] Worker disabled on main API instance. Ensure IS_WORKER is set on worker nodes.');
    } else {
        const initializeWorker = async () => {
            try {
                const { automationEngine } = await import('./automationEngine');
                const Lead = (await import('@/models/automation/Lead')).default;

                const worker = new Worker('automation-queue', async (job) => {
                    console.log(`[Worker] Processing job ${job.id} of type ${job.name}`);

                    if (job.name === 'lead-trigger') {
                        const { leadId, trigger } = job.data;
                        const lead = await Lead.findById(leadId);
                        if (!lead) throw new Error(`Lead ${leadId} not found`);
                        await automationEngine.processLeadTrigger(lead, trigger);
                    }

                    if (job.name === 'sequence-step') {
                        const { leadId, sequenceId, stepIndex } = job.data;
                        await automationEngine.executeSequenceStep(leadId, sequenceId, stepIndex);
                    }

                    if (job.name === 'workflow-node') {
                        const { executionId, nodeId } = job.data;
                        const { sequenceEngine } = await import('./sequences/engine');
                        await sequenceEngine.processNode(executionId, nodeId);
                    }

                    if (job.name === 'email-auto-reply') {
                        const { runAutoReplyJob } = await import('./emailAutoReply');
                        const result = await runAutoReplyJob(job.data);
                        console.log(`[Worker] email-auto-reply conv ${job.data.conversationId} → ${result.status}${result.reason ? ` (${result.reason})` : ''}`);
                    }
                }, { connection });

                worker.on('failed', async (job, err) => {
                    console.error(`[Worker] Job ${job.id} failed:`, err.message);
                    if (job.attemptsMade >= 5) {
                        await logFailedJob(job, err);
                    }
                });

                const beat = () => connection.set(WORKER_HEARTBEAT_KEY, String(Date.now()), 'EX', 90).catch(() => {});
                beat();
                setInterval(beat, 30000);
                console.log('[Worker] Automation worker started.');
            } catch (error) {
                console.error('[Worker] Initialization failed:', error);
            }
        };

        if (!global.automationWorker) {
            initializeWorker();
            global.automationWorker = true;
        }
    }
}
