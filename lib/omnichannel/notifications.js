import Notification from '@/models/automation/Notification';
import User from '@/models/User';
import { emitNotification } from '@/lib/realtime/publish';

export const INBOX_TYPES = {
  whatsapp: 'whatsapp_message',
  instagram: 'instagram_message',
  facebook: 'facebook_message',
  email: 'email_message',
};

export async function notifyInboxMessage({ businessId, lead, channel, preview, conversationId, leadId }) {
  const type = INBOX_TYPES[channel] || 'whatsapp_message';
  const users = await User.find({ businessId, isActive: { $ne: false } }).select('_id').lean();

  const notifications = [];
  for (const u of users) {
    const n = await Notification.create({
      businessId,
      userId: u._id,
      type,
      title: `New ${channel} message`,
      message: `${lead?.name || 'Customer'}: ${preview?.substring(0, 80) || 'New message'}`,
      link: `/automation/chat?leadId=${leadId}`,
      metadata: { channel, conversationId, leadId },
    });
    notifications.push(n);
    await emitNotification(businessId, {
      notificationId: n._id,
      userId: u._id,
      type,
      title: n.title,
      message: n.message,
      link: n.link,
    });
  }
  return notifications;
}

export async function notifyConversationAssigned({ businessId, toUserId, conversationId, channel, assignedBy }) {
  const n = await Notification.create({
    businessId,
    userId: toUserId,
    type: 'conversation_assigned',
    title: 'Conversation assigned to you',
    message: `A ${channel} conversation was assigned to you`,
    link: `/automation/chat?conversationId=${conversationId}`,
    metadata: { conversationId, channel, assignedBy },
  });
  await emitNotification(businessId, {
    notificationId: n._id,
    userId: toUserId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
  });
  return n;
}

export async function notifyInternalMention({ businessId, userId, conversationId, mentionedBy, preview }) {
  const n = await Notification.create({
    businessId,
    userId,
    type: 'internal_mention',
    title: 'Mentioned in internal note',
    message: preview?.substring(0, 100) || 'You were mentioned',
    link: `/automation/chat?conversationId=${conversationId}`,
    metadata: { conversationId, mentionedBy },
  });
  await emitNotification(businessId, {
    notificationId: n._id,
    userId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
  });
  return n;
}

export default { notifyInboxMessage, notifyConversationAssigned, notifyInternalMention };
