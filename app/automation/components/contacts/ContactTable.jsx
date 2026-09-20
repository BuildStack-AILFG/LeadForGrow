'use client';

import { CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { TABLE_COLUMNS } from './constants';
import ContactRow from './ContactRow';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 text-[#D0D5DD]" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-[#101828] dark:text-slate-100" />
    : <ChevronDown className="w-3 h-3 text-[#101828] dark:text-slate-100" />;
}

export default function ContactTable({
  contacts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onMenuAction,
  sortField,
  sortDir,
  onSort,
}) {
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  const sortKeyMap = {
    contact: 'fullName',
    lastActivity: 'updatedAt',
    type: 'type',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left border-collapse">
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
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} className="py-16 text-center text-[13px] text-[#667085] dark:text-slate-300">
                  No contacts match your filters.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <ContactRow
                  key={contact._id}
                  contact={contact}
                  selected={selectedIds.includes(contact._id)}
                  onSelect={onToggleSelect}
                  onOpen={onOpen}
                  onMenuAction={onMenuAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
