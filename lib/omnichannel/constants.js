export const CHANNELS = ['whatsapp', 'instagram', 'facebook', 'email'];

export const CHANNEL_META = {
  whatsapp: { label: 'WhatsApp', color: '#25D366', icon: 'whatsapp' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: 'instagram' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'facebook' },
  email: { label: 'Email', color: '#6366f1', icon: 'mail' },
};

export const CONVERSATION_STATUSES = ['open', 'closed', 'spam', 'archived'];

export const INBOX_STATUSES = ['unread', 'read', 'intervened'];

export const MESSAGE_ACTIVITY_MAP = {
  whatsapp: { incoming: 'whatsapp_received', outgoing: 'contacted_whatsapp' },
  instagram: { incoming: 'instagram_received', outgoing: 'instagram_sent' },
  email: { incoming: 'email_received', outgoing: 'email_sent' },
};
