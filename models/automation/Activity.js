import mongoose from 'mongoose';

const ENTITY_TYPES = ['lead', 'contact', 'company', 'deal', 'task', 'meeting'];

const ACTIVITY_TYPES = [
  'lead_created',
  'lead_updated',
  'lead_archived',
  'lead_restored',
  'lead_converted',
  'status_changed',
  'note_added',
  'comment_added',
  'attachment_added',
  'contacted_call',
  'contacted_whatsapp',
  'contacted_email',
  'follow_up_scheduled',
  'follow_up_completed',
  'task_created',
  'task_completed',
  'task_updated',
  'automation_executed',
  'assigned',
  'converted',
  'lost',
  're-engagement',
  'whatsapp_received',
  'whatsapp_sent',
  'whatsapp_failed',
  'whatsapp_opted_out', // customer replied STOP
  'whatsapp_opted_in',  // customer replied START
  'instagram_received',
  'instagram_sent',
  'email_received',
  'email_sent',
  'email_failed',
  'automation_failed',
  'template_sent',
  'conversation_assigned',
  'conversation_transferred',
  'meeting_booked',
  'meeting_completed',
  'meeting_no_show',
  'meeting_cancelled',
  'meeting_rescheduled',
  'deal_created',
  'deal_updated',
  'deal_stage_changed',
  'deal_won',
  'deal_lost',
  'contact_created',
  'contact_updated',
  'contact_merged',
  'company_created',
  'company_updated',
  'merge_completed',
];

const ActivitySchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ENTITY_TYPES,
      default: 'lead',
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

ActivitySchema.pre('validate', function ensureEntityRef() {
  if (!this.entityId && this.leadId) {
    this.entityId = this.leadId;
    if (!this.entityType) this.entityType = 'lead';
  }
});

ActivitySchema.index({ businessId: 1, entityType: 1, entityId: 1, performedAt: -1 });
ActivitySchema.index({ leadId: 1, performedAt: -1 });
ActivitySchema.index({ businessId: 1, performedAt: -1 });

if (mongoose.models.Activity) {
  delete mongoose.models.Activity;
}

export { ACTIVITY_TYPES, ENTITY_TYPES };
export default mongoose.model('Activity', ActivitySchema);
