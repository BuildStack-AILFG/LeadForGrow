'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import Checkbox from '@/app/components/ui/Checkbox';
import EmptyState from '@/app/components/ui/EmptyState';
import { TABLE_COLUMNS } from './constants';
import CompanyRow from './CompanyRow';
import { ownerName } from './utils';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 text-fg-disabled" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-fg" />
    : <ChevronDown className="w-3 h-3 text-fg" />;
}

function groupCompanies(companies, groupBy) {
  if (!groupBy || groupBy === 'none') return [{ label: null, items: companies }];

  const groups = {};
  for (const c of companies) {
    let key = 'Other';
    if (groupBy === 'industry') key = c.industry || 'No industry';
    else if (groupBy === 'status') key = c.status || 'prospect';
    else if (groupBy === 'owner') key = ownerName(c.ownerId);
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({ label, items }));
}

export default function CompanyTable({
  companies,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onMenuAction,
  sortField,
  sortDir,
  onSort,
  groupBy = 'none',
}) {
  const allSelected = companies.length > 0 && selectedIds.length === companies.length;
  const groups = groupCompanies(companies, groupBy);

  const sortKeyMap = {
    name: 'name',
    industry: 'industry',
    lastActivity: 'updatedAt',
    status: 'status',
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left border-collapse">
          <thead className="sticky top-0 z-[2] bg-subtle">
            <tr>
              <th className="h-9 w-10 border-b border-line pl-4 pr-2">
                <Checkbox aria-label="Select all companies" checked={allSelected} onChange={onToggleSelectAll} />
              </th>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="h-9 whitespace-nowrap border-b border-line px-3 text-dense font-medium text-fg-secondary"
                  style={{ minWidth: col.minWidth }}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKeyMap[col.key] || col.key)}
                      className="inline-flex items-center gap-1 hover:text-fg"
                    >
                      {col.label}
                      <SortIcon field={sortKeyMap[col.key] || col.key} sortField={sortField} sortDir={sortDir} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th className="h-9 w-10 border-b border-line px-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} >
                  <EmptyState compact title="No companies match your filters." description="Try a different search or clear a filter." />
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                group.label ? (
                  <GroupSection key={group.label} label={group.label} count={group.items.length}>
                    {group.items.map((company) => (
                      <CompanyRow
                        key={company._id}
                        company={company}
                        selected={selectedIds.includes(company._id)}
                        onSelect={onToggleSelect}
                        onOpen={onOpen}
                        onMenuAction={onMenuAction}
                      />
                    ))}
                  </GroupSection>
                ) : (
                  group.items.map((company) => (
                    <CompanyRow
                      key={company._id}
                      company={company}
                      selected={selectedIds.includes(company._id)}
                      onSelect={onToggleSelect}
                      onOpen={onOpen}
                      onMenuAction={onMenuAction}
                    />
                  ))
                )
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupSection({ label, count, children }) {
  return (
    <>
      <tr className="bg-subtle">
        <td colSpan={99} className="py-2 px-4 text-meta font-semibold text-fg-tertiary">
          {label} · {count}
        </td>
      </tr>
      {children}
    </>
  );
}
