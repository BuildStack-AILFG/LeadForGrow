export const CHANNEL_FILTERS = [
  { id: 'all', label: 'All channels' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'email', label: 'Email' },
];

export const INBOX_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'intervened', label: 'Live' },
  { id: 'automated', label: 'Automated' },
  { id: 'human', label: 'Human replies' },
  { id: 'hot', label: 'Hot Leads' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'archived', label: 'Archived' },
];

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
