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
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-12 text-center">
      <div className="w-12 h-12 rounded-lg bg-canvas border border-line dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-fg-secondary dark:text-accent-fg" />
      </div>
      <h3 className="text-base font-semibold text-fg dark:text-slate-50 mb-1">All caught up</h3>
      <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mb-4">
        {messages[filter] || messages.all}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded"
      >
        <Plus className="w-4 h-4" /> Create follow-up
      </button>
    </div>
  );
}
