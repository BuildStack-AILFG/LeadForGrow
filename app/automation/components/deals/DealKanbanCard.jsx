'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DealStageBadge from './DealStageBadge';
import { companyOrContact } from './utils';

export default function DealKanbanCard({ deal, stages = [], formatValue, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl p-3.5 cursor-grab active:cursor-grabbing shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.08)] hover:border-[#D0D5DD] dark:hover:border-slate-700 transition-all duration-150"
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpen?.(deal._id); }}
        className="text-left w-full"
      >
        <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100 hover:text-[#344054] dark:hover:text-slate-200 line-clamp-2 leading-snug">
          {deal.title}
        </p>
      </button>
      <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100 mt-1.5 tabular-nums">
        {formatValue(deal.amount, deal.currency)}
      </p>
      <p className="text-[11px] text-[#667085] dark:text-slate-300 mt-1.5 truncate">{companyOrContact(deal)}</p>
      {deal.expectedCloseDate && (
        <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 mt-1 tabular-nums">
          Close {new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <DealStageBadge stage={deal.stage} stages={stages} size="xs" />
        <Link
          href={`/automation/deals/${deal._id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] font-medium text-[#98A2B3] dark:text-slate-400 hover:text-[#344054] dark:hover:text-slate-200"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
