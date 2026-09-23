'use client';

import { useState, useEffect } from 'react';
import { Inbox, Send, FileText, Trash2, Star, ShieldAlert, Reply } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

const FOLDERS = [
  // "Needs reply" leads: the customers waiting on us are the whole point of a
  // CRM inbox, so this sits first and gets a red accent when there's a backlog.
  { id: 'needs_reply', label: 'Needs reply', icon: Reply, priority: true },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'spam', label: 'Spam', icon: ShieldAlert },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function EmailFolderBar({ active, onChange, needsReplyCount }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    authFetch('/api/automation/inbox/email/folders?folder=inbox')
      .then((r) => r.json())
      .then((d) => { if (d.counts) setCounts(d.counts); });
  }, []);

  const allCounts = { ...counts, needs_reply: needsReplyCount };

  return (
    <div className="flex gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
      {FOLDERS.map((f) => {
        const Icon = f.icon;
        const count = allCounts[f.id];
        const isActive = active === f.id;
        // The needs-reply pill turns red when there's an unanswered backlog, so
        // it draws the eye even when it isn't the selected folder.
        const backlog = f.priority && count > 0;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
              isActive
                ? (f.priority ? 'bg-rose-600 text-white' : 'bg-brand text-white')
                : backlog
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {f.label}
            {count > 0 && <span className="ml-0.5 opacity-80">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
