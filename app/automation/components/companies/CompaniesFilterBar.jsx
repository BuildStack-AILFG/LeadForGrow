'use client';

import { INDUSTRIES, COMPANY_STATUSES, SORT_OPTIONS, GROUP_OPTIONS } from './constants';

export default function CompaniesFilterBar({
  filters,
  onFilterChange,
  teamMembers = [],
  showFilters,
  showSort,
  showGroup,
  groupBy,
  onGroupChange,
}) {
  if (!showFilters && !showSort && !showGroup) return null;

  const selectCls = 'text-[12px] px-2.5 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg text-[#344054] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#101828]/10';

  return (
    <div className="mb-4 p-4 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-3">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={filters.industry} onChange={(e) => onFilterChange({ industry: e.target.value, page: 1 })} className={selectCls}>
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })} className={selectCls}>
            <option value="">All Statuses</option>
            {COMPANY_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={filters.ownerId} onChange={(e) => onFilterChange({ ownerId: e.target.value, page: 1 })} className={selectCls}>
            <option value="">All Owners</option>
            <option value="unassigned">Unassigned</option>
            {(teamMembers || []).map((m) => {
              const id = m.userId?._id || m.userId || m._id;
              const label = [m.userId?.firstName || m.firstName, m.userId?.lastName || m.lastName].filter(Boolean).join(' ') || m.userId?.email || m.email;
              return <option key={id} value={id}>{label}</option>;
            })}
          </select>
          <select value={filters.hasOpenDeals} onChange={(e) => onFilterChange({ hasOpenDeals: e.target.value, page: 1 })} className={selectCls}>
            <option value="">All Deals</option>
            <option value="yes">Has Open Deals</option>
            <option value="no">No Open Deals</option>
          </select>
          <label className="inline-flex items-center gap-2 text-[12px] text-[#475467] dark:text-slate-300 px-2">
            <input
              type="checkbox"
              checked={filters.recentlyAdded}
              onChange={(e) => onFilterChange({ recentlyAdded: e.target.checked, page: 1 })}
              className="rounded border-[#D0D5DD] dark:border-slate-700"
            />
            Recently Added
          </label>
          {(filters.industry || filters.status || filters.ownerId || filters.hasOpenDeals || filters.recentlyAdded) && (
            <button
              type="button"
              onClick={() => onFilterChange({ industry: '', status: '', ownerId: '', hasOpenDeals: '', recentlyAdded: false, page: 1 })}
              className="text-[12px] text-[#667085] dark:text-slate-300 hover:text-[#344054] dark:hover:text-slate-200 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {showSort && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2F4F7] dark:border-slate-700">
          <span className="text-[11px] font-medium text-[#98A2B3] dark:text-slate-400 uppercase tracking-wide mr-1">Sort by</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onFilterChange({ sort: opt.key, page: 1 })}
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                filters.sort === opt.key
                  ? 'bg-[#101828] dark:bg-slate-700 text-white border-[#101828] dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 text-[#475467] dark:text-slate-300 border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F9FAFB] dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFilterChange({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })}
            className="px-2.5 py-1.5 text-[12px] rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-[#475467] dark:text-slate-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800"
          >
            {filters.dir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
      )}

      {showGroup && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2F4F7] dark:border-slate-700">
          <span className="text-[11px] font-medium text-[#98A2B3] dark:text-slate-400 uppercase tracking-wide mr-1">Group by</span>
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onGroupChange(opt.key)}
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                groupBy === opt.key
                  ? 'bg-[#101828] dark:bg-slate-700 text-white border-[#101828] dark:border-slate-700'
                  : 'bg-white dark:bg-slate-900 text-[#475467] dark:text-slate-300 border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F9FAFB] dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
