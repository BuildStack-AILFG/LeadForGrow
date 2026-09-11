'use client';

import { RefreshCw, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PERIOD_OPTIONS } from './constants';
import ExportControls from './ExportControls';

export default function ReportsHeader({
  period,
  onPeriodChange,
  refreshing,
  onRefresh,
  reports,
  metrics,
  savedViews,
  onSaveView,
  onApplyView
}) {
  const [viewsOpen, setViewsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#f8f9fc]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sales intelligence · Pipeline performance · Team insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodChange(p.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setViewsOpen(!viewsOpen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              Saved views <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {viewsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setViewsOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
                  {savedViews.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-500">No saved views</p>
                  ) : (
                    savedViews.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { onApplyView(v); setViewsOpen(false); }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {v.name}
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => { onSaveView(); setViewsOpen(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-teal-600 border-t border-slate-100 dark:border-slate-800"
                  >
                    Save current view
                  </button>
                </div>
              </>
            )}
          </div>

          <ExportControls reports={reports} metrics={metrics} />

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live data
          </span>
        </div>
      </div>
    </header>
  );
}
