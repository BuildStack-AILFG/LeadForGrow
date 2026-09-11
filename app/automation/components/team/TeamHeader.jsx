'use client';

import { UserPlus, RefreshCw } from 'lucide-react';

export default function TeamHeader({ total, active, onAdd, onRefresh, refreshing }) {
  return (
    <header className="sticky top-0 z-30 bg-[#f8f9fc]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">Team</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {total} members · {active} active · Lead assignment & performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add member
          </button>
        </div>
      </div>
    </header>
  );
}
