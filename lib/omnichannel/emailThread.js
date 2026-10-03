/**
 * Pure logic behind the email thread view (chat/EmailThread.jsx + EmailMessageCard.jsx): which messages are shown collapsed,
 * when a subject line is worth repeating, one-line snippets and card dates. Kept free of React so it can be unit-tested.
 */
import { cleanEmailPreview } from '@/lib/omnichannel/preview';

/**
 * Split a plain-text email body into NEW content and the QUOTED reply chain (Gmail "On … wrote:", Outlook dividers,
 * "From:/Sent:" blocks, or leading ">" lines). Moved here from MessageBubble so chat bubbles and email cards share it.
 */
export function splitQuotedBody(rawBody) {
  if (!rawBody) return { newBody: rawBody || '', quotedBody: '' };
  const markers = [
    /(^|\n)\s*On\s[\s\S]+?wrote:/i,
    /(^|\n)\s*-----\s*Original Message\s*-----/i,
    /(^|\n)\s*From:\s.+\r?\nSent:\s/i,
  ];
  let splitAt = -1;
  for (const m of markers) {
    const match = rawBody.match(m);
    if (match) {
      splitAt = match.index + (match[1] ? match[1].length : 0);
      break;
    }
  }
  if (splitAt < 0) {
    const lines = rawBody.split('\n');
    const quoteStartIdx = lines.findIndex((line) => /^\s*>/.test(line));
    if (quoteStartIdx > 0) splitAt = lines.slice(0, quoteStartIdx).join('\n').length;
  }
  if (splitAt < 0) return { newBody: rawBody, quotedBody: '' };
  return { newBody: rawBody.slice(0, splitAt).trim(), quotedBody: rawBody.slice(splitAt).trim() };
}

/** "Re: RE: Fwd: Hello  world" -> "hello world" (for comparing subjects across a thread). */
export function normalizeSubject(subject) {
  return String(subject || '')
    .replace(/^\s*(?:(?:re|fwd?|aw|sv)\s*:\s*)+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** The thread's subject = the first email message that has one. The sticky subject bar above the thread already shows it. */
export function threadSubject(messages = []) {
  const first = messages.find((m) => m?.type === 'email' && m.subject);
  return first?.subject || '';
}

/** Repeat a subject on a card only when it really changed (a "Re:" prefix is not a change). */
export function shouldShowSubject(message, threadSubj) {
  if (!message?.subject) return false;
  return normalizeSubject(message.subject) !== normalizeSubject(threadSubj);
}

/** Messages that are rendered as a full email card (everything else — notes, system rows, deleted — keeps its own compact row). */
export function isCardMessage(message) {
  return Boolean(message) && message.type === 'email' && !message.isInternal && !message.isDeleted && message.direction !== 'system';
}

/**
 * Which cards start collapsed to a single line?
 * Short threads (<= collapseAbove cards) are fully expanded. In longer ones only the newest card and the newest INCOMING
 * card (what we are replying to) stay open. "overrides" (id -> true = collapsed / false = open) is what the user toggled
 * and always wins.
 *
 * Returns { items: [{ message, card, collapsed }], collapsible } where collapsible = the thread is long enough to collapse.
 */
export function planThreadView(messages = [], { collapseAbove = 4, overrides = {} } = {}) {
  const cards = messages.filter(isCardMessage);
  const collapsible = cards.length > collapseAbove;
  const keepOpen = new Set();
  if (collapsible) {
    keepOpen.add(String(cards[cards.length - 1]._id ?? cards[cards.length - 1].messageId));
    for (let i = cards.length - 1; i >= 0; i -= 1) {
      if (cards[i].direction === 'incoming') { keepOpen.add(String(cards[i]._id ?? cards[i].messageId)); break; }
    }
  }
  const items = messages.map((message) => {
    const card = isCardMessage(message);
    const id = String(message._id ?? message.messageId);
    let collapsed = card && collapsible && !keepOpen.has(id);
    if (card && Object.prototype.hasOwnProperty.call(overrides, id)) collapsed = Boolean(overrides[id]);
    return { message, card, collapsed };
  });
  return { items, collapsible };
}

/** One readable line for a collapsed card: the new text (no quote, no URLs), or the first attachment name. */
export function snippetOf(message, max = 120) {
  const raw = message?.content?.body || '';
  const { newBody } = splitQuotedBody(raw);
  const text = cleanEmailPreview(newBody).replace(/\s+/g, ' ').trim();
  if (text) return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
  const att = Array.isArray(message?.content?.attachments) ? message.content.attachments[0] : null;
  if (att?.fileName) return att.fileName;
  return '(no text)';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** Card date, in the viewer's local time: "22:29" today, "12 Sep, 22:29" this year, "12 Sep 2025" before that. */
export function formatCardDate(ts, now = new Date()) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return time;
  if (d.getFullYear() === now.getFullYear()) return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Who sent this message? Same fallback chain the old bubble header used: the message's own participant fields first, then the
 * conversation's participant (correct for INCOMING mail in a 1:1 thread). Outgoing falls back to "You".
 */
export function senderOf(message, conversation) {
  const c = message?.content || {};
  const outgoing = message?.direction === 'outgoing';
  if (outgoing) return { outgoing, name: c.participantName || 'You', email: c.participantEmail || '' };
  return {
    outgoing,
    name: c.participantName
      || conversation?.participantName
      || conversation?.leadId?.name
      || c.participantEmail?.split('@')[0]
      || conversation?.participantEmail?.split('@')[0]
      || 'Contact',
    email: c.participantEmail || conversation?.participantEmail || conversation?.leadId?.email || '',
  };
}

/** Gmail-style second line: "to me · cc: Alice, Bob, +2 more" (incoming) or "to Himanshu" (outgoing). */
export function recipientLine(message, conversation) {
  const outgoing = message?.direction === 'outgoing';
  const cc = Array.isArray(message?.content?.cc) ? message.content.cc : [];
  const ccNames = cc.map((x) => x?.name || x?.address).filter(Boolean);
  const ccText = ccNames.length ? `cc: ${ccNames.slice(0, 3).join(', ')}${ccNames.length > 3 ? `, +${ccNames.length - 3} more` : ''}` : '';
  const to = outgoing
    ? `to ${conversation?.participantName || conversation?.leadId?.name || conversation?.participantEmail || 'recipient'}`
    : 'to me';
  return ccText ? `${to} · ${ccText}` : to;
}

export default { splitQuotedBody, normalizeSubject, threadSubject, shouldShowSubject, isCardMessage, planThreadView, snippetOf, formatCardDate, senderOf, recipientLine };
