'use client';

import { CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { TABLE_COLUMNS } from './constants';
import CompanyRow from './CompanyRow';
import { ownerName } from './utils';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 text-[#D0D5DD]" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-[#101828] dark:text-slate-100" />
    : <ChevronDown className="w-3 h-3 text-[#101828] dark:text-slate-100" />;
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
    <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left border-collapse">
          <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
            <tr>
              <th className="py-3 pl-3 pr-2 w-10">
                <button type="button" onClick={onToggleSelectAll} className="text-[#98A2B3] dark:text-slate-400 hover:text-[#344054] dark:hover:text-slate-200">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-[#101828] dark:text-slate-100" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="py-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-[#667085] dark:text-slate-300 whitespace-nowrap"
                  style={{ minWidth: col.minWidth }}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(sortKeyMap[col.key] || col.key)}
                      className="inline-flex items-center gap-1 hover:text-[#101828] dark:hover:text-slate-100"
                    >
                      {col.label}
                      <SortIcon field={sortKeyMap[col.key] || col.key} sortField={sortField} sortDir={sortDir} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th className="py-3 px-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} className="py-16 text-center text-[13px] text-[#667085] dark:text-slate-300">
                  No companies match your filters.
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
      <tr className="bg-[#FAFBFC] dark:bg-slate-900">
        <td colSpan={99} className="py-2 px-4 text-[11px] font-semibold uppercase tracking-wide text-[#667085] dark:text-slate-300">
          {label} · {count}
        </td>
      </tr>
      {children}
    </>
  );
}
