export const CHANNEL_FILTERS = [
  { id: 'all', label: 'All channels' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'email', label: 'Email' },
];

// The inbox opens on a few QUEUES (what a person needs to act on), each with a live count; everything else is a
// secondary view under "More". `count` = the key in /api/automation/inbox/counts; `empty` = the message when the
// queue is clear (an empty queue is good news, not "no results").
export const INBOX_PRIMARY_VIEWS = [
  { id: 'needs_reply', label: 'Needs reply', count: 'needs_reply', hint: 'Customers who wrote last and are waiting for an answer. Longest wait first.', empty: 'Nobody is waiting for a reply. Inbox zero.' },
  { id: 'mine', label: 'Mine', count: 'mine', hint: 'Conversations assigned to you.', empty: 'Nothing is assigned to you right now.' },
  { id: 'unassigned', label: 'Unassigned', count: 'unassigned', hint: 'Conversations nobody owns yet.', empty: 'Every conversation has an owner.' },
  { id: 'all', label: 'All', hint: 'Every open conversation, newest first.', empty: 'No conversations yet.' },
];

export const INBOX_MORE_VIEWS = [
  { id: 'taken_over', label: 'Taken over', count: 'taken_over', hint: 'A team member took the conversation over from the bot.', empty: 'No conversation is taken over by your team.' },
  { id: 'automated', label: 'Bot handling', hint: 'Conversations where the last message was sent by an automation.', empty: 'No conversation is being handled by automation.' },
  { id: 'unread', label: 'Unread', count: 'unread', hint: 'Conversations you have not opened.', empty: 'Everything has been read.' },
  { id: 'human', label: 'Human replies', hint: 'Conversations where the last message was written by a person.', empty: 'No conversations with human replies.' },
  { id: 'hot', label: 'Hot leads', hint: 'High-priority leads.', empty: 'No hot leads in the loaded conversations.' },
  { id: 'followup', label: 'Follow-up due', hint: 'Leads whose follow-up is due today or earlier.', empty: 'No follow-ups are due.' },
  { id: 'pinned', label: 'Pinned', hint: 'Conversations you pinned.', empty: 'Nothing is pinned.' },
  { id: 'archived', label: 'Archived', hint: 'Archived conversations.', empty: 'Nothing is archived.' },
];

export const INBOX_FILTERS = [...INBOX_PRIMARY_VIEWS, ...INBOX_MORE_VIEWS];
export const INBOX_VIEW_IDS = INBOX_FILTERS.map((f) => f.id);

// Visual tag on each message — matches Message.origin values. Rendered as
// a small pill next to the sender name in the message list.
export const ORIGIN_META = {
  user: null, // no pill for human-composed
  automation: { label: 'Auto', bg: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  sequence: { label: 'Sequence', bg: 'bg-lime-50 dark:bg-lime-950/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800' },
  broadcast: { label: 'Broadcast', bg: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
  meeting: { label: 'Meeting', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  system: { label: 'System', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

export const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
  instagram: { label: 'Instagram', color: '#E4405F', bg: 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300' },
  facebook: { label: 'Facebook', color: '#1877F2', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
  email: { label: 'Email', color: '#4285F4', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
};

export { PIPELINE_STAGES } from '../leads/constants';

export const QUICK_EMOJIS = ['😊', '👍', '🙏', '✅', '👋', '📞', '💬', '🎉'];

// Emoji picker in the composer: grouped, scrollable, 8 per row. Business-chat oriented (a garage, a clinic, a shop),
// not the full Unicode set. No ZWJ sequences, so every entry renders as a single glyph on all platforms.
export const EMOJI_GROUPS = [
  { id: 'recent', label: 'Frequently used', emojis: QUICK_EMOJIS },
  { id: 'smileys', label: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '😉', '😍', '🥰', '😘', '😎', '🤗', '🤔', '😐', '😢', '😭', '😡'] },
  { id: 'gestures', label: 'Gestures', emojis: ['👎', '👏', '🙌', '🤝', '👌', '✌️', '🤞', '👉', '👈', '💪', '🙋', '🤙'] },
  { id: 'business', label: 'Business & travel', emojis: ['📅', '⏰', '📍', '📦', '💰', '💳', '🧾', '📝', '📎', '📷', '🔧', '🛠️', '🚗', '🏍️', '🛵', '⛽', '🔑', '🏠'] },
  { id: 'symbols', label: 'Symbols', emojis: ['❌', '⭐', '🔥', '❤️', '💯', '⚠️', 'ℹ️', '🎁', '🎊', '✨'] },
];
