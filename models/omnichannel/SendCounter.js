import mongoose from 'mongoose';

/**
 * Fixed-window counters for automated Instagram/Facebook sends, one document per
 * (business, channel, kind, window, key) — e.g. key "2026-09-19T14" for the 14:00
 * hour. Incremented atomically by lib/social/sendSafety.js and expired by TTL.
 */
const SendCounterSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  channel: { type: String, enum: ['instagram', 'facebook'], required: true },
  kind: { type: String, enum: ['dm', 'reply'], required: true }, // dm = private/DM, reply = public comment reply
  window: { type: String, enum: ['h', 'd'], required: true },   // hour | day
  key: { type: String, required: true },
  count: { type: Number, default: 0 },
  expireAt: { type: Date, required: true },
});

SendCounterSchema.index({ businessId: 1, channel: 1, kind: 1, window: 1, key: 1 }, { unique: true });
SendCounterSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.SendCounter || mongoose.model('SendCounter', SendCounterSchema);
