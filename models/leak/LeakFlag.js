import mongoose from 'mongoose';

/**
 * One leak on one lead: "this enquiry is slipping, and why".
 *
 * Created and cleared by the scanner (lib/leak/scanner.js); moved along by the
 * team's actions (lib/leak/actions.js). One row per episode, keyed by
 * dedupeKey, so re-scans update the same flag instead of piling up copies:
 *   R1 never contacted    biz:lead:R1
 *   R2 customer waiting   biz:lead:R2:<waiting since>
 *   R3 follow-up overdue  biz:lead:R3:<due>
 *   R4 gone quiet         biz:lead:R4:<last activity>
 *   R5 lost without trying biz:lead:R5
 *
 * Holdout flags (a random share, per Business.settings.leakGuard.holdoutPct)
 * are tracked but never shown, so the ledger can compare against them.
 */
const LeakFlagSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rule: { type: String, enum: ['R1', 'R2', 'R3', 'R4', 'R5'], required: true },
    severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
    reason: { type: String, required: true },
    // What the rule saw, so the reason can be checked later.
    evidence: {
      createdAt: Date,
      firstContactAt: Date,
      awaitingReplySince: Date,
      nextFollowUpAt: Date,
      overdueTaskAt: Date,
      lastActivityAt: Date,
      attempts: Number,
    },
    // Snapshot for the list, refreshed every scan (saves a join per page view).
    lead: {
      name: String,
      phone: String,
      source: String,
      stage: String,
      channel: String,
      optedOutOfWhatsApp: Boolean,
      conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    },
    status: {
      type: String,
      enum: ['open', 'actioned', 'resolved', 'dismissed', 'expired'],
      default: 'open',
    },
    // replied | worked_outside | unqualified | not_a_leak | cleared | won | lost
    resolution: { type: String },
    resolutionNote: { type: String, maxlength: 500 },
    snoozedUntil: { type: Date, default: null },
    holdout: { type: Boolean, default: false },
    dedupeKey: { type: String, required: true },
    detectedAt: { type: Date, required: true },
    lastSeenAt: { type: Date },
    actionedAt: { type: Date },
    resolvedAt: { type: Date },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

LeakFlagSchema.index({ dedupeKey: 1 }, { unique: true });
LeakFlagSchema.index({ businessId: 1, status: 1, severity: 1, detectedAt: 1 });
LeakFlagSchema.index({ businessId: 1, assignedTo: 1, status: 1 });
LeakFlagSchema.index({ businessId: 1, leadId: 1, rule: 1, status: 1 });
LeakFlagSchema.index({ businessId: 1, detectedAt: -1 });

export default mongoose.models.LeakFlag || mongoose.model('LeakFlag', LeakFlagSchema);
