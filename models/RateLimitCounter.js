import mongoose from 'mongoose';

/**
 * Fixed-window request counters used by lib/rateLimit.js when Redis isn't configured.
 * One document per (bucket, client, window), e.g. "login:203.0.113.7:29634512".
 * Incremented atomically, so the limit holds across every serverless instance;
 * expired by the TTL index shortly after the window closes.
 */
const RateLimitCounterSchema = new mongoose.Schema(
  {
    _id: { type: String },
    count: { type: Number, default: 0 },
    expireAt: { type: Date, required: true },
  },
  { versionKey: false }
);

RateLimitCounterSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimitCounter || mongoose.model('RateLimitCounter', RateLimitCounterSchema);
