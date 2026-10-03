'use client';

import { Search, RefreshCw, Plus, Download } from 'lucide-react';

export default function CrmListHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  total,
  refreshing,
  onRefresh,
  onCreate,
  createLabel = 'Create',
  onExport,
}) {
  return (
    <div className="pt-6 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page font-semibold text-fg">{title}</h1>
          {subtitle && <p className="text-sm text-fg-tertiary mt-1">{subtitle}</p>}
          {total !== undefined && (
            <p className="text-xs text-fg-tertiary mt-1">{total.toLocaleString()} records</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-900 w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled border border-line dark:border-slate-700 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-fg-tertiary hover:text-fg-secondary border border-line dark:border-slate-700 rounded-lg"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
            >
              <Plus className="w-4 h-4" />
              {createLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
