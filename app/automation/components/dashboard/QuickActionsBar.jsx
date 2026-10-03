'use client';

import Link from 'next/link';
import { Plus, Upload, MessageSquare, UserCheck, ListFilter } from 'lucide-react';

const actions = [
  { label: 'New Lead', href: '/automation/leads/new', icon: Plus },
  { label: 'Import', href: '/automation/leads?import=1', icon: Upload },
  { label: 'WhatsApp', href: '/automation/chat', icon: MessageSquare },
  { label: 'Assign', href: '/automation/leads?action=assign', icon: UserCheck },
  { label: 'Filter Leads', href: '/automation/leads', icon: ListFilter }
];

export default function QuickActionsBar() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-fg-secondary dark:text-fg-disabled bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg hover:border-line dark:hover:border-teal-800 hover:text-accent-fg dark:hover:text-accent-fg transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </Link>
      ))}
    </div>
  );
}
