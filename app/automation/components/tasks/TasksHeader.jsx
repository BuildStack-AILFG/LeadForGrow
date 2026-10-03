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
    <header className="sticky top-0 z-30 bg-canvas/95 dark:bg-slate-950/95 border-b border-line/80 dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-page font-semibold text-fg">Tasks & Follow-ups</h1>
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">
            {total.toLocaleString()} tasks · Daily sales actions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
            <input
              type="search"
              placeholder="Search task, lead, phone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 rounded border border-line dark:border-slate-700 bg-canvas dark:bg-slate-900 text-fg-secondary hover:bg-subtle disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
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
