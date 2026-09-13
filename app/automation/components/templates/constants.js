import { LayoutTemplate, Handshake, Clock } from 'lucide-react';
import { WhatsAppIcon, GmailIcon } from '../chat/BrandIcons';

export const PLACEHOLDERS = [
  { label: 'Lead name', value: '{{lead.name}}' },
  { label: 'Lead email', value: '{{lead.email}}' },
  { label: 'Lead phone', value: '{{lead.phone}}' },
  { label: 'Your name', value: '{{user.name}}' },
  { label: 'Company', value: '{{business.name}}' },
];

export const TABS = [
  { id: 'library', label: 'Library', icon: LayoutTemplate, desc: 'Quick-reply templates for your team' },
  { id: 'welcome', label: 'Welcome', icon: Handshake, desc: 'Auto-sent when a new lead arrives' },
  { id: 'followup', label: 'Follow-up', icon: Clock, desc: 'Timed check-in if no response' },
];

export const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, color: '#25D366' },
  { id: 'email', label: 'Email', icon: GmailIcon, color: '#1D4B3E' },
];

export const DEFAULT_WELCOME = {
  subject: 'Welcome to LeadForGrow!',
  body: 'Hi {{lead.name}},\n\nThanks for your interest. We will be in touch shortly.\n\nBest,\nThe LeadForGrow Team',
  enabled: true,
};

export const DEFAULT_FOLLOWUP = {
  subject: 'Just checking in…',
  body: 'Hi {{lead.name}},\n\nI wanted to follow up on my previous message. Do you have any questions?\n\nBest,\n{{user.name}}',
  delayHours: 24,
  enabled: true,
};

export function applyPreview(text) {
  if (!text) return '';
  return text
    .replace(/\{\{lead\.name\}\}/gi, 'John Doe')
    .replace(/\{\{lead\.email\}\}/gi, 'john@example.com')
    .replace(/\{\{lead\.phone\}\}/gi, '+91 98765 43210')
    .replace(/\{\{user\.name\}\}/gi, 'Alex')
    .replace(/\{\{business\.name\}\}/gi, 'Your Business');
}

export function newManualTemplate() {
  return {
    name: 'New template',
    subject: 'Subject line',
    body: 'Hi {{lead.name}}, …',
    channel: 'whatsapp',
    enabled: true,
    isMetaTemplate: false,
    metaCategory: '',
    metaStatus: '',
  };
}
