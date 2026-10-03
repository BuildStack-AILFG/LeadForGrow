import mongoose from 'mongoose';

/**
 * Audit trail: every thing done about a leak, by a person or the system.
 * The idempotency key makes a double tap (or a retried request) record once.
 */
const LeakActionSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    flagId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeakFlag', required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    actionType: {
      type: String,
      enum: ['message_sent', 'task_created', 'reassigned', 'worked_outside', 'snoozed', 'marked_unqualified', 'dismissed'],
      required: true,
    },
    actorType: { type: String, enum: ['user', 'system'], default: 'user' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalMessageId: { type: String },
    note: { type: String, maxlength: 500 },
    meta: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['queued', 'sent', 'failed', 'skipped', 'done'], default: 'done' },
    error: { type: String },
    idempotencyKey: { type: String, required: true },
  },
  { timestamps: true }
);

LeakActionSchema.index({ idempotencyKey: 1 }, { unique: true });
LeakActionSchema.index({ businessId: 1, flagId: 1 });
LeakActionSchema.index({ businessId: 1, createdAt: -1 });

export default mongoose.models.LeakAction || mongoose.model('LeakAction', LeakActionSchema);
