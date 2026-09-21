/**
 * Turns the Inbox search API result into the rows of the dropdown (pure, so it can be unit tested).
 *
 * Conversations come first, then leads that have NO row above yet, then a few matching messages. A lead whose
 * conversation is already listed is skipped (same person twice is noise). A lead without a conversation is still
 * listed: clicking it starts a new WhatsApp chat (approved template) from the Inbox.
 */
export function buildSearchRows(results) {
  if (!results) return [];
  const convs = results.conversations || [];
  const listedConversationIds = new Set(convs.map((c) => String(c._id)));
  const rows = [];

  for (const c of convs) {
    rows.push({
      type: 'conversation',
      item: c,
      label: c.participantName || c.lastMessagePreview || 'Conversation',
      sub: c.participantPhone || c.participantEmail || '',
    });
  }

  for (const l of results.leads || []) {
    if (l.conversation && listedConversationIds.has(String(l.conversation._id))) continue;
    rows.push({
      type: 'lead',
      item: l,
      label: l.name || l.phone || l.email || 'Lead',
      sub: l.phone || l.email || '',
      hasChat: Boolean(l.conversation),
    });
  }

  for (const m of (results.messages || []).slice(0, 5)) {
    rows.push({ type: 'message', item: m, label: m.content?.body?.slice(0, 60) || 'Message', sub: '' });
  }
  return rows;
}
