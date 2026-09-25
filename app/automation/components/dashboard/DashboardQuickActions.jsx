'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Calendar, CheckSquare, Upload, FileText, X } from 'lucide-react';

const ACTIONS = [
  { label: 'Create Lead', href: '/automation/leads/new', icon: Plus },
  { label: 'Create Deal', href: '/automation/deals?create=1', icon: Briefcase },
  { label: 'Book Meeting', href: '/automation/meetings/create', icon: Calendar },
  { label: 'Create Task', href: '/automation/tasks?create=1', icon: CheckSquare },
  { label: 'Import Leads', href: '/automation/leads/bulk', icon: Upload },
  { label: 'Generate Quote', href: '/automation/deals', icon: FileText },
];

export default function DashboardQuickActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2">
          {ACTIONS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-transform hover:scale-105"
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
