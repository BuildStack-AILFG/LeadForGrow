import Conversation from '@/models/omnichannel/Conversation';
import WhatsAppConversation from '@/models/automation/WhatsAppConversation';
import Message from '@/models/automation/Message';
import Activity from '@/models/automation/Activity';
import { MESSAGE_ACTIVITY_MAP } from '@/lib/omnichannel/constants';
import { emitChatMessage, emitChatRead, emitDashboardMetrics } from '@/lib/realtime/publish';
import { notifyInboxMessage, notifyConversationAssigned } from '@/lib/omnichannel/notifications';

function previewFromMessage({ type, body, subject, isInternal }) {
  if (isInternal) return `📝 ${body?.substring(0, 80) || 'Internal note'}`;
  if (type === 'image') return '📷 Image';
  if (type === 'video') return '🎥 Video';
  if (type === 'audio') return '🎤 Audio';
  if (type === 'document') return '📎 Document';
  // For emails, prefer the actual body text over the subject — the subject
  // by itself is redundant with the sticky subject bar above the thread
  // AND with the ConversationItem's title. Body preview is what agents
  // actually scan the sidebar for. Collapse whitespace + strip any stray
  // HTML that leaked past the sync pipeline.
  if (type === 'email') {
    const cleanBody = (body || '')
      .replace(/<[^>]+>/g, ' ')       // strip stray tags
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')            // collapse whitespace
      .trim();
    if (cleanBody) return cleanBody.substring(0, 120);
    return (subject || 'New email').substring(0, 100);
  }
  return body?.substring(0, 100) || 'New message';
}

/**
 * Migrate legacy WhatsAppConversation rows into unified Conversation.
 *
 * This is a one-time backfill from the pre-omnichannel schema. Runs bulk
 * (one $in check + one insertMany for the diff), and is guarded by a
 * per-business in-memory flag so it fires at most once per process boot
 * per business — new messages already write to Conversation directly, so
 * re-running the sync on every inbox fetch was pure waste (~30ms/row × N
 * legacy rows added seconds of latency to /conversations).
 */
const legacySyncCache = new Map(); // businessId -> timestamp
const LEGACY_SYNC_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function syncLegacyWhatsAppConversations(businessId) {
  const key = String(businessId);
  const lastRun = legacySyncCache.get(key);
  if (lastRun && Date.now() - lastRun < LEGACY_SYNC_TTL_MS) return;
  legacySyncCache.set(key, Date.now());

  const [legacy, existing] = await Promise.all([
    WhatsAppConversation.find({ businessId }).lean(),
    Conversation.find({ businessId, channel: 'whatsapp' }).select('leadId').lean(),
  ]);
  if (!legacy.length) return;

  const existingLeadIds = new Set(existing.map((c) => String(c.leadId)));
  const toInsert = legacy
    .filter((row) => row.leadId && !existingLeadIds.has(String(row.leadId)))
    .map((row) => ({
      businessId,
      channel: 'whatsapp',
      leadId: row.leadId,
      assignedTo: row.assignedTo,
      inboxStatus: row.status || 'read',
      unreadCount: row.unreadCount || 0,
      lastMessageAt: row.lastMessageAt,
      lastMessagePreview: row.lastMessagePreview,
      lastMessageDirection: row.lastMessageDirection,
      isArchived: row.isArchived || false,
      participantId: String(row.leadId),
    }));

  if (!toInsert.length) return;
  try {
    await Conversation.insertMany(toInsert, { ordered: false });
  } catch (err) {
    // Duplicate key from the unique (businessId, participantId, channel) index
    // is fine — race with a concurrent writer. Any other error should surface.
    if (err?.code !== 11000) throw err;
  }
}

