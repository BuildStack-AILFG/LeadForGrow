'use client';

import { toast } from 'react-hot-toast';
import { WhatsAppIcon, InstagramIcon, FacebookIcon, GmailIcon } from './BrandIcons';
import { CHANNEL_META } from '@/lib/omnichannel/constants';

const ICONS = { whatsapp: WhatsAppIcon, instagram: InstagramIcon, facebook: FacebookIcon, email: GmailIcon };

/**
 * The card inside the "new message" toast: the channel's REAL brand mark (the toast used a 💬 emoji, which draws as a
 * generic purple bubble, and any channel it did not know was labelled WhatsApp), who wrote, and a one-line preview.
 */
export function IncomingMessageCard({ channel, senderName, preview }) {
  const Icon = ICONS[channel] || WhatsAppIcon;
  const label = CHANNEL_META[channel]?.label || 'WhatsApp';
  return (
    <div className="flex items-start gap-3 max-w-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-3 shadow-lg" role="status">
      <Icon colored className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">New {label} message</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
          <span className="font-medium text-slate-800 dark:text-slate-100">{senderName || 'A customer'}</span>
          {preview ? `: ${preview}` : ''}
        </p>
      </div>
    </div>
  );
}

/** One toast per message (the message id is the toast id, so a duplicate realtime event cannot stack a second one). */
export function showIncomingMessageToast({ channel, senderName, preview, messageId }) {
  return toast.custom(
    () => <IncomingMessageCard channel={channel} senderName={senderName} preview={preview} />,
    { duration: 4500, ...(messageId ? { id: `incoming_${messageId}` } : {}) }
  );
}
