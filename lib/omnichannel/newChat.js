/**
 * A "new chat" is a lead that has never messaged: there is no conversation in the database yet, only the lead. The Inbox
 * still shows it in the normal chat layout (header, empty thread, CRM panel) by selecting a VIRTUAL conversation built
 * from the lead. The hook already treats ids starting with "temp_" as "no conversation record yet" (messages are read by
 * lead id, assign / mark-read use the lead), so the virtual chat needs no special server support. The first message can
 * only be an approved template (WhatsApp does not allow free text to someone who has not written in the last 24 hours);
 * once it is sent the real conversation exists and replaces the virtual one.
 */
export const NEW_CHAT_PREFIX = 'temp_new_';

export function makeNewChat(lead) {
  return {
    _id: `${NEW_CHAT_PREFIX}${lead._id}`,
    isNew: true,
    channel: 'whatsapp',
    leadId: { ...lead },
    participantName: lead.name,
    participantPhone: lead.phone,
    inboxStatus: 'read',
    status: 'open',
    unreadCount: 0,
    lastMessagePreview: '',
  };
}

export const isNewChat = (chat) => Boolean(chat?.isNew) && String(chat?._id || '').startsWith(NEW_CHAT_PREFIX);
