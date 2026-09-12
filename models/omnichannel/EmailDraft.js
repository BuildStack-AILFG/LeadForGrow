import mongoose from 'mongoose';
import { baseSchemaPlugin } from '../baseSchema.js';

const EmailDraftSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    emailAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAccount' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    to: [{ email: String, name: String }],
    cc: [{ email: String, name: String }],
    bcc: [{ email: String, name: String }],
    subject: String,
    bodyHtml: String,
    bodyText: String,
    attachments: [{
      url: String,
      fileName: String,
      mimeType: String,
      size: Number,
    }],
    replyToMessageId: String,
    scheduledAt: Date,
    // Scheduled-send retry bookkeeping (see lib/omnichannel/scheduledEmailSender).
    // A draft that fails to send is retried up to a cap, then scheduledAt is
    // cleared and sendError explains why, so it reverts to a normal draft.
    sendAttempts: { type: Number, default: 0 },
    sendError: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

EmailDraftSchema.plugin(baseSchemaPlugin);
EmailDraftSchema.index({ businessId: 1, updatedAt: -1 });

export default mongoose.models.EmailDraft || mongoose.model('EmailDraft', EmailDraftSchema);
