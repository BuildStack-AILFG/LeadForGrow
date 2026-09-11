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

/**
 * Push an automation task to the queue
 */
export async function queueAutomation(lead, trigger) {
    if (!automationQueue) {
        console.log(`[Queue] FALLBACK: Executing automation synchronously for lead ${lead._id} (No Redis configured)`);
        try {
            const { automationEngine } = await import('./automationEngine');
            // Execute in background (don't await) to simulate async behavior and prevent blocking ingest
            automationEngine.processLeadTrigger(lead, trigger).catch(err => {
                console.error('[Queue] Sync Fallback Error:', err);
            });
        } catch (err) {
            console.error('[Queue] Failed to import automationEngine for fallback:', err);
        }
        return;
    }

    try {
        await automationQueue.add('lead-trigger', {
            leadId: lead._id,
            trigger,
            timestamp: new Date(),
        });
        console.log(`[Queue] Added automation job for lead ${lead._id} (Trigger: ${trigger})`);
    } catch (error) {
        console.error('[Queue] Failed to add job to queue:', error);
    }
}

/**
 * Queue a specific step in an automation sequence with a delay
 */
export async function queueAutomationStep(lead, sequenceId, stepIndex, delayMs) {
    if (!automationQueue) {
        console.log(`[Queue] Fallback for sequence step ${stepIndex} (No Redis)`);
        if (delayMs > 0) {
            setTimeout(async () => {
                try {
                    const { automationEngine } = await import('./automationEngine');
                    await automationEngine.executeSequenceStep(lead._id || lead, sequenceId, stepIndex);
                } catch (err) {
                    console.error('[Queue] Sync sequence step fallback error:', err);
                }
            }, delayMs);
        } else {
            try {
                const { automationEngine } = await import('./automationEngine');
                automationEngine.executeSequenceStep(lead._id || lead, sequenceId, stepIndex).catch(console.error);
            } catch (err) {
                console.error('[Queue] Sync sequence step fallback error:', err);
            }
        }
        return;
    }

    try {
        await automationQueue.add('sequence-step', {
            leadId: lead._id,
            sequenceId,
            stepIndex,
            timestamp: new Date()
        }, {
            delay: delayMs
        });
        console.log(`[Queue] Queued sequence step ${stepIndex} for lead ${lead._id} in ${delayMs}ms`);
    } catch (error) {
        console.error('[Queue] Failed to queue sequence step:', error);
    }
}

/**
 * Queue a workflow graph node execution (sequences engine)
 */
export async function queueWorkflowNode(executionId, nodeId, delayMs = 0) {
    const run = async () => {
        try {
            const { sequenceEngine } = await import('./sequences/engine');
            await sequenceEngine.processNode(executionId, nodeId);
        } catch (err) {
            console.error('[Queue] Workflow node execution error:', err);
        }
    };

    if (!automationQueue) {
        console.log(`[Queue] Fallback workflow node ${nodeId} in ${delayMs}ms (No Redis)`);
        if (delayMs > 0) setTimeout(run, delayMs);
        else run();
        return;
    }

    try {
        await automationQueue.add('workflow-node', {
            executionId,
            nodeId,
            timestamp: new Date(),
        }, { delay: delayMs });
        console.log(`[Queue] Queued workflow node ${nodeId} for execution ${executionId} in ${delayMs}ms`);
    } catch (error) {
        console.error('[Queue] Failed to queue workflow node:', error);
        if (delayMs > 0) setTimeout(run, delayMs);
        else run();
    }
}

/**
 * Enqueue a delayed email auto-reply job (SLA safety net).
 * Falls back to setTimeout if Redis is unavailable — acceptable degradation
 * because the auto-reply is itself a soft safety net; missing one during a
 * Redis outage is fine, and the timer survives inside the same pod.
 */
export async function enqueueEmailAutoReply(payload, delayMs) {
    const run = async () => {
        try {
            const { runAutoReplyJob } = await import('./emailAutoReply');
            const result = await runAutoReplyJob(payload);
            console.log(`[Queue] email-auto-reply for conv ${payload.conversationId} → ${result.status}`);
        } catch (err) {
            console.error('[Queue] email-auto-reply run failed:', err);
        }
    };

    if (!automationQueue) {
        console.log(`[Queue] Fallback email-auto-reply in ${delayMs}ms (No Redis)`);
        setTimeout(run, delayMs);
        return;
    }

    try {
        await automationQueue.add('email-auto-reply', payload, {
            delay: delayMs,
            // Deduplicate by conversation — if two inbounds arrive back-to-back,
            // we don't want two parallel safety-net timers competing.
            jobId: `auto-reply-${payload.conversationId}-${payload.triggerMessageId}`,
        });
    } catch (error) {
        console.error('[Queue] Failed to queue email-auto-reply:', error);
        setTimeout(run, delayMs);
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
