'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { BusinessAssistantTrigger } from '../assistant/BusinessAssistantFab';

export default function DashboardHeader({
  businessName,
  refreshing,
  onRefresh,
  searchQuery,
  onSearchChange
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-2 bg-subtle/90 dark:bg-slate-950/90 border-b border-line/60 dark:border-slate-800">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary mb-0.5">Dashboard</p>
          <h1 className="text-page font-semibold text-fg truncate">
            {businessName || 'Sales Overview'}
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
            <input
              type="search"
              placeholder="Search leads, phone, email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/automation/leads?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg text-fg dark:text-slate-100 placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg border border-line dark:border-slate-700 bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/automation/leads/new"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Lead</span>
              <span className="sm:hidden">Lead</span>
            </Link>

            <BusinessAssistantTrigger />
          </div>
        </div>
      </div>
    </header>
  );
}
