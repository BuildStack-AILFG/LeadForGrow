'use client';

import Link from 'next/link';
import { Sparkles, Phone, MessageSquare, UserPlus, ChevronRight } from 'lucide-react';
import DashboardCard from './primitives/DashboardCard';

function Suggestion({ icon: Icon, title, description, href, accent }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 flex-shrink-0 mt-1 transition-colors" />
    </Link>
  );
}

export default function AiSuggestionsPanel({ notContacted = 0, overdueTasks = 0, unreadChats = 0 }) {
  const suggestions = [];

  if (notContacted > 0) {
    suggestions.push({
      icon: Phone,
      title: `${notContacted} lead${notContacted > 1 ? 's' : ''} awaiting first contact`,
      description: 'Reach out before they go cold.',
      href: '/automation/leads?filter=new',
      accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
    });
  }

  if (overdueTasks > 0) {
    suggestions.push({
      icon: UserPlus,
      title: `${overdueTasks} overdue follow-up${overdueTasks > 1 ? 's' : ''}`,
      description: 'Clear overdue tasks to stay on track.',
      href: '/automation/tasks?filter=overdue',
      accent: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
    });
  }

  if (unreadChats > 0) {
    suggestions.push({
      icon: MessageSquare,
      title: `${unreadChats} unread WhatsApp chat${unreadChats > 1 ? 's' : ''}`,
      description: 'Respond quickly to improve conversion.',
      href: '/automation/chat?status=unread',
      accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      icon: Sparkles,
      title: 'Pipeline looks healthy',
      description: 'No urgent actions — focus on nurturing warm leads.',
      href: '/automation/leads',
      accent: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
    });
  }

  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-teal-600" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suggested Actions</h3>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide ml-auto">Smart</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {suggestions.slice(0, 3).map((s) => (
          <Suggestion key={s.title} {...s} />
        ))}
      </div>
    </DashboardCard>
  );
}
