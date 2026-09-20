import mongoose from 'mongoose';

/**
 * Per (business, channel) ban-safety state for automated Instagram/Facebook sends.
 * Kept out of the Business document on purpose: it changes on every send burst and
 * shouldn't bump that heavily-read document. See lib/social/sendSafety.js.
 */
const SendSafetyStateSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  channel: { type: String, enum: ['instagram', 'facebook'], required: true },

  // When automated sending started (or restarted after a block). Drives the warm-up ramp.
  automationStartedAt: { type: Date },

  // Set when the platform blocks the account from messaging; automated sends pause until then.
  blockedUntil: { type: Date },

  // Support override: 1 = default limits, 2 = double, 0.5 = half.
  limitMultiplier: { type: Number, default: 1, min: 0.1, max: 20 },

  // Most recent problem worth telling the user about (block, expired token, missing permission).
  lastIssue: {
    kind: { type: String },
    code: { type: Number },
    subcode: { type: Number },
    message: { type: String },
    at: { type: Date },
    notifiedAt: { type: Date },
  },

  // Sends we skipped today because a safety limit was hit.
  throttled: {
    day: { type: String },
    count: { type: Number, default: 0 },
  },
}, { timestamps: true });

SendSafetyStateSchema.index({ businessId: 1, channel: 1 }, { unique: true });

export default mongoose.models.SendSafetyState || mongoose.model('SendSafetyState', SendSafetyStateSchema);
