import mongoose from 'mongoose';
import crypto from 'crypto';
import { BUSINESS_PLAN_ENUM, applyPlanQuotas, isUnlimitedPlan } from '@/lib/plans';

// Revenue Intelligence Configuration Schema
const RevenueConfigSchema = new mongoose.Schema({
  // Average Deal Values
  avgDealValue: {
    min: { type: Number },
    typical: { type: Number, required: true },
    high: { type: Number },
    currency: { type: String, default: 'INR' }
  },

  // Service-wise Deal Values (Optional)
  serviceValues: [{
    name: { type: String, required: true },
    value: { type: Number, required: true },
    _id: false
  }],

  // SLA Settings
  sla: {
    firstResponseMinutes: { type: Number, default: 15 },
    followupMinutes: { type: Number, default: 60 }
  },

  // Working Hours
  workingHours: {
    days: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '18:00' },
    timezone: { type: String, default: 'Asia/Kolkata' }
  },

  // Conversion Rates
  conversionRate: {
    low: { type: Number, default: 5 },
    avg: { type: Number, default: 10 },
    high: { type: Number, default: 20 }
  },

  // Lead Source Weighting
  sources: [{
    name: { type: String, required: true },
    weight: { type: Number, min: 0, max: 1, default: 0.5 },
    avgConversion: { type: Number, min: 0, max: 100, default: 0 },
    _id: false
  }],

  // Follow-up Strategy
  followup: {
    maxAttempts: { type: Number, default: 5 },
    gapMinutes: { type: Number, default: 1440 }
  },

  // Preferred Contact Channels
  preferredChannels: {
    type: [String],
    enum: ['call', 'whatsapp', 'email'],
    default: ['call', 'whatsapp']
  },

  // Team Roles (for future use)
  teamRoles: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    experienceLevel: { type: String },
    _id: false
  }],

  // Legal Acknowledgment
  estimationAcknowledged: { type: Boolean, default: false },

  // Timestamps
  configuredAt: { type: Date },
  lastUpdatedAt: { type: Date }
}, { _id: false });

