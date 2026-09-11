'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Download,
  Upload,
  RefreshCw,
  LayoutList,
  Columns3,
  ChevronDown
} from 'lucide-react';

export default function LeadsHeader({
  search,
  onSearchChange,
  total,
  refreshing,
  onRefresh,
  viewMode,
  onViewModeChange,
  onExport
}) {
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-[16px] font-semibold text-[#222222] dark:text-slate-50">Leads</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {total.toLocaleString()} leads · Sales workspace
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto lg:ml-auto lg:max-w-4xl">
            <div className="relative flex-1 min-w-[200px] lg:min-w-[380px]" data-tour="leads-search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search name, phone, email..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearchChange(search);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-[#D0D4E1] dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex rounded border border-[#D0D4E1] dark:border-slate-700 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => onViewModeChange('table')}
                  className={`p-2 ${viewMode === 'table' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600'}`}
                  title="Table view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  data-tour="leads-pipeline-toggle"
                  onClick={() => onViewModeChange('kanban')}
                  className={`p-2 ${viewMode === 'kanban' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600'}`}
                  title="Pipeline view"
                >
                  <Columns3 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="p-2 rounded border border-[#D0D4E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:bg-slate-50 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setExportOpen(!exportOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#222222] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#D0D4E1] dark:border-slate-700 rounded hover:bg-slate-50 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-[#D0D4E1] dark:border-slate-700 rounded shadow-lg z-20 py-1">
                      <button type="button" onClick={() => { onExport('excel'); setExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Excel</button>
                      <button type="button" onClick={() => { onExport('pdf'); setExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">PDF</button>
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/automation/leads/bulk"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#222222] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#D0D4E1] dark:border-slate-700 rounded hover:bg-slate-50 shrink-0 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" /> Import
              </Link>

              <Link
                href="/automation/leads/new"
                data-tour="leads-add-btn"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded shadow-sm shrink-0 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Lead</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
