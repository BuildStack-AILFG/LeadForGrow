'use client';

import { Reply, MessageCircle, MessageSquare, UserX, LayoutGrid } from 'lucide-react';

/**
 * Channel-aware triage row for Instagram / Facebook, which have both DMs and
 * public post comments — a distinction WhatsApp/email don't share. "Needs reply"
 * keeps nothing waiting; DMs / Comments split the two workflows.
 */
const FILTERS = [
  { id: 'needs_reply', label: 'Needs reply', icon: Reply, priority: true },
  { id: 'dm', label: 'DMs', icon: MessageCircle },
  { id: 'comment', label: 'Comments', icon: MessageSquare },
  { id: 'unassigned', label: 'Unassigned', icon: UserX },
  { id: 'all', label: 'All', icon: LayoutGrid },
];

export default function SocialFilterBar({ active = 'all', onChange, channel = 'instagram', needsReplyCount }) {
  const accent = channel === 'facebook' ? 'bg-[#1877F2]' : 'bg-[#D4537E]';
  return (
    <div className="flex gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
      {FILTERS.map((f) => {
        const isActive = active === f.id;
        const Icon = f.icon;
        const backlog = f.priority && needsReplyCount > 0;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap ${
              isActive
                ? (f.priority ? 'bg-rose-600 text-white' : `${accent} text-white`)
                : backlog
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {f.label}
            {f.id === 'needs_reply' && needsReplyCount > 0 && <span className="ml-0.5 opacity-80">({needsReplyCount})</span>}
          </button>
        );
      })}
    </div>
  );
}
