/**
 * Central automation trigger dispatcher.
 * Maps domain events to engine triggers and starts matching workflows.
 */

import { queueAutomation } from '@/lib/queue';

/** Maps domain event types to AutomationRule trigger keys */
export const EVENT_TO_ENGINE_TRIGGER = {
  lead_created: 'onLeadReceived',
  lead_updated: 'onStatusChange',
  lead_converted: 'onStatusChange',
  deal_created: 'onLeadReceived',
  deal_won: 'onStatusChange',
  deal_lost: 'onStatusChange',
  stage_changed: 'onStatusChange',
  task_created: 'onLeadReceived',
  task_completed: 'onStatusChange',
  meeting_scheduled: 'onLeadReceived',
  meeting_completed: 'onStatusChange',
  contact_created: 'onLeadReceived',
  company_created: 'onLeadReceived',
  timeline_event: 'onLeadReceived',
  whatsapp_received: 'onLeadReceived',
  whatsapp_sent: 'onLeadReceived',
  instagram_dm: 'onLeadReceived',
  instagram_comment: 'onLeadReceived',
  facebook_dm: 'onLeadReceived',
  facebook_comment: 'onLeadReceived',
  email_received: 'onLeadReceived',
  email_sent: 'onLeadReceived',
  email_opened: 'onLeadReceived',
  email_clicked: 'onLeadReceived',
  chat_started: 'onLeadReceived',
  form_submitted: 'onLeadReceived',
  visitor_identified: 'onLeadReceived',
  lead_qualified: 'onStatusChange',
  lead_score_changed: 'onStatusChange',
  ai_summary_generated: 'onLeadReceived',
  ai_escalated: 'onStatusChange',
  no_reply: 'onNoResponse',
  payment_received: 'onLeadReceived',
  missed_call: 'onLeadReceived',
  tag_added: 'onLeadReceived',
  webhook: 'onLeadReceived',
  manual: 'onLeadReceived',
  recurring: 'onLeadReceived',
  event_joined: 'onEventJoined',
};

/** Maps domain events to AutomationSequence triggerType */
export const EVENT_TO_SEQUENCE_TRIGGER = {
  lead_created: 'new_lead',
  form_submitted: 'form_submission',
  whatsapp_received: 'whatsapp_message',
  whatsapp_message: 'whatsapp_message',
  meta_lead: 'meta_lead',
  stage_changed: 'stage_changed',
  missed_call: 'missed_call',
  tag_added: 'tag_added',
  no_reply: 'no_reply',
  payment_received: 'payment_received',
  event_joined: 'event_joined',
  instagram_dm: 'instagram_dm',
  instagram_comment: 'instagram_comment',
  facebook_dm: 'facebook_dm',
  facebook_comment: 'facebook_comment',
  deal_won: 'deal_won',
  deal_lost: 'deal_lost',
  deal_created: 'deal_created',
  email_received: 'email_received',
  webhook: 'webhook',
  recurring: 'recurring',
  lead_qualified: 'lead_qualified',
  meeting_scheduled: 'meeting_scheduled',
  meeting_completed: 'meeting_completed',
  manual: 'manual',
};

/**
 * Domain events that can resolve a sequence paused at a matching wait_* node
 * early (see lib/sequences/engine.js resolveWait). whatsapp/email replies are
 * wired directly at their source (lib/automation/leadManager.js) rather than
 * here, since resolveWait is idempotent either way — no need to duplicate that one.
 */
const EVENT_TO_WAIT_TYPE = {
  payment_received: 'payment',
  meeting_scheduled: 'meeting',
  deal_won: 'deal_won',
};

/**
 * Dispatch an automation event for a lead.
 * @param {object} lead - Lead document (or lean)
 * @param {string} eventType - Domain event from EVENT_TO_ENGINE_TRIGGER
 * @param {object} [context] - Extra metadata stored on lead for condition evaluation
 */
export async function dispatchAutomationEvent(lead, eventType, context = {}) {
  if (!lead?._id) return;

  const engineTrigger = EVENT_TO_ENGINE_TRIGGER[eventType] || 'onLeadReceived';

  if (context && Object.keys(context).length) {
    try {
      const Lead = (await import('@/models/automation/Lead')).default;
      await Lead.updateOne(
        { _id: lead._id },
        { $set: { 'metadata.lastTriggerEvent': eventType, 'metadata.lastTriggerContext': context } }
      );
    } catch {
      /* non-critical */
    }
  }

  await queueAutomation(lead, engineTrigger);

  const sequenceTrigger = EVENT_TO_SEQUENCE_TRIGGER[eventType];
  if (sequenceTrigger) {
    try {
      const { sequenceEngine } = await import('@/lib/sequences/engine');
      await sequenceEngine.tryStartByTriggerType(lead, sequenceTrigger);
    } catch (err) {
      console.error('[TriggerHub] Sequence trigger error:', err.message);
    }
  }

  const waitType = EVENT_TO_WAIT_TYPE[eventType];
  if (waitType) {
    try {
      const { sequenceEngine } = await import('@/lib/sequences/engine');
      await sequenceEngine.resolveWait(lead._id, waitType);
    } catch (err) {
      console.error('[TriggerHub] resolveWait error:', err.message);
    }
  }
}

export default { dispatchAutomationEvent, EVENT_TO_ENGINE_TRIGGER, EVENT_TO_SEQUENCE_TRIGGER };
