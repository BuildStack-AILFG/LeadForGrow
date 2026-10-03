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
  automation: { label: 'Auto', bg: 'bg-accent-subtle text-accent-fg border-line' },
  sequence: { label: 'Sequence', bg: 'bg-lime-50 text-lime-700 border-lime-200' },
  broadcast: { label: 'Broadcast', bg: 'bg-accent-subtle text-accent-fg border-line' },
  meeting: { label: 'Meeting', bg: 'bg-accent-subtle text-accent-fg border-line' },
  system: { label: 'System', bg: 'bg-muted text-fg-secondary border-line' },
};

export const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', bg: 'bg-accent-subtle text-accent-fg' },
  instagram: { label: 'Instagram', color: '#E4405F', bg: 'bg-pink-50 text-pink-700' },
  email: { label: 'Email', color: '#4285F4', bg: 'bg-info-subtle text-info' },
};

export { PIPELINE_STAGES } from '../leads/constants';

export const QUICK_EMOJIS = ['😊', '👍', '🙏', '✅', '👋', '📞', '💬', '🎉'];
