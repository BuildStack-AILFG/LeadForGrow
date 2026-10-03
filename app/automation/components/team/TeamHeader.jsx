'use client';

import { UserPlus, RefreshCw } from 'lucide-react';

export default function TeamHeader({ total, active, onAdd, onRefresh, refreshing }) {
  return (
    <header className="sticky top-0 z-30 bg-canvas border-b border-line dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page font-semibold text-fg">Team</h1>
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">
            {total} members · {active} active · Lead assignment & performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-line dark:border-slate-700 bg-canvas dark:bg-slate-900 text-fg-secondary hover:bg-subtle disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
          >
            <UserPlus className="w-4 h-4" /> Add member
          </button>
        </div>
      </div>
    </header>
  );
}
