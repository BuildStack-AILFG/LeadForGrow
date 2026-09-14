import mongoose from 'mongoose';

const FlowEdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String, default: 'default' },
  targetHandle: { type: String, default: 'default' },
  label: { type: String, default: '' },
}, { _id: false });

const WhatsAppFlowSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  triggerType: {
    type: String,
    enum: [
      'incoming_message',
      'keyword',
      'contact_created',
      'lead_created',
      'manual',
      'webhook',
    ],
    default: 'incoming_message',
    index: true,
  },
  triggerConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  /** React Flow edges (nodes live in FlowNode collection) */
  edges: [FlowEdgeSchema],
  /** Snapshot of published graph for execution (nodes + edges) */
  publishedSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  version: { type: Number, default: 1 },
  publishedVersion: { type: Number, default: 0 },
  publishedAt: Date,
  tags: [{ type: String, trim: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  webhookSecret: { type: String, sparse: true },
  analytics: {
    totalExecutions: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    dropped: { type: Number, default: 0 },
    totalCompletionMs: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
  },
}, { timestamps: true });

WhatsAppFlowSchema.index({ businessId: 1, status: 1 });
WhatsAppFlowSchema.index({ businessId: 1, name: 1 });
WhatsAppFlowSchema.index({ businessId: 1, triggerType: 1, status: 1 });

export default mongoose.models.WhatsAppFlow || mongoose.model('WhatsAppFlow', WhatsAppFlowSchema);
