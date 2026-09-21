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

  const selectCls = 'text-[12px] px-2.5 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#344054] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#101828]/10';

  return (
    <div className="mb-4 p-4 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-3">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[#98A2B3] dark:text-slate-400 uppercase tracking-wide mr-1">Status</span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange({ status: f.id })}
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                filters.status === f.id
                  ? 'bg-[#101828] dark:bg-slate-700 text-white border-[#101828] dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 text-[#475467] dark:text-slate-300 border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F9FAFB] dark:hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}

          <div className="w-px h-6 bg-[#E5E7EB] dark:bg-slate-800 mx-1 hidden sm:block" />

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
              className="text-[12px] text-[#667085] dark:text-slate-300 hover:text-[#344054] dark:hover:text-slate-200 underline"
            >
              Clear filters
            </button>
          )}

          {filteredCount != null && (
            <span className="text-[12px] text-[#98A2B3] dark:text-slate-400 tabular-nums ml-auto">
              Showing {filteredCount} of {totalCount}
            </span>
          )}
        </div>
      )}

      {showSort && (() => {
        const activeSort = SORT_OPTIONS.find((o) => o.key === filters.sort) || SORT_OPTIONS[0];
        return (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2F4F7] dark:border-slate-700">
            <span className="text-[11px] font-medium text-[#98A2B3] dark:text-slate-400 uppercase tracking-wide mr-1">Sort by</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onFilterChange({ sort: opt.key })}
                className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                  filters.sort === opt.key
                    ? 'bg-[#101828] dark:bg-slate-700 text-white border-[#101828] dark:border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-[#475467] dark:text-slate-300 border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F9FAFB] dark:hover:bg-slate-800'
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
              className="px-2.5 py-1.5 text-[12px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-[#475467] dark:text-slate-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800"
            >
              {activeSort.label} {filters.dir === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        );
      })()}
    </div>
  );
}
