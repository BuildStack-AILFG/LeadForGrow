import mongoose from 'mongoose';

const MeetingReminderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MeetingBooking',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'email', 'internal'],
      required: true,
    },
    type: {
      type: String,
      enum: ['confirmation', 'reminder', 'follow_up', 'no_show_recovery', 'rebook'],
      required: true,
    },
    scheduledFor: { type: Date, required: true, index: true },
    status: {
      type: String,
      // 'processing' = claimed by one sender (cron or booking request) so the
      // same reminder can't be sent twice when both run at once.
      enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'],
      default: 'pending',
    },
    claimedAt: { type: Date },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    sentAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

MeetingReminderSchema.index({ status: 1, scheduledFor: 1 });

if (mongoose.models.MeetingReminder) {
  delete mongoose.models.MeetingReminder;
}

export default mongoose.model('MeetingReminder', MeetingReminderSchema);