export async function upsertConversation(businessId, {
  channel,
  leadId,
  contactId,
  companyId,
  dealId,
  participantId,
  participantName,
  participantEmail,
  participantPhone,
  assignedTo,
  direction = 'incoming',
  preview,
  timestamp = new Date(),
  incrementUnread = false,
  inboxStatus,
  emailAccountId,   // Which mailbox this conversation belongs to (email only).
  emailThreadId,    // Optional: link to EmailThread when we already know it.
  origin,           // Provenance of the message causing this upsert.
}) {
  const update = {
    leadId,
    contactId,
    companyId,
    dealId,
    participantName,
    participantEmail,
    participantPhone,
    lastMessageAt: timestamp,
    lastMessagePreview: preview,
    lastMessageDirection: direction,
  };
  // Track inbound-only preview so a customer reply keeps showing in the
  // sidebar even after we broadcast a template on top.
  if (direction === 'incoming') {
    update.lastInboundAt = timestamp;
    update.lastInboundPreview = preview;
  }
  if (assignedTo) update.assignedTo = assignedTo;

  // Preserve a human-intervened conversation: an incoming message must never
  // downgrade an 'intervened' conversation back to 'unread', otherwise the AI
  // auto-reply agent would wrongly resume after a human has taken over.
  // Intervention may live in either store (inbox vs legacy chat), so check both.
  let effectiveInboxStatus = inboxStatus;
  if (inboxStatus === 'unread') {
    const [omni, legacy] = await Promise.all([
      Conversation.findOne({ businessId, channel, participantId: participantId || String(leadId) })
        .select('inboxStatus').lean(),
      channel === 'whatsapp' && leadId
        ? WhatsAppConversation.findOne({ businessId, leadId }).select('status').lean()
        : Promise.resolve(null),
    ]);
    if (omni?.inboxStatus === 'intervened' || legacy?.status === 'intervened') {
      effectiveInboxStatus = 'intervened';
    }
  }
  if (effectiveInboxStatus) update.inboxStatus = effectiveInboxStatus;
  if (origin) update.lastMessageOrigin = origin;

  const inc = incrementUnread ? { unreadCount: 1 } : {};

  // emailAccountId is set ONLY on insert. This is the immutable-sender rule:
  // once a conversation is pinned to a mailbox, reassigning users doesn't
  // migrate it. If we included emailAccountId in $set, every incoming reply
  // would overwrite the pinning — a subtle bug that took a red-team pass
  // to catch, hence this comment being twice as long as the code.
  const setOnInsert = {
    businessId,
    channel,
    participantId: participantId || String(leadId),
    status: 'open',
  };
  if (emailAccountId) setOnInsert.emailAccountId = emailAccountId;
  if (emailThreadId) setOnInsert.emailThreadId = emailThreadId;

  const conversation = await Conversation.findOneAndUpdate(
    { businessId, channel, participantId: participantId || String(leadId) },
    {
      $set: update,
      $setOnInsert: setOnInsert,
      ...(incrementUnread ? { $inc: inc } : {}),
    },
    { upsert: true, new: true }
  );

  // Keep legacy WhatsAppConversation in sync for backward compat
  if (channel === 'whatsapp' && leadId) {
    await WhatsAppConversation.findOneAndUpdate(
      { businessId, leadId },
      {
        $set: {
          lastMessageAt: timestamp,
          lastMessagePreview: preview,
          lastMessageDirection: direction,
          ...(effectiveInboxStatus ? { status: effectiveInboxStatus } : {}),
        },
        ...(incrementUnread ? { $inc: { unreadCount: 1 } } : {}),
      },
      { upsert: true }
    );
  }

  return conversation;
}

