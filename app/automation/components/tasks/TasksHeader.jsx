'use client';

import { Search, Plus, RefreshCw } from 'lucide-react';

export default function TasksHeader({
  search,
  onSearchChange,
  total,
  refreshing,
  onRefresh,
  onCreate
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#f8f9fc]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">Tasks & Follow-ups</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {total.toLocaleString()} tasks · Daily sales actions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search task, lead, phone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
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
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Task</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
