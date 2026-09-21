import mongoose from 'mongoose';

/**
 * Short-lived buffer of realtime events, read by the polling transport
 * (/api/realtime/poll). Replaces the held-open SSE connection — clients poll
 * for events newer than their last-seen timestamp instead of keeping a
 * serverless function open (which burned Fluid CPU/memory on Vercel).
 *
 * TTL auto-expires rows a couple of minutes after creation so the collection
 * stays tiny; the poll window is only a few seconds.
 */
const RealtimeEventSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  ts: { type: Number, required: true }, // ms epoch — clients page on this
  createdAt: { type: Date, default: Date.now, expires: 120 }, // TTL 2 min
}, { minimize: false });

RealtimeEventSchema.index({ businessId: 1, ts: 1 });

export default mongoose.models.RealtimeEvent || mongoose.model('RealtimeEvent', RealtimeEventSchema);
