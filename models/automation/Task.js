import mongoose from 'mongoose';
import { baseSchemaPlugin } from '../baseSchema.js';

const RecurrenceSchema = new mongoose.Schema(
  {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    interval: { type: Number, default: 1, min: 1 },
    endDate: Date,
    count: Number,
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', index: true },
    // Set on the 'update meeting outcome' task created for each booking, so it
    // can be closed automatically when the outcome is recorded.
    meetingBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MeetingBooking', index: { sparse: true } },
    type: {
      type: String,
      enum: ['call', 'whatsapp', 'email', 'meeting', 'follow_up', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    completedAt: Date,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
    recurrence: RecurrenceSchema,
    reminderAt: Date,
    reminderSent: { type: Boolean, default: false },
    autoSend: { type: Boolean, default: false },
    autoSendAttempts: { type: Number, default: 0 },
    messageContent: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TaskSchema.plugin(baseSchemaPlugin);

// leadId/dealId/contactId/companyId already indexed via field-level `index: true`
TaskSchema.index({ businessId: 1, status: 1, dueDate: 1 });
TaskSchema.index({ businessId: 1, assignedTo: 1, status: 1 });
TaskSchema.index({ businessId: 1, priority: 1, dueDate: 1 });

TaskSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && this.dueDate < new Date();
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
