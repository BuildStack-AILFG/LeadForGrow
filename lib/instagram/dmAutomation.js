import Business from '@/models/Business';
import Conversation from '@/models/omnichannel/Conversation';
import { sendInstagramMessage } from '@/lib/social/guardedSend';
import { pickVariant } from '@/lib/automation/messageVariation';
import { generateAutoReply } from '@/lib/ai/autoReply';
import { sendJitter } from '@/lib/automation/sendGuard';
import { recordChannelMessage } from '@/lib/omnichannel/conversationService';
import { findDmRule } from '@/lib/automation/dmRules';

const META_KEY = 'dmAutoReplyAt'; // conversation.metadata: { [ruleId]: ISO date }

function readReplyLog(conversation) {
  const meta = conversation?.metadata;
  const raw = typeof meta?.get === 'function' ? meta.get(META_KEY) : meta?.[META_KEY];
  return raw && typeof raw === 'object' ? raw : {};
}

/**
 * Instagram DM auto-reply. Called from the DM webhook after the message is recorded and
 * after visual flows had their chance (a started flow owns the conversation). Never throws.
 *
 * Skipped when: no enabled rule matches, a team member has taken over the chat, or an
 * "any message" rule already answered this conversation inside its cool-down.
 * The DM is inside Meta's 24-hour window (the customer just wrote), goes through the
 * ban-safety guard and is recorded in the inbox as an automated reply.
 */
export async function runInstagramDmAutomations({ business, lead, conversation, event }) {
  try {
    const ig = business?.integrationCredentials?.instagram || {};
    const rules = ig.dmAutomations || [];
    if (!rules.length || !event?.senderId || !event.text) return { replied: false, reason: 'no_rules' };
    if (conversation?.inboxStatus === 'intervened') return { replied: false, reason: 'taken_over' };

    const log = readReplyLog(conversation);
    const rule = findDmRule(rules, event.text, { lastRepliedAt: (id) => log[id] || null });
    if (!rule) return { replied: false, reason: 'no_match' };

    let text = null;
    if (rule.replyMode === 'ai') {
      text = await generateAutoReply({
        business,
        lead,
        channel: 'instagram',
        incomingText: event.text,
        instruction: rule.aiInstruction || rule.message || '',
        kind: 'dm',
      });
    }
    if (!text) text = pickVariant(rule.message || '');
    if (!text) return { replied: false, reason: 'empty_reply' };

    await sendJitter();
    const res = await sendInstagramMessage(business, event.senderId, text);
    if (!res?.success) {
      console.error('[IG DM automation] reply not sent:', res?.error);
      return { replied: false, reason: res?.kind || 'send_failed' };
    }

    await recordChannelMessage({
      businessId: business._id,
      channel: 'instagram',
      leadId: lead._id,
      conversationId: conversation?._id,
      messageId: res.messageId,
      direction: 'outgoing',
      type: 'text',
      content: { body: text, participantId: event.senderId },
      status: 'sent',
      origin: 'automation',
    }).catch((err) => console.error('[IG DM automation] record failed:', err.message));

    const now = new Date();
    await Promise.all([
      conversation?._id
        ? Conversation.updateOne({ _id: conversation._id }, { $set: { [`metadata.${META_KEY}`]: { ...log, [rule.id]: now } } })
        : null,
      Business.updateOne(
        { _id: business._id, 'integrationCredentials.instagram.dmAutomations.id': rule.id },
        { $inc: { 'integrationCredentials.instagram.dmAutomations.$.triggeredCount': 1 } }
      ),
    ]).catch(() => {});

    return { replied: true, ruleId: rule.id };
  } catch (err) {
    console.error('[IG DM automation] failed:', err.message);
    return { replied: false, reason: 'error' };
  }
}
