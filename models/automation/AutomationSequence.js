import mongoose from 'mongoose';

const WorkflowNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const WorkflowEdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String, default: 'default' },
  targetHandle: { type: String, default: 'default' },
  label: { type: String, default: '' },
}, { _id: false });

const SequenceStepSchema = new mongoose.Schema({
  delayDays: { type: Number, default: 0 },
  channel: { type: String, enum: ['whatsapp', 'email', 'both'], default: 'both' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationRule' },
  emailSubject: { type: String, trim: true },
  messageTemplate: { type: String, trim: true },

  // ── Smart branching ────────────────────────────────────────────────────
  // These are what turn a dumb drip into an intelligent journey. The engine
  // consults them when a lead replies while enrolled: it can exit the
  // sequence, mark the goal as reached, or pause and hand off to a human.
  // Kept on each step so different steps can react differently (e.g. Day 1
  // "Pause on reply", Day 7 "Exit on button click").

  // Exit the sequence if the lead sends ANY reply. Useful for "we're
  // waiting to hear from you" steps — once they respond, stop chasing.
  exitOnAnyReply: { type: Boolean, default: false },

  // Exit if the reply body matches any of these keywords (case-insensitive,
  // whole-message match after trim). Populated with things like ["STOP",
  // "UNSUBSCRIBE"] to honour opt-outs, or ["YES", "BOOKED"] for goal words.
  exitKeywords: [{ type: String, trim: true, lowercase: true }],

  // Pause (do not exit) — flags the execution so an agent needs to resume.
  // Use for questions: "Any questions we can help with?" → if they reply,
  // don't blast the next drip on top; pause and route to human.
  pauseOnReply: { type: Boolean, default: false },

  // Mark this step's completion as the sequence's business goal (e.g. the
  // "Book now" step in a nurture flow). When a lead exits via keyword or
  // button after this step fires, engine credits the sequence with a goal.
  isGoal: { type: Boolean, default: false },
}, { _id: true });

const AutomationSequenceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['nurture', 'recovery', 'qualification', 'reactivation', 'booking', 'custom'],
    default: 'custom',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft',
    index: true,
  },
  triggerType: {
    type: String,
    enum: [
      'new_lead', 'form_submission', 'whatsapp_message', 'meta_lead',
      'stage_changed', 'missed_call', 'tag_added', 'no_reply', 'payment_received',
      'event_joined', 'lead_updated', 'lead_converted', 'deal_won', 'deal_lost',
      'email_received', 'email_opened', 'chat_started', 'lead_qualified', 'manual', 'recurring',
      'webhook', 'instagram_dm', 'instagram_comment', 'deal_created',
      'meeting_scheduled', 'meeting_completed',
    ],
    default: 'new_lead',
  },
  triggerConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  workflowMode: { type: String, enum: ['graph', 'linear'], default: 'graph' },
  nodes: [WorkflowNodeSchema],
  edges: [WorkflowEdgeSchema],
  steps: [SequenceStepSchema],
  active: { type: Boolean, default: true },
  automationRuleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule',
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
  tags: [{ type: String, trim: true }],
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowFolder', default: null },
  enabled: { type: Boolean, default: true },
  publishedAt: Date,
  publishedVersion: { type: Number, default: 0 },
  searchText: { type: String, trim: true },
  abTest: {
    enabled: { type: Boolean, default: false },
    variants: [{
      id: String,
      name: String,
      weight: { type: Number, default: 50 },
      nodes: [WorkflowNodeSchema],
      edges: [WorkflowEdgeSchema],
    }],
    winnerVariantId: String,
    autoSelectWinner: { type: Boolean, default: false },
  },
  webhookSecret: { type: String, sparse: true },
  lastScheduledRunAt: Date,
  analytics: {
    enrolled: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    responded: { type: Number, default: 0 },
    activeRuns: { type: Number, default: 0 },
    // Smart-branching outcomes — how many leads hit the goal step, opted
    // out, or paused to an agent. Powers the "412x ROI" story per sequence.
    goalReached: { type: Number, default: 0 },
    optedOut: { type: Number, default: 0 },
    pausedForAgent: { type: Number, default: 0 },
  },
}, { timestamps: true });

AutomationSequenceSchema.index({ businessId: 1, status: 1 });
AutomationSequenceSchema.index({ businessId: 1, folderId: 1 });
AutomationSequenceSchema.index({ businessId: 1, name: 'text', description: 'text' });

export default mongoose.models.AutomationSequence
  || mongoose.model('AutomationSequence', AutomationSequenceSchema);
