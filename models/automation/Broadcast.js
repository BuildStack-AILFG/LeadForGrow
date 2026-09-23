import mongoose from 'mongoose';

const BroadcastRecipientSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  email: String,
  phone: String,
  name: String,
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'skipped', 'opted_out'],
    default: 'pending',
  },
  error: String,
  // Meta returns a message id (wamid) after a successful send. We store it so
  // the incoming delivery-status webhook can flip this recipient to
  // delivered/read/failed with the real reason.
  metaMessageId: { type: String, index: true },
  failureCode: String,
  failureTitle: String,
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  failedAt: Date,
}, { _id: false });

const BroadcastSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  channel: {
    type: String,
    enum: ['whatsapp', 'email', 'both'],
    default: 'whatsapp',
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'draft',
    index: true,
  },
  audience: {
    type: { type: String, enum: ['all', 'filter', 'tags', 'manual'], default: 'filter' },
    filters: mongoose.Schema.Types.Mixed,
    tags: [String],
    leadIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
    // Engagement constraint applied on top of any audience mode.
    // When set, only leads with lastContactedAt within the last N days are included.
    // Meta rewards sending to recently-engaged users — sharply reduces #131049 quality drops.
    engagementDays: Number,
  },
  content: {
    subject: String,
    body: String,
    // Rich HTML body from the WYSIWYG editor (email broadcasts). When present
    // the engine sends this as the HTML part; `body` stays the plain-text
    // fallback (multipart text/plain). Absent → plain-text body only.
    bodyHtml: String,
    whatsappTemplate: String,
    whatsappTemplateName: String,
    whatsappTemplateLanguage: String,
    // Public URL to media used in the template's header at send time.
    // Required when the selected template has an IMAGE/VIDEO/DOCUMENT header.
    whatsappHeaderMediaUrl: String,
    // Email broadcasts: which mailbox sends this campaign and which of that
    // mailbox's saved signatures[] gets appended to every email. When set, the
    // engine sends from this account's SMTP with the resolved signature; when
    // absent it falls back to the legacy business-wide email transport.
    emailAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAccount' },
    signatureId: String,
    // Meta template variables — each {{n}} in body gets resolved from these.
    // source: 'lead.name' | 'lead.email' | 'lead.phone' | 'lead.city' | 'literal'
    variableMapping: [
      new mongoose.Schema({
        index: { type: Number, required: true },
        source: { type: String, required: true },
        literalValue: String,
      }, { _id: false }),
    ],
  },
  scheduledAt: Date,
  sentAt: Date,
  completedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipients: [BroadcastRecipientSchema],
  analytics: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    optedOut: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    // Meta quality-based drops (#131049 / #131050 / #131026) — tracked separately
    // so the guardrail can auto-pause a broadcast that's tanking your quality rating.
    qualityDrops: { type: Number, default: 0 },
  },
  // Populated by the engine when a broadcast is auto-paused mid-send.
  abortReason: String,
  testMode: { type: Boolean, default: false },
  testRecipients: [{ email: String, phone: String, name: String }],
}, { timestamps: true });

BroadcastSchema.index({ businessId: 1, status: 1 });
BroadcastSchema.index({ businessId: 1, scheduledAt: 1 });

export default mongoose.models.Broadcast
  || mongoose.model('Broadcast', BroadcastSchema);
