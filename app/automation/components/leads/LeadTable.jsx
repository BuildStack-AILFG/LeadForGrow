'use client';

import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import { TABLE_COLUMNS } from './constants';
import LeadRow from './LeadRow';
import { TableFrame, Table, THead, Th } from '@/app/components/ui/DataTable';
import Checkbox from '@/app/components/ui/Checkbox';
import EmptyState from '@/app/components/ui/EmptyState';
import Button from '@/app/components/ui/Button';

/**
 * Leads list (DESIGN_BRIEF §8 data tables): sticky 36px header on bg-subtle,
 * 40px rows with hairline dividers, frozen name column, sortable headers,
 * checkbox column for bulk actions, row actions at the right edge.
 */
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
  onSendTemplate,
  onRowColorChange,
  sortField,
  sortDir,
  onSort,
}) {
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <TableFrame>
        <Table className="min-w-[1100px]">
          <THead>
            <tr>
              <Th width={44} className="!pr-0">
                <Checkbox aria-label="Select all leads" checked={allSelected} indeterminate={someSelected} onChange={onToggleSelectAll} />
              </Th>
              {TABLE_COLUMNS.map((col) => (
                <Th
                  key={col.key}
                  align={col.align}
                  sticky={col.key === 'name'}
                 
                  sort={sortField === col.key ? sortDir : undefined}
                  onSort={col.sortable ? () => onSort(col.key) : undefined}
                >
                  <span style={{ minWidth: col.minWidth }} className="inline-block">{col.label}</span>
                </Th>
              ))}
              <Th align="right" width={128}>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </THead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2}>
                  <EmptyState
                    icon={Users}
                    title="No leads match this view."
                    description="Try another view, clear a filter, or connect a lead source."
                    action={
                      <Link href="/automation/integrations" tabIndex={-1}>
                        <Button icon={Plus}>Connect a lead source</Button>
                      </Link>
                    }
                  />
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
                  onSendTemplate={onSendTemplate}
                  onRowColorChange={onRowColorChange}
                />
              ))
            )}
          </tbody>
        </Table>
      </TableFrame>
    </div>
  );
}
