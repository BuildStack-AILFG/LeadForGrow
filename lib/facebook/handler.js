/**
 * Facebook Page handler — Messenger DMs + Page post comments.
 *
 * Meta sends both under object==='page' on the same webhook:
 *   entry.messaging[]  → Messenger DMs
 *   entry.changes[]    → feed events (comments when value.item==='comment')
 *
 * Comments are stored as their own conversation per commenter, keyed by
 * `participantId: "fb_comment:<commenterId>"`, so a person's DMs and their
 * public comments never merge — different reply endpoints (DM → /messages,
 * comment → /{id}/comments).
 *
 * Mirrors lib/instagram/handler.js.
 */
import { matchCustomer } from '@/lib/omnichannel/customerMatching';
import { recordChannelMessage } from '@/lib/omnichannel/conversationService';
import Conversation from '@/models/omnichannel/Conversation';
import WebhookLog from '@/models/automation/WebhookLog';
import Business from '@/models/Business';
import { findMatchingRule, commentLeadMode } from '@/lib/automation/commentMatch';

export const FB_COMMENT_PARTICIPANT_PREFIX = 'fb_comment:';

export function parseMessengerEvents(entry) {
  const events = [];
  for (const item of entry?.messaging || []) {
    const senderId = item.sender?.id;
    const recipientId = item.recipient?.id;
    const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();

    if (item.message) {
      const msg = item.message;
      events.push({
        type: 'message',
        messageId: msg.mid,
        senderId,
        recipientId,
        timestamp,
        text: msg.text,
        attachments: msg.attachments || [],
        isEcho: msg.is_echo,
        replyTo: msg.reply_to?.mid,
      });
    }

    if (item.read) {
      events.push({ type: 'read', senderId, watermark: item.read.watermark });
    }
  }
  return events;
}

export async function processMessengerEvent(businessId, event) {
  if (event.type !== 'message' || event.isEcho) {
    return { status: 'skipped' };
  }

  const messageId = event.messageId;
  const existing = await WebhookLog.findOne({ webhookId: messageId, status: 'processed' });
  if (existing) return { status: 'skipped', reason: 'duplicate' };

  await WebhookLog.findOneAndUpdate(
    { webhookId: messageId },
    { businessId, webhookId: messageId, payload: event, status: 'pending' },
    { upsert: true }
  );

  const matched = await matchCustomer(businessId, {
    facebookId: event.senderId,
    name: 'Facebook User',
    channel: 'facebook',
    createIfMissing: true,
  });

  const lead = matched.lead;
  if (lead && !lead.metadata?.get?.('facebookId')) {
    lead.metadata = lead.metadata || new Map();
    lead.metadata.set('facebookId', event.senderId);
    await lead.save();
  }

  const attachment = event.attachments?.[0];
  let type = 'text';
  let body = event.text || '';
  if (attachment) {
    type = attachment.type === 'image' ? 'image' : attachment.type === 'video' ? 'video' : 'text';
    body = body || `[${type}]`;
  }

  const { conversation } = await recordChannelMessage({
    businessId,
    channel: 'facebook',
    leadId: lead._id,
    contactId: matched.contact?._id,
    companyId: matched.company?._id,
    dealId: matched.deal?._id,
    messageId,
    direction: 'incoming',
    type,
    content: {
      body,
      participantId: event.senderId,
      mediaUrl: attachment?.payload?.url,
    },
    timestamp: event.timestamp,
    rawMetadata: event,
  });

  await WebhookLog.findOneAndUpdate({ webhookId: messageId }, { status: 'processed' });

  if (lead?._id) {
    try {
      const { dispatchAutomationEvent } = await import('@/lib/automation/triggerHub');
      const { resumeWaitingExecutions } = await import('@/lib/automation/workflowResume');
      await dispatchAutomationEvent(lead, 'facebook_dm', { conversationId: conversation._id, messageId });
      await resumeWaitingExecutions(lead._id, 'reply');

      // Visual flow builder (WhatsAppFlow, channel='facebook'): resume any wait,
      // else start matching published Facebook flows. Same pattern as the
      // WhatsApp path in leadManager.processIncomingMessage.
      const Business = (await import('@/models/Business')).default;
      const business = await Business.findById(businessId);
      if (business) {
        const { resumeFlowWaitForReply, matchAndStartFlows } = await import('@/lib/whatsappFlows/engine');
        const resumed = await resumeFlowWaitForReply({ businessId, leadId: lead._id, text: event.text });
        if (!resumed || resumed.length === 0) {
          await matchAndStartFlows({
            business,
            lead,
            text: event.text || '',
            conversationId: conversation._id,
            event: 'facebook_dm',
          });
        }
      }
    } catch (err) {
      console.error('[Facebook] Automation dispatch error:', err.message);
    }
  }

  return { status: 'success', leadId: lead._id, conversationId: conversation._id };
}

