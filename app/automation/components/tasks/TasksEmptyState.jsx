'use client';

import { CheckCircle2, Plus } from 'lucide-react';

export default function TasksEmptyState({ filter, onCreate }) {
  const messages = {
    today: 'No tasks due today. You are on track.',
    overdue: 'No overdue tasks — great work.',
    upcoming: 'No upcoming tasks scheduled.',
    all: 'No pending tasks yet.'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">All caught up</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {messages[filter] || messages.all}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
      >
        <Plus className="w-4 h-4" /> Create follow-up
      </button>
    </div>
  );
}
