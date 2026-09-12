export const CHANNEL_FILTERS = [
  { id: 'all', label: 'All channels' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
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
  automation: { label: 'Auto', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  sequence: { label: 'Sequence', bg: 'bg-lime-50 text-lime-700 border-lime-200' },
  broadcast: { label: 'Broadcast', bg: 'bg-green-50 text-green-700 border-green-200' },
  meeting: { label: 'Meeting', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  system: { label: 'System', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', bg: 'bg-emerald-50 text-emerald-700' },
  instagram: { label: 'Instagram', color: '#E4405F', bg: 'bg-pink-50 text-pink-700' },
  email: { label: 'Email', color: '#4285F4', bg: 'bg-blue-50 text-blue-700' },
};

export { PIPELINE_STAGES } from '../leads/constants';

export const QUICK_EMOJIS = ['😊', '👍', '🙏', '✅', '👋', '📞', '💬', '🎉'];