const BusinessSettingsSchema = new mongoose.Schema({
  // Lead Assignment Strategy
  assignmentStrategy: {
    type: String,
    enum: ['solo', 'round-robin', 'least-busy'],
    default: 'solo'
  },

  // Notification Preferences
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      recipients: [{ type: String }]
    },
    whatsapp: {
      enabled: { type: Boolean, default: false },
      recipients: [{ type: String }]
    },
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String }
    }
  },

  // Business Hours
  businessHours: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6]
    },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '18:00' }
  },

  // Auto-response settings
  autoResponse: {
    enabled: { type: Boolean, default: true },
    messageTemplate: {
      type: String,
      default: 'Thank you {{name}} for your interest in {{serviceInterest}}. We will get back to you shortly!'
    }
  },

  // Email Auto-Reply (SLA safety net).
  // When a customer emails us and no human replies within `thresholdMinutes`,
  // the system sends a polite holding message so the lead knows we saw it.
  // Deliberately narrow — commits to nothing, just acknowledges + sets an
  // expectation. Real AI-generated answers are a follow-up (behind an
  // explicit flag) because hallucinations on outbound customer email are
  // brand-damaging in a way inbound triage isn't.
  emailAutoReply: {
    enabled: { type: Boolean, default: false },
    thresholdMinutes: { type: Number, default: 5, min: 1, max: 240 },
    template: {
      type: String,
      default:
        'Hi {{name}},\n\nThanks for your email — we\'ve got your message and someone from {{businessName}} will get back with a detailed answer shortly.\n\nIf it\'s urgent, feel free to reply here or reach us on WhatsApp.\n\nBest,\n{{businessName}} Team',
    },
    // Guardrails — every one prevents a certain type of embarrassment.
    guardrails: {
      // Skip auto-reply outside business hours — customer expects delay
      // then anyway, so a "we'll get back to you" mid-night looks weird.
      businessHoursOnly: { type: Boolean, default: true },
      // Skip if the incoming message contains any of these strings (case-insensitive).
      // Angry/sensitive words → don't auto-reply, escalate to human.
      skipKeywords: {
        type: [String],
        default: ['angry', 'refund', 'cancel', 'complaint', 'lawyer', 'sue', 'terrible', 'awful'],
      },
      // Only auto-reply once per conversation. Prevents infinite AI-vs-customer ping-pong.
      onePerConversation: { type: Boolean, default: true },
    },
    lastRunAt: { type: Date },
    totalSent: { type: Number, default: 0 },
  },

  // Website Chatbot Widget
  chatbot: {
    enabled: { type: Boolean, default: true },
    published: { type: Boolean, default: false },
    appearance: {
      primaryColor: { type: String, default: '#0f766e' },
      position: { type: String, enum: ['left', 'right'], default: 'right' },
      botName: { type: String, default: 'Support' },
      subtitle: { type: String, default: 'Typically replies in a few minutes' },
      showBranding: { type: Boolean, default: true }
    },
    messages: {
      greeting: { type: String, default: 'Hi there! 👋 Welcome to our site. May I know your name?' },
      thankYou: { type: String, default: 'Thank you! Our team will contact you shortly.' },
      offlineMessage: { type: String, default: 'We are currently away. Leave your details and we will get back to you.' }
    },
    flow: {
      collectEmail: { type: Boolean, default: true },
      collectPhone: { type: Boolean, default: true },
      askSupportType: { type: Boolean, default: true },
      aiEnabled: { type: Boolean, default: false },
      questions: {
        type: [String],
        default: [
          'What services are you primarily interested in?',
          'How did you hear about us?',
          'What is your estimated budget for this project?',
          'How soon are you looking to get started?'
        ]
      }
    },
    stats: {
      impressions: { type: Number, default: 0 },
      conversationsStarted: { type: Number, default: 0 },
      leadsCaptured: { type: Number, default: 0 }
    },
    lastPublishedAt: { type: Date }
  },

  // Call Automation Settings
  callAutomation: {
    enabled: { type: Boolean, default: true },
    voiceId: { type: String, default: 'en-US-Neural2-F' },
    recordCalls: { type: Boolean, default: false },
    maxDurationSeconds: { type: Number, default: 60 },
    greetingMessage: { type: String, default: 'Hello, I am the AI assistant for {{businessName}}.' },
    enableSmsFollowup: { type: Boolean, default: true },

    telephony: {
      provider: { type: String, enum: ['vapi', 'retell', 'twilio'], default: 'vapi' },
      apiKey: { type: String, select: false },
      assistantId: { type: String },
      phoneNumberId: { type: String },
      twimlAppSid: { type: String },
      apiSecret: { type: String, select: false }
    }
  },

  // Phase 4 — AI Platform settings
  ai: {
    enabled: { type: Boolean, default: true },
    tone: { type: String, enum: ['professional', 'friendly', 'formal', 'casual'], default: 'professional' },
    personality: { type: String, default: 'helpful sales advisor' },
    languages: { type: [String], default: ['en', 'hi'] },
    customInstructions: { type: String, default: '' },
    confidenceThreshold: { type: Number, default: 0.6, min: 0, max: 1 },
    handoffEnabled: { type: Boolean, default: true },
    handoffKeywords: { type: [String], default: ['human', 'agent', 'call me', 'speak to someone'] },
    workingHoursOnly: { type: Boolean, default: false },
    escalationRules: { type: String, default: '' },
    model: { type: String, default: 'llama-3.1-8b-instant' },
    agentEnabled: { type: Boolean, default: false },
    replyAssistEnabled: { type: Boolean, default: true },
    /** When true, the AI auto-replies to incoming WhatsApp messages from the
     *  knowledge base instead of only suggesting a reply to the agent. */
    whatsappAutoReply: { type: Boolean, default: false },
  },

  /** CRM pipeline, messaging templates, and automation toggles */
  crm: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
  },
}, { _id: false });

