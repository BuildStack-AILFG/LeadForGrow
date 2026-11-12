import mongoose from 'mongoose';

/**
 * Durable delayed job (see lib/jobs/scheduler.js). Replaces in-memory setTimeout and
 * worker-only BullMQ delays, which never fire on serverless (Vercel) — a sequence step
 * "in 3 days" is a row here, picked up by the scheduler tick when it is due.
 */
const ScheduledJobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },          // 'workflow-node' | 'sequence-step' | 'email-auto-reply' | 'lead-trigger'
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    runAt: { type: Date, required: true },
    claimedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    failedAt: { type: Date, default: null },
    dedupeKey: { type: String },                      // unique when set: the same logical job is scheduled once
  },
  { timestamps: true }
);

ScheduledJobSchema.index({ failedAt: 1, runAt: 1 });
ScheduledJobSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
// Failed jobs are kept 30 days for debugging, then removed.
ScheduledJobSchema.index({ failedAt: 1 }, { expireAfterSeconds: 30 * 86400, partialFilterExpression: { failedAt: { $type: 'date' } } });

export default mongoose.models.ScheduledJob || mongoose.model('ScheduledJob', ScheduledJobSchema);
