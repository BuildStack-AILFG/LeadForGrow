'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DealKanbanCard from './DealKanbanCard';
import Badge from '@/app/components/ui/Badge';
import cx from '@/app/components/ui/cx';

/** Deal board column (DESIGN_BRIEF §8): stage dot + name + count, total value right. */
export default function DealKanbanColumn({ stage, stages, deals, formatValue, onOpenDeal }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const totalValue = deals.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  return (
    <section aria-label={stage.label} className="flex w-[288px] shrink-0 flex-col">
      <header className="flex h-9 items-center gap-2 px-1">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stage.color || 'var(--stage-1)' }} />
        <h3 className="truncate text-dense font-medium text-fg">{stage.label}</h3>
        <Badge count>{deals.length}</Badge>
        <span className="ml-auto text-meta text-fg-tertiary tabular" title={`${stage.probability ?? 0}% win probability`}>
          {formatValue(totalValue)}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={cx(
          'flex min-h-[160px] flex-1 flex-col gap-2 rounded-lg p-1 transition-colors duration-[var(--duration-fast)]',
          isOver ? 'bg-accent-subtle outline-1 outline-dashed outline-accent' : 'bg-subtle'
        )}
      >
        <SortableContext items={deals.map((d) => d._id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealKanbanCard key={deal._id} deal={deal} stages={stages} formatValue={formatValue} onOpen={onOpenDeal} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
