'use client';

import { Briefcase, Plus } from 'lucide-react';
import { TABLE_COLUMNS } from './constants';
import DealRow from './DealRow';
import { ChevronUp, ChevronDown } from 'lucide-react';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 text-[#D0D5DD]" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-[#101828] dark:text-slate-100" />
    : <ChevronDown className="w-3 h-3 text-[#101828] dark:text-slate-100" />;
}

const sortKeyMap = {
  deal: 'title',
  closeDate: 'expectedCloseDate',
};

export default function DealTable({
  deals,
  stages,
  onOpen,
  onEdit,
  onDelete,
  onStageChange,
  onCreate,
  sortField,
  sortDir,
  onSort,
  hasActiveFilters,
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
            <tr>
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
            {deals.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1}>
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#F9FAFB] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 flex items-center justify-center mb-3">
                      <Briefcase className="w-5 h-5 text-[#98A2B3] dark:text-slate-400" />
                    </div>
                    <p className="text-[14px] font-medium text-[#101828] dark:text-slate-100">No deals found</p>
                    <p className="text-[13px] text-[#667085] dark:text-slate-300 mt-1 max-w-sm">
                      {hasActiveFilters
                        ? 'Try a different search or filter.'
                        : 'Create your first deal to start tracking pipeline revenue.'}
                    </p>
                    {!hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onCreate}
                        className="mt-4 inline-flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-white bg-[#101828] dark:bg-slate-700 hover:bg-[#1F2937] rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                        New Deal
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <DealRow
                  key={deal._id}
                  deal={deal}
                  stages={stages}
                  onOpen={onOpen}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStageChange={onStageChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
