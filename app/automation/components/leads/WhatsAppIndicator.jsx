'use client';

import { getWhatsAppStatus } from './utils';

export default function WhatsAppIndicator({ lead }) {
  const wa = getWhatsAppStatus(lead);
  if (wa.key === 'none') {
    return <span className="text-xs text-fg-tertiary">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-fg-secondary dark:text-fg-tertiary">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wa.dot}`} />
      {wa.label}
    </span>
  );
}
