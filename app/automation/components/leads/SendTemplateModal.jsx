'use client';

import { X } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import OutOfWindowTemplateBar from '@/app/automation/components/chat/OutOfWindowTemplateBar';

/**
 * Send an approved WhatsApp template to a lead that has never messaged on WhatsApp (call / form / manual leads).
 * These leads have no conversation in the Inbox, so the Inbox button had nothing to open; free text is not allowed
 * to them either. Reuses the Inbox's template picker (variables, header media) and its send route, which creates
 * the conversation from the lead id.
 */
export default function SendTemplateModal({ lead, onClose, onSent }) {
  const send = async (template) => {
    const res = await authFetch('/api/automation/inbox/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead._id,
        channel: 'whatsapp',
        message: '',
        templateName: template.name,
        templateLanguage: template.language,
        templateHeaderMediaUrl: template.headerMediaUrl,
        templateVariables: template.variables,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'Send failed');
    onSent?.(lead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label="Send WhatsApp template"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <WhatsAppIcon colored className="w-4 h-4" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">WhatsApp {lead?.name ? `to ${lead.name}` : 'template'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <OutOfWindowTemplateBar firstContact leadName={lead?.name} lead={lead} onSend={send} />
      </div>
    </div>
  );
}
