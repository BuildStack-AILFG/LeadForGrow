'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import {
  assigneeName,
  formatSource,
  getLeadAmount,
  formatLeadAmount,
  getLeadRowBackgroundStyle,
  getStatusAccentColor,
} from './utils';
import FollowupChip from './FollowupChip';

export default function KanbanCard({ lead, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead._id
  });

  const accent = lead.rowColor || getStatusAccentColor(lead.status);
  const rowBg = getLeadRowBackgroundStyle(lead);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: accent,
    ...rowBg,
  };

  const dealInfo = getLeadAmount(lead);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 border-l-[3px] rounded-lg shadow-sm hover:shadow-md hover:brightness-[0.98] dark:hover:brightness-110 transition-all cursor-pointer group"
      onClick={onOpen}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{lead.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{formatSource(lead.source)}</p>
          {lead.serviceInterest && (
            <p className="text-[11px] text-slate-400 truncate mt-1">{lead.serviceInterest}</p>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{assigneeName(lead.assignedTo)}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {dealInfo && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatLeadAmount(dealInfo.amount, dealInfo.currency)}
                </span>
              )}
              {lead.nextFollowUpAt ? <FollowupChip date={lead.nextFollowUpAt} /> : !dealInfo && <FollowupChip date={null} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