const IntegrationCredentialsSchema = new mongoose.Schema({
  whatsapp: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['meta', 'interakt'], default: 'meta' },
    apiKey: { type: String }, // Used as Access Token for Meta
    interaktApiKey: { type: String },
    phoneNumberId: { type: String },
    businessAccountId: { type: String },
    // Meta App ID that owns this WABA. Required for the Resumable Upload API
    // used when submitting media (image/video/document) headers for template review.
    appId: { type: String },
    appSecret: { type: String },
    verifyToken: { type: String },
    lastVerified: { type: Date }
  },

  email: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['smtp', 'sendgrid', 'mailgun', 'ses'] },
    host: { type: String },
    port: { type: Number },
    username: { type: String },
    password: { type: String },
    fromEmail: { type: String },
    fromName: { type: String },
    lastVerified: { type: Date }
  },

  sms: {
    enabled: { type: Boolean, default: false },
    provider: { type: String },
    apiKey: { type: String }
  },

  facebookAds: {
    enabled: { type: Boolean, default: false },
    pageId: { type: String },
    accessToken: { type: String }, // Page Access Token
    verifyToken: { type: String },
    appId: { type: String },
    appSecret: { type: String },
    adAccountId: { type: String },
    lastVerified: { type: Date }
  },

  instagram: {
    enabled: { type: Boolean, default: false },
    pageId: { type: String },
    igUserId: { type: String },
    username: { type: String },
    accessToken: { type: String },
    profilePicture: { type: String },
    lastSyncAt: { type: Date },
    lastVerified: { type: Date },
    webhookStatus: { type: String, enum: ['active', 'pending', 'error'], default: 'pending' },
  },

  // Bring-Your-Own-Razorpay — each business connects their own Razorpay
  // account. Money moves directly from customer's card/UPI to the
  // business's bank via Razorpay, never through LFG. That keeps LFG out of
  // Payment Aggregator (PA) licence territory: we generate links using
  // their keys, we never hold funds. keySecret is stored encrypted at rest
  // (see lib/encryption.js — same pattern as Meta apiKey).
  razorpay: {
    enabled: { type: Boolean, default: false },
    keyId: { type: String, trim: true },       // rzp_live_… or rzp_test_… — public-ish, ok in cleartext
    keySecret: { type: String },               // ENCRYPTED at rest by lib/encryption before save
    webhookSecret: { type: String },           // for the optional /api/webhooks/razorpay auto-reconciliation
    lastVerified: { type: Date }
  }
}, { _id: false });

const BusinessSchema = new mongoose.Schema({
  // Business Identity
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },

  // Bill-header / customer-facing info. Set once in Settings → Bill Header,
  // auto-rendered on every bill PDF. Address is a single string (multi-line
  // via \n) rather than structured (street/city/state/pin) — small businesses
  // want to type it the way they say it, and the PDF just prints it verbatim.
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },

  // Per-year sequence counter for Bill numbers (e.g. billCounter.2026 = 3).
  // Must be declared here — an undeclared path is silently dropped by
  // Mongoose's strict mode, which would make every $inc a no-op and every
  // generated bill number collide on the unique index.
  billCounter: { type: mongoose.Schema.Types.Mixed, default: {} },


  // Ownership
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Subscription & Plan
  plan: {
    type: String,
    enum: BUSINESS_PLAN_ENUM,
    default: 'free'
  },
  planStartDate: {
    type: Date,
    default: Date.now
  },
  planEndDate: {
    type: Date
  },

  // Quotas (based on plan)
  quotas: {
    maxForms: { type: Number, default: 1 },
    maxTeamMembers: { type: Number, default: 1 },
    maxAutomationRules: { type: Number, default: 3 },
    maxLeadsPerMonth: { type: Number, default: 100 }
  },

  // Usage Tracking
  usage: {
    formsCreated: { type: Number, default: 0 },
    leadsThisMonth: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },

  // Settings & Configuration
  settings: {
    type: BusinessSettingsSchema,
    default: () => ({})
  },

  // Revenue Intelligence Configuration
  revenueConfig: {
    type: RevenueConfigSchema,
    default: null
  },

  // Revenue Intelligence Active Flag
  revenueIntelligenceActive: {
    type: Boolean,
    default: false
  },

  // Integration Credentials (encrypted)
  integrationCredentials: {
    type: IntegrationCredentialsSchema,
    default: () => ({})
  },

  // Integration Health & Status Tracking
  integrationHealth: {
    email: {
      status: { type: String, enum: ['healthy', 'degraded', 'failing', 'unknown'], default: 'unknown' },
      lastSuccessAt: Date,
      lastError: String
    },
    whatsapp: {
      status: { type: String, enum: ['healthy', 'degraded', 'failing', 'unknown'], default: 'unknown' },
      lastSuccessAt: Date,
      lastError: String
    },
    webhooks: {
      status: { type: String, enum: ['active', 'error', 'inactive'], default: 'inactive' },
      lastSuccessAt: Date,
      lastError: String,
      totalCount: { type: Number, default: 0 }
    }
  },

  // API & Webhook Security
  // NOTE: uniqueness enforced via partial indexes at the bottom of this file,
  // not `sparse` (sparse still indexes explicit null → duplicate-key crashes).
  apiKey: {
    type: String
  },
  webhookSecret: {
    type: String
  },

  // Onboarding Status
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: String,
    enum: ['business_details', 'first_form', 'integration_setup', 'automation_setup', 'completed'],
    default: 'business_details'
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },

  // Account freeze — a hard, admin-only kill switch independent of `plan` or
  // `status`. When true, the entire /automation app is disabled for this
  // business (see AccessControl.js) regardless of what plan they're on —
  // used for e.g. non-payment, until the team manually renews/unfreezes.
  frozen: {
    type: Boolean,
    default: false
  },
  frozenReason: {
    type: String,
    trim: true
  },
  frozenAt: {
    type: Date
  },

  // Billing
  billingEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  /** Admin overrides — boolean flags per feature (omit = plan default) */
  featureFlags: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Indexes
