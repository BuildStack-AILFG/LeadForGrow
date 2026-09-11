'use client';

import Link from 'next/link';
import { CheckSquare, Square, ChevronUp, ChevronDown, Users, Plus } from 'lucide-react';
import { TABLE_COLUMNS, TABLE_COL_LINE, TABLE_ROW_LINE } from './constants';
import LeadRow from './LeadRow';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 text-[#D0D5DD]" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-[#059669]" />
    : <ChevronDown className="w-3 h-3 text-[#059669]" />;
}

function headerAlignClass(align) {
  return align === 'left' ? 'text-left' : 'text-center';
}

export default function LeadTable({
  leads,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDrawer,
  onConvert,
  teamMembers,
  onAssign,
  onStatusChange,
  onCall,
  onRowColorChange,
  sortField,
  sortDir,
  onSort
}) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  return (
    <div className="bg-white border border-[#E8ECEF] rounded-[12px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-separate border-spacing-0">
          <thead className={`sticky top-0 z-10 bg-[#FAFBFC] ${TABLE_ROW_LINE}`}>
            <tr>
              <th className={`py-3.5 pl-3 pr-2 w-10 ${TABLE_COL_LINE}`}>
                <button type="button" onClick={onToggleSelectAll} className="text-[#98A2B3] hover:text-[#059669]">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-[#059669]" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#667085] whitespace-nowrap ${headerAlignClass(col.align)} ${TABLE_COL_LINE}`}
                  style={{ minWidth: col.minWidth }}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-[#344054] transition-colors ${
                        col.align === 'center' ? 'justify-center w-full' : ''
                      }`}
                    >
                      {col.label}
                      <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th className="py-3.5 px-2 w-28 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#667085] text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#98A2B3]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#344054]">No leads found</p>
                      <p className="text-sm text-[#667085] mt-0.5">Try clearing filters, or capture your first lead.</p>
                    </div>
                    <Link
                      href="/automation/integrations"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#059669] hover:bg-[#163B8E] rounded-lg"
                    >
                      <Plus className="w-4 h-4" /> Add lead source
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow
                  key={lead._id}
                  lead={lead}
                  selected={selectedIds.includes(lead._id)}
                  onSelect={onToggleSelect}
                  onOpenDrawer={onOpenDrawer}
                  onConvert={onConvert}
                  teamMembers={teamMembers}
                  onAssign={onAssign}
                  onStatusChange={onStatusChange}
                  onCall={onCall}
                  onRowColorChange={onRowColorChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
