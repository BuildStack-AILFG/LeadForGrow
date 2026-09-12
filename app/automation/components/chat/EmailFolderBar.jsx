'use client';

import { useState, useEffect } from 'react';
import { Inbox, Send, FileText, Trash2, Star } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export default function EmailFolderBar({ active, onChange }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    authFetch('/api/automation/inbox/email/folders?folder=inbox')
      .then((r) => r.json())
      .then((d) => { if (d.counts) setCounts(d.counts); });
  }, []);

  return (
    <div className="flex gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
      {FOLDERS.map((f) => {
        const Icon = f.icon;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
              active === f.id ? 'bg-[#1D4B3E] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
            }`}
          >
            <Icon className="w-3 h-3" />
            {f.label}
            {counts[f.id] > 0 && <span className="ml-0.5 opacity-80">({counts[f.id]})</span>}
          </button>
        );
      })}
    </div>
  );
}