BusinessSchema.index({ ownerId: 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ plan: 1 });
BusinessSchema.index({ 'integrationCredentials.whatsapp.phoneNumberId': 1 }, { sparse: true });
BusinessSchema.index(
  { 'integrationCredentials.whatsapp.businessAccountId': 1 },
  {
    partialFilterExpression: { 'integrationCredentials.whatsapp.businessAccountId': { $type: 'string' } },
  }
);
BusinessSchema.index({ 'integrationCredentials.facebookAds.pageId': 1 }, { sparse: true });
// Partial (not sparse) so many businesses with null apiKey/webhookSecret don't collide.
BusinessSchema.index({ apiKey: 1 }, { unique: true, partialFilterExpression: { apiKey: { $type: 'string' } } });
BusinessSchema.index({ webhookSecret: 1 }, { unique: true, partialFilterExpression: { webhookSecret: { $type: 'string' } } });

// Methods
BusinessSchema.methods.generateApiKey = function () {
  this.apiKey = 'lfg_biz_' + crypto.randomBytes(32).toString('hex');
  return this.apiKey;
};

BusinessSchema.methods.generateWebhookSecret = function () {
  this.webhookSecret = 'wh_sec_' + crypto.randomBytes(32).toString('hex');
  return this.webhookSecret;
};

BusinessSchema.methods.canCreateForm = function () {
  if (isUnlimitedPlan(this.plan)) return true;
  return this.usage.formsCreated < this.quotas.maxForms;
};

BusinessSchema.methods.canCreateAutomationRule = function () {
  return true;
};

BusinessSchema.methods.incrementLeadCount = function () {
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);

  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.leadsThisMonth = 0;
    this.usage.lastResetDate = now;
  }

  this.usage.leadsThisMonth += 1;
};

BusinessSchema.methods.hasReachedLeadLimit = function () {
  if (isUnlimitedPlan(this.plan)) return false;
  return this.usage.leadsThisMonth >= this.quotas.maxLeadsPerMonth;
};

// Revenue Intelligence Helper Methods
BusinessSchema.methods.calculateLeadValue = function (leadSource) {
  if (!this.revenueConfig || !this.revenueIntelligenceActive) {
    return this.revenueConfig?.avgDealValue?.typical || 0;
  }

  // Find source weight
  const source = this.revenueConfig.sources.find(s =>
    s.name.toLowerCase() === leadSource?.toLowerCase()
  );

  const sourceWeight = source ? source.weight : 0.5;
  const baseValue = this.revenueConfig.avgDealValue.typical;

  return baseValue * sourceWeight;
};

BusinessSchema.methods.isWithinWorkingHours = function (timestamp) {
  if (!this.revenueConfig) return true;

  const date = new Date(timestamp);
  const day = date.getDay();
  const time = date.toTimeString().slice(0, 5); // HH:MM format

  const workingDays = this.revenueConfig.workingHours.days;
  const startTime = this.revenueConfig.workingHours.startTime;
  const endTime = this.revenueConfig.workingHours.endTime;

  if (!workingDays.includes(day)) return false;
  if (time < startTime || time > endTime) return false;

  return true;
};

BusinessSchema.methods.getEstimatedConversionRate = function (leadSource) {
  if (!this.revenueConfig) {
    return this.revenueConfig?.conversionRate?.avg || 10;
  }

  const source = this.revenueConfig.sources.find(s =>
    s.name.toLowerCase() === leadSource?.toLowerCase()
  );

  return source?.avgConversion || this.revenueConfig.conversionRate.avg;
};

// Update quotas when plan changes (admin can override quotas directly in DB)
BusinessSchema.pre('save', async function () {
  if (this.isModified('plan')) {
    applyPlanQuotas(this, this.plan);
  }
});

export default mongoose.models.Business || mongoose.model('Business', BusinessSchema);