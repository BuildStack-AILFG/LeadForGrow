'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import Checkbox from '@/app/components/ui/Checkbox';
import EmptyState from '@/app/components/ui/EmptyState';
import { TABLE_COLUMNS } from './constants';
import ContactRow from './ContactRow';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 text-fg-disabled" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-fg" />
    : <ChevronDown className="w-3 h-3 text-fg" />;
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
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left border-collapse">
          <thead className="sticky top-0 z-[2] bg-subtle">
            <tr>
              <th className="h-9 w-10 border-b border-line pl-4 pr-2">
                <Checkbox aria-label="Select all contacts" checked={allSelected} onChange={onToggleSelectAll} />
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
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} >
                  <EmptyState compact title="No contacts match your filters." description="Try a different search or clear a filter." />
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
