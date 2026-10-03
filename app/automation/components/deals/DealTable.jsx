'use client';

import { Handshake, Plus } from 'lucide-react';
import { TABLE_COLUMNS } from './constants';
import DealRow from './DealRow';
import { TableFrame, Table, THead, Th } from '@/app/components/ui/DataTable';
import EmptyState from '@/app/components/ui/EmptyState';
import Button from '@/app/components/ui/Button';

const sortKeyMap = { deal: 'title', closeDate: 'expectedCloseDate' };

export default function DealTable({ deals, stages, onOpen, onEdit, onDelete, onStageChange, onCreate, sortField, sortDir, onSort, hasActiveFilters }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <TableFrame>
        <Table className="min-w-[1000px]">
          <THead>
            <tr>
              {TABLE_COLUMNS.map((col) => {
                const key = sortKeyMap[col.key] || col.key;
                return (
                  <Th key={col.key} align={col.align} sort={sortField === key ? sortDir : undefined} onSort={col.sortable ? () => onSort(key) : undefined}>
                    <span className="inline-block" style={{ minWidth: col.align === 'right' ? undefined : col.minWidth }}>{col.label}</span>
                  </Th>
                );
              })}
              <Th align="right" width={56}>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </THead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1}>
                  {hasActiveFilters ? (
                    <EmptyState icon={Handshake} title="No deals match your filters." description="Try a different search or clear a filter." />
                  ) : (
                    <EmptyState
                      icon={Handshake}
                      title="No deals yet."
                      description="Deals you create or convert from leads appear here."
                      action={<Button variant="primary" icon={Plus} onClick={onCreate}>New deal</Button>}
                    />
                  )}
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <DealRow key={deal._id} deal={deal} stages={stages} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onStageChange={onStageChange} />
              ))
            )}
          </tbody>
        </Table>
      </TableFrame>
    </div>
  );
}
