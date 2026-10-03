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

  const selectCls = 'text-meta px-2.5 py-2 bg-canvas border border-line rounded-lg text-fg-secondary focus:outline-none focus:ring-2 focus:ring-line';

  return (
    <div className="mb-4 p-4 bg-canvas border border-line rounded-lg space-y-3">
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
          <label className="inline-flex items-center gap-2 text-meta text-fg-secondary px-2">
            <input
              type="checkbox"
              checked={filters.recentlyAdded}
              onChange={(e) => onFilterChange({ recentlyAdded: e.target.checked, page: 1 })}
              className="rounded border-line-strong"
            />
            Recently Added
          </label>
          {(filters.type || filters.ownerId || filters.hasOpenDeals || filters.recentlyAdded) && (
            <button
              type="button"
              onClick={() => onFilterChange({ type: '', ownerId: '', hasOpenDeals: '', recentlyAdded: false, page: 1 })}
              className="text-meta text-fg-tertiary hover:text-fg-secondary underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {showSort && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line">
          <span className="text-meta font-medium text-fg-tertiary mr-1">Sort by</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onFilterChange({ sort: opt.key, page: 1 })}
              className={`px-2.5 py-1.5 text-[12px] rounded-lg border transition-colors ${
                filters.sort === opt.key
                  ? 'bg-accent text-white border-accent'
                  : 'bg-canvas text-fg-secondary border-line hover:bg-subtle'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onFilterChange({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })}
            className="px-2.5 py-1.5 text-meta rounded-lg border border-line text-fg-secondary hover:bg-subtle"
          >
            {filters.dir === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>
      )}
    </div>
  );
}
