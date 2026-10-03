/**
 * Which channel(s) does this lead actually talk to us on?
 *
 * The lead-details page used to assume WhatsApp for everything (header button, tab, panel title, composer,
 * send endpoint), so an Instagram lead showed "WhatsApp conversation" and a reply would have gone to the
 * WhatsApp API. The truth is on each message (`channel`) and its conversation (`conversationId`).
 */

export const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Messenger',
  email: 'Email',
};

const CHANNEL_ORDER = ['whatsapp', 'instagram', 'facebook', 'email'];

const SOURCE_TO_CHANNEL = {
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  facebook: 'facebook',
  facebook_ad: 'facebook',
  email: 'email',
  gmail: 'email',
};

/** Channels with real (non-internal) messages, in a stable order. */
export function getMessageChannels(messages = []) {
  const seen = new Set();
  messages.forEach((m) => {
    if (!m?.isInternal && CHANNEL_LABELS[m?.channel]) seen.add(m.channel);
  });
  return CHANNEL_ORDER.filter((c) => seen.has(c));
}

/** Channel of the most recent message; falls back to the lead's source, then WhatsApp. */
export function getPrimaryChannel(lead, messages = []) {
  const real = messages.filter((m) => !m?.isInternal && CHANNEL_LABELS[m?.channel]);
  if (real.length) {
    const latest = real.reduce((a, b) => (new Date(b.timestamp || 0) >= new Date(a.timestamp || 0) ? b : a));
    return latest.channel;
  }
  return SOURCE_TO_CHANNEL[lead?.source] || 'whatsapp';
}

/** Channels the composer may send on: every channel already in the thread, plus WhatsApp when there is a phone number. */
export function getReplyChannels(lead, messages = []) {
  const channels = new Set(getMessageChannels(messages));
  const fallback = SOURCE_TO_CHANNEL[lead?.source];
  if (fallback && !channels.size) channels.add(fallback);
  if (lead?.phone) channels.add('whatsapp');
  return CHANNEL_ORDER.filter((c) => channels.has(c));
}

/** Latest conversation on a channel — the inbox send route needs it to know WHO to reply to (IG/FB recipient id, email thread). */
export function getConversationId(messages = [], channel) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m?.channel === channel && !m?.isInternal && m?.conversationId) return String(m.conversationId);
  }
  return null;
}

export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;
const COMMENT_PREFIXES = ['ig_comment:', 'fb_comment:'];
const WINDOWED_CHANNELS = new Set(['whatsapp', 'instagram', 'facebook']);

/**
 * WhatsApp, Instagram and Messenger only let a business message someone within 24h of THEIR last message.
 * Returns { state: 'open', msLeft } | { state: 'closed' } | { state: 'unknown' } | { state: 'none' }:
 *  - none    -> channel has no window (email) or the thread is a public comment (replying to a comment isn't windowed)
 *  - unknown -> no usable incoming timestamp; callers must NOT restrict the user on a guess
 * The thread checked is the same conversation the send route will reply to (getConversationId).
 */
export function getReplyWindow(messages = [], channel, now = Date.now()) {
  if (!WINDOWED_CHANNELS.has(channel)) return { state: 'none' };
  const conversationId = getConversationId(messages, channel);
  const thread = messages.filter(
    (m) => !m?.isInternal && m?.channel === channel && (!conversationId || String(m.conversationId) === conversationId)
  );
  const isComment = thread.some((m) => COMMENT_PREFIXES.some((p) => String(m.content?.participantId || '').startsWith(p)));
  if (isComment) return { state: 'none', comment: true };
  const incoming = thread
    .filter((m) => m.direction === 'incoming' && m.timestamp)
    .map((m) => new Date(m.timestamp).getTime())
    .filter(Number.isFinite);
  if (!incoming.length) return { state: 'unknown' };
  const lastIncomingAt = Math.max(...incoming);
  const msLeft = lastIncomingAt + REPLY_WINDOW_MS - now;
  return msLeft > 0 ? { state: 'open', msLeft, lastIncomingAt } : { state: 'closed', lastIncomingAt };
}

/** 5h 20m / 40m */
export function formatWindowLeft(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * A concrete "what to do next" from the lead's real conversation, or null when we replied last
 * (callers then fall back to the generic stage-based suggestion).
 */
export function getChannelSuggestion(messages = [], now = Date.now()) {
  const real = messages.filter((m) => !m?.isInternal && CHANNEL_LABELS[m?.channel]);
  if (!real.length) return null;
  const latest = real.reduce((a, b) => (new Date(b.timestamp || 0) >= new Date(a.timestamp || 0) ? b : a));
  if (latest.direction !== 'incoming') return null;
  const label = CHANNEL_LABELS[latest.channel];
  const w = getReplyWindow(messages, latest.channel, now);
  if (w.state === 'open') return { tone: 'action', text: `Reply on ${label}: ${formatWindowLeft(w.msLeft)} left in the 24-hour window` };
  if (w.state === 'closed') {
    return {
      tone: 'warning',
      text: latest.channel === 'whatsapp'
        ? 'WhatsApp window closed. Send a template to re-engage.'
        : `${label} window closed. You can reply once they message again.`,
    };
  }
  return { tone: 'action', text: `Reply to their ${label} message` };
}

/** Public Instagram handle for the profile link (null when unknown or not a valid handle). */
export function getInstagramHandle(lead) {
  const meta = lead?.metadata;
  const fromMeta = meta?.instagramUsername || (typeof meta?.get === 'function' ? meta.get('instagramUsername') : null);
  const fromName = lead?.source === 'instagram' && String(lead?.name || '').startsWith('@') ? lead.name.slice(1) : null;
  const handle = String(fromMeta || fromName || '').replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

/** Instagram / Messenger leads normally have no phone number, so "open wa.me" is meaningless for them. */
export function canOpenWhatsApp(lead) {
  return Boolean(lead?.phone);
}
