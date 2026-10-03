'use client';

import { FILTERS, SORT_OPTIONS } from './constants';

export default function DealsFilterBar({
  filters,
  onFilterChange,
  stages = [],
  teamMembers = [],
  showFilters,
  showSort,
  filteredCount,
  totalCount,
}) {
  if (!showFilters && !showSort) return null;

  const selectCls = 'text-meta px-2.5 py-2 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg text-fg-secondary dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-line';

  return (
    <div className="mb-4 p-4 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg space-y-3">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mr-1">Status</span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange({ status: f.id })}
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                filters.status === f.id
                  ? 'bg-accent dark:bg-slate-700 text-white border-accent dark:border-slate-700'
                  : 'bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-fg-disabled border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="w-px h-6 bg-muted dark:bg-slate-800 mx-1 hidden sm:block" />

          <select
            value={filters.stage}
            onChange={(e) => onFilterChange({ stage: e.target.value })}
            className={selectCls}
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <select
            value={filters.ownerId}
            onChange={(e) => onFilterChange({ ownerId: e.target.value })}
            className={selectCls}
          >
            <option value="">All Owners</option>
            <option value="unassigned">Unassigned</option>
            {(teamMembers || []).map((m) => {
              const id = m.userId?._id || m.userId || m._id;
              const label = [m.userId?.firstName || m.firstName, m.userId?.lastName || m.lastName].filter(Boolean).join(' ') || m.userId?.email || m.email;
              return <option key={id} value={id}>{label}</option>;
            })}
          </select>

          {(filters.stage || filters.ownerId || filters.status !== 'all') && (
            <button
              type="button"
              onClick={() => onFilterChange({ status: 'all', stage: '', ownerId: '' })}
              className="text-meta text-fg-tertiary dark:text-fg-disabled hover:text-fg-secondary dark:hover:text-slate-200 underline"
            >
              Clear filters
            </button>
          )}

          {filteredCount != null && (
            <span className="text-meta text-fg-tertiary dark:text-fg-tertiary tabular-nums ml-auto">
              Showing {filteredCount} of {totalCount}
            </span>
          )}
        </div>
      )}

      {showSort && (() => {
        const activeSort = SORT_OPTIONS.find((o) => o.key === filters.sort) || SORT_OPTIONS[0];
        return (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line dark:border-slate-700">
            <span className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mr-1">Sort by</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onFilterChange({ sort: opt.key })}
                className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                  filters.sort === opt.key
                    ? 'bg-accent dark:bg-slate-700 text-white border-accent dark:border-slate-700'
                    : 'bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-fg-disabled border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {/* Names the active sort field directly on the toggle (was a bare
                "Ascending/Descending" with no indication of which field it applied to). */}
            <button
              type="button"
              onClick={() => onFilterChange({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })}
              title={`Currently sorting by ${activeSort.label}`}
              className="px-2.5 py-1.5 text-meta rounded-md border border-line dark:border-slate-700 text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800"
            >
              {activeSort.label} {filters.dir === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        );
      })()}
    </div>
  );
}
