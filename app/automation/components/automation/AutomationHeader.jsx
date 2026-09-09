'use client';

import { Search, Plus, RefreshCw, ChevronDown, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FILTER_OPTIONS } from './constants';

export default function AutomationHeader({
  total,
  activeCount,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  refreshing,
  onRefresh,
  onCreate
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilter = FILTER_OPTIONS.find((f) => f.id === statusFilter);

  return (
    <header className="sticky top-0 z-30 bg-[#f8f9fc]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">Automation Rules</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automatically handle repetitive sales and communication tasks — {total} automations · {activeCount} active.
            </p>
            <Link
              href="/help/automation-rules"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-1.5"
            >
              <BookOpen className="w-3 h-3" /> Learn how automations work
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 self-start px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Cloud engine active</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search automations..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50"
              >
                {activeFilter?.label || 'Filter'}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
                    {FILTER_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onStatusFilterChange(f.id);
                          setFilterOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          statusFilter === f.id ? 'text-blue-600 font-medium' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

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
              data-tour="automation-create-btn"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Automation</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
