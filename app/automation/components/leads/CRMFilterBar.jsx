'use client';

import { useState } from 'react';
import { ChevronDown, BookmarkPlus } from 'lucide-react';
import { SMART_VIEWS, SOURCE_OPTIONS, PIPELINE_STAGES } from './constants';
import { mapTeamMemberOptions } from './utils';

export default function CRMFilterBar({
  filters,
  onFilterChange,
  smartViews,
  savedViews,
  onSaveView,
  onApplySavedView,
  teamMembers
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveName, setSaveName] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {smartViews.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onFilterChange({ view: view.id, status: 'all' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${filters.view === view.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300'
              }`}
          >
            {view.label}
          </button>
        ))}
        {savedViews.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onApplySavedView(view)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900"
          >
            {view.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ status: e.target.value, view: 'all' })}
          className="text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Statuses</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
          <option value="converted">Converted</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => onFilterChange({ source: e.target.value })}
          className="text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.assignedTo}
          onChange={(e) => onFilterChange({ assignedTo: e.target.value, view: 'all' })}
          className="text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
          <option value="">All Agents</option>
          <option value="me">My Leads</option>
          <option value="unassigned">Unassigned</option>
          {mapTeamMemberOptions(teamMembers).map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.showConverted}
            onChange={(e) => onFilterChange({ showConverted: e.target.checked, view: 'all' })}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show converted
        </label>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Date range <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <input
            type="text"
            placeholder="Save view as..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="text-xs px-2 py-1.5 w-28 sm:w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
          <button
            type="button"
            disabled={!saveName.trim()}
            onClick={() => { onSaveView(saveName.trim()); setSaveName(''); }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
            title="Save current filters"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <label className="text-xs text-slate-500">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
            className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          />
          <label className="text-xs text-slate-500">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ dateTo: e.target.value })}
            className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          />
          {(filters.dateFrom || filters.dateTo) && (
            <button
              type="button"
              onClick={() => onFilterChange({ dateFrom: '', dateTo: '' })}
              className="text-xs text-teal-600 hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}
