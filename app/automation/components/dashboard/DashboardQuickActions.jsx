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
        <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg shadow-modal p-2 min-w-[180px] ">
          {ACTIONS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-fg-secondary dark:text-fg-disabled hover:bg-accent-subtle dark:hover:bg-emerald-950/30 hover:text-accent-fg dark:hover:text-accent-fg rounded-lg transition-colors"
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
        className="w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white shadow-popover flex items-center justify-center transition-transform hover:scale-105"
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
