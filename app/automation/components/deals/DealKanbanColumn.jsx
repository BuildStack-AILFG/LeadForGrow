'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DealKanbanCard from './DealKanbanCard';

export default function DealKanbanColumn({ stage, stages, deals, formatValue, onOpenDeal }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });

  const totalValue = deals.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 transition-colors ${
        isOver ? 'ring-2 ring-[#101828]/20 border-[#D0D5DD] bg-white' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: stage.color || '#101828' }}
          />
          <span className="text-[13px] font-semibold text-[#101828] truncate">{stage.label}</span>
          <span className="text-[11px] font-medium text-[#667085] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded-md tabular-nums">
            {deals.length}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-[#98A2B3] mb-3 px-0.5 tabular-nums">
        {formatValue(totalValue)} · {stage.probability ?? 0}% win score
      </p>
      <SortableContext items={deals.map((d) => d._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-[120px]">
          {deals.map((deal) => (
            <DealKanbanCard
              key={deal._id}
              deal={deal}
              stages={stages}
              formatValue={formatValue}
              onOpen={onOpenDeal}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