export async function recordChannelMessage({
  businessId,
  channel,
  leadId,
  contactId,
  companyId,
  dealId,
  conversationId,
  messageId,
  direction,
  type = 'text',
  content = {},
  timestamp = new Date(),
  status = 'received',
  isInternal = false,
  performedBy,
  subject,
  emailThreadId,
  rawMetadata,
  // Email mailbox folder ('inbox' | 'sent' | 'drafts' | 'trash' | 'starred').
  // Optional — when omitted the field stays unset (inbound stays null, which
  // the inbox query already treats as inbox). Outbound email callers pass
  // 'sent' so the message lands in the Sent tab.
  folder,
  // Email-only fields — persisted verbatim on Message + propagated to the
  // Conversation on first insert (via upsertConversation). Nullable for
  // other channels.
  emailAccountId,
  inReplyTo,
  references,
  headers,
  // Provenance — 'user' | 'automation' | 'sequence' | 'broadcast' | 'meeting'
  // | 'system'. Defaults to 'user' so callers that don't pass it retain
  // today's behavior; inbox filter reads this field.
  origin = 'user',
}) {
  const body = content.body || content.text || '';
  const preview = previewFromMessage({ type, body, subject, isInternal });

  // Idempotency: if this exact WhatsApp/provider message was already recorded
  // (e.g. the low-level sender recorded it, then the caller records again),
  // return the existing record instead of creating a duplicate.
  if (messageId) {
    const existing = await Message.findOne({ businessId, messageId });
    if (existing) {
      const existingConv = existing.conversationId
        ? await Conversation.findById(existing.conversationId)
        : null;
      return { message: existing, conversation: existingConv };
    }
  }

  let conversation = conversationId
    ? await Conversation.findById(conversationId)
    : null;

  if (!conversation) {
    conversation = await upsertConversation(businessId, {
      channel,
      leadId,
      contactId,
      companyId,
      dealId,
      participantId: content.participantId,
      participantName: content.participantName,
      participantEmail: content.participantEmail,
      participantPhone: content.participantPhone,
      direction,
      preview,
      timestamp,
      incrementUnread: direction === 'incoming' && !isInternal,
      inboxStatus: direction === 'incoming' && !isInternal ? 'unread' : undefined,
      // Only set on insert (immutable pin) — see upsertConversation.
      emailAccountId,
      emailThreadId,
      origin,
    });
  } else {
    await Conversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessageAt: timestamp,
        lastMessagePreview: preview,
        lastMessageDirection: direction,
        lastMessageOrigin: origin,
        ...(direction === 'incoming' && !isInternal
          ? { inboxStatus: 'unread', lastInboundAt: timestamp, lastInboundPreview: preview }
          : {}),
      },
      ...(direction === 'incoming' && !isInternal ? { $inc: { unreadCount: 1 } } : {}),
    });
  }

  const message = await Message.create({
    businessId,
    leadId,
    conversationId: conversation._id,
    channel,
    contactId: contactId || conversation.contactId,
    companyId: companyId || conversation.companyId,
    dealId: dealId || conversation.dealId,
    messageId,
    direction,
    type,
    content,
    timestamp,
    status,
    isInternal,
    subject,
    emailThreadId,
    emailAccountId,
    inReplyTo,
    references,
    headers,
    origin,
    rawMetadata,
    folder,
  });

  if (!isInternal) {
    const activityType = MESSAGE_ACTIVITY_MAP[channel]?.[direction === 'incoming' ? 'incoming' : 'outgoing'];
    if (activityType) {
      await Activity.create({
        businessId,
        leadId,
        contactId: contactId || conversation.contactId,
        entityType: 'lead',
        entityId: leadId,
        type: activityType,
        description: `${channel} ${direction === 'incoming' ? 'received' : 'sent'}: "${preview}"`,
        performedBy,
        metadata: { messageId, channel, conversationId: conversation._id },
      });
    }

    await emitChatMessage(businessId, {
      leadId,
      conversationId: conversation._id,
      channel,
      messageId: message._id,
      direction,
    });
    await emitDashboardMetrics(businessId, { type: 'inbox_update' });

    if (direction === 'incoming' && !isInternal) {
      const Lead = (await import('@/models/automation/Lead')).default;
      const lead = await Lead.findById(leadId).select('name').lean();
      await notifyInboxMessage({
        businessId,
        lead,
        channel,
        preview,
        conversationId: conversation._id,
        leadId,
      });
    }
  }

  return { message, conversation };
}

export async function markConversationRead(conversationId, businessId) {
  const conv = await Conversation.findOneAndUpdate(
    { _id: conversationId, businessId },
    { $set: { unreadCount: 0, inboxStatus: 'read' } },
    { new: true }
  );
  if (conv?.channel === 'whatsapp' && conv.leadId) {
    await WhatsAppConversation.findOneAndUpdate(
      { businessId, leadId: conv.leadId },
      { $set: { unreadCount: 0, status: 'read' } }
    );
  }
  await emitChatRead(businessId, { conversationId, leadId: conv?.leadId });
  return conv;
}

export async function assignConversation(conversationId, businessId, { toUserId, fromUserId, assignedBy, reason }) {
  const conv = await Conversation.findOne({ _id: conversationId, businessId });
  if (!conv) throw new Error('Conversation not found');

  const historyEntry = {
    fromUser: fromUserId || conv.assignedTo,
    toUser: toUserId,
    assignedBy,
    reason,
    assignedAt: new Date(),
  };

  conv.assignedTo = toUserId;
  conv.assignmentHistory.push(historyEntry);
  await conv.save();

  if (conv.channel === 'whatsapp' && conv.leadId) {
    await WhatsAppConversation.findOneAndUpdate(
      { businessId, leadId: conv.leadId },
      { $set: { assignedTo: toUserId } },
      { upsert: true }
    );
  }

  await Activity.create({
    businessId,
    leadId: conv.leadId,
    entityType: 'lead',
    entityId: conv.leadId,
    type: 'conversation_assigned',
    description: `Conversation assigned`,
    performedBy: assignedBy,
    metadata: { conversationId, toUserId, channel: conv.channel },
  });

  if (toUserId) {
    await notifyConversationAssigned({
      businessId,
      toUserId,
      conversationId,
      channel: conv.channel,
      assignedBy,
    });
  }

  return conv;
}

export default {
  syncLegacyWhatsAppConversations,
  upsertConversation,
  recordChannelMessage,
  markConversationRead,
  assignConversation,
};