/**
 * Parse entry.changes[] for feed comment events. Ignores non-comment feed items,
 * non-'add' verbs (edits/removes), and the page's own comments (echoes).
 */
export function parseFacebookComments(entry) {
  const events = [];
  const pageId = entry?.id;
  for (const change of entry?.changes || []) {
    if (change.field !== 'feed' || !change.value) continue;
    const v = change.value;
    if (v.item !== 'comment') continue;
    if (v.verb && v.verb !== 'add') continue;
    const commenterId = v.from?.id;
    if (!commenterId || commenterId === pageId) continue;
    events.push({
      type: 'comment',
      commentId: v.comment_id || v.id,
      parentCommentId: v.parent_id || null,
      mediaId: v.post_id || null,
      commenterId,
      commenterName: v.from?.name || null,
      text: v.message || '',
      timestamp: v.created_time ? new Date(v.created_time * 1000) : new Date(),
    });
  }
  return events;
}

export async function processFacebookCommentEvent(businessId, event) {
  const commentId = event.commentId;
  if (!commentId) return { status: 'skipped', reason: 'missing_comment_id' };

  const existing = await WebhookLog.findOne({ webhookId: commentId, status: 'processed' });
  if (existing) return { status: 'skipped', reason: 'duplicate' };

  // Lead-creation switch: by default only comments that trigger one of this
  // channel's automations become leads/conversations; a business can opt in to
  // "every comment" (commentLeadMode === 'all').
  const commentBusiness = await Business.findById(businessId);
  if (commentLeadMode(commentBusiness, 'facebook') === 'matched'
    && !(await findMatchingRule(commentBusiness, event, 'facebook'))) {
    return { status: 'skipped', reason: 'no_rule_match' };
  }

  await WebhookLog.findOneAndUpdate(
    { webhookId: commentId },
    { businessId, webhookId: commentId, payload: event, status: 'pending' },
    { upsert: true }
  );

  const matched = await matchCustomer(businessId, {
    facebookId: event.commenterId,
    facebookName: event.commenterName,
    name: event.commenterName || 'Facebook User',
    channel: 'facebook',
    createIfMissing: true,
  });
  const lead = matched.lead;
  if (lead && !lead.metadata?.get?.('facebookId')) {
    lead.metadata = lead.metadata || new Map();
    lead.metadata.set('facebookId', event.commenterId);
    if (event.commenterName) lead.metadata.set('facebookName', event.commenterName);
    await lead.save();
  }

  const participantId = `${FB_COMMENT_PARTICIPANT_PREFIX}${event.commenterId}`;

  const { conversation } = await recordChannelMessage({
    businessId,
    channel: 'facebook',
    leadId: lead._id,
    contactId: matched.contact?._id,
    companyId: matched.company?._id,
    dealId: matched.deal?._id,
    messageId: commentId,
    direction: 'incoming',
    type: 'text',
    content: {
      body: event.text,
      participantId,
      facebookCommentId: commentId,
      facebookPostId: event.mediaId,
      facebookParentCommentId: event.parentCommentId,
      facebookCommenterName: event.commenterName,
    },
    timestamp: event.timestamp,
    rawMetadata: event,
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      'metadata.lastCommentId': commentId,
      'metadata.lastPostId': event.mediaId,
      'metadata.facebookCommenterName': event.commenterName,
      participantName:
        conversation.participantName || event.commenterName || undefined,
    },
  });

  await WebhookLog.findOneAndUpdate({ webhookId: commentId }, { status: 'processed' });

  // Fire-and-forget keyword comment automation (public reply + private reply).
  try {
    const { runFacebookCommentAutomations } = await import('@/lib/facebook/commentAutomation');
    await runFacebookCommentAutomations(businessId, event, commentBusiness);
  } catch (err) {
    console.error('[Facebook] Comment automation error:', err.message);
  }

  if (lead?._id) {
    try {
      const { dispatchAutomationEvent } = await import('@/lib/automation/triggerHub');
      await dispatchAutomationEvent(lead, 'facebook_comment', {
        conversationId: conversation._id,
        commentId,
        mediaId: event.mediaId,
      });

      // Visual flow builder — start matching published Facebook comment flows.
      const Business = (await import('@/models/Business')).default;
      const business = await Business.findById(businessId);
      if (business) {
        const { matchAndStartFlows } = await import('@/lib/whatsappFlows/engine');
        await matchAndStartFlows({
          business,
          lead,
          text: event.text || '',
          conversationId: conversation._id,
          event: 'facebook_comment',
        });
      }
    } catch (err) {
      console.error('[Facebook] Comment dispatch error:', err.message);
    }
  }

  return { status: 'success', leadId: lead._id, conversationId: conversation._id, commentId };
}

export default {
  parseMessengerEvents,
  processMessengerEvent,
  parseFacebookComments,
  processFacebookCommentEvent,
  FB_COMMENT_PARTICIPANT_PREFIX,
};
