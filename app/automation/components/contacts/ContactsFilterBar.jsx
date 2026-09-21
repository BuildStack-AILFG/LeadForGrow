'use client';

import { CONTACT_TYPES, SORT_OPTIONS } from './constants';

export default function ContactsFilterBar({
  filters,
  onFilterChange,
  teamMembers = [],
  showFilters,
  showSort,
}) {
  if (!showFilters && !showSort) return null;

  const selectCls = 'text-[12px] px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#101828]/10';

  return (
    <div className="mb-4 p-4 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] space-y-3">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <select value={filters.type} onChange={(e) => onFilterChange({ type: e.target.value, page: 1 })} className={selectCls}>
            <option value="">All Types</option>
            {CONTACT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
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
          <label className="inline-flex items-center gap-2 text-[12px] text-[#475467] px-2">
            <input
              type="checkbox"
              checked={filters.recentlyAdded}
              onChange={(e) => onFilterChange({ recentlyAdded: e.target.checked, page: 1 })}
              className="rounded border-[#D0D5DD]"
            />
            Recently Added
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] text-[#475467] px-2">
            <input
              type="checkbox"
              checked={filters.archived}
              onChange={(e) => onFilterChange({ archived: e.target.checked, page: 1 })}
              className="rounded border-[#D0D5DD]"
            />
            Archived only
          </label>
          {(filters.type || filters.ownerId || filters.hasOpenDeals || filters.recentlyAdded || filters.archived) && (
            <button
              type="button"
              onClick={() => onFilterChange({ type: '', ownerId: '', hasOpenDeals: '', recentlyAdded: false, archived: false, page: 1 })}
              className="text-[12px] text-[#667085] hover:text-[#344054] underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {showSort && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F2F4F7]">
          <span className="text-[11px] font-medium text-[#98A2B3] uppercase tracking-wide mr-1">Sort by</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onFilterChange({ sort: opt.key, page: 1 })}
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                filters.sort === opt.key
                  ? 'bg-[#101828] text-white border-[#101828]'
                  : 'bg-white text-[#475467] border-[#E5E7EB] hover:bg-[#F9FAFB]'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFilterChange({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })}
            className="px-2.5 py-1.5 text-[12px] rounded-lg border border-[#E5E7EB] text-[#475467] hover:bg-[#F9FAFB]"
          >
            {filters.dir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
      )}
    </div>
  );
}
