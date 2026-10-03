'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { assigneeName, formatSource, getLeadAmount, formatLeadAmount, getLeadRowBackgroundStyle } from './utils';
import FollowupChip from './FollowupChip';
import Avatar from '@/app/components/ui/Avatar';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Lead card (DESIGN_BRIEF §8 boards): white, 1px border, radius 8, padding 12,
 * no shadow at rest. Name (14/500) · source/interest (13 secondary) · owner +
 * value / follow-up (12 tertiary). Whole card is the drag handle (8px
 * activation distance keeps clicks working) and opens the lead on click/Enter.
 * A user-chosen row colour still tints the card.
 */
export default function KanbanCard({ lead, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead._id });
  const owner = assigneeName(lead.assignedTo);
  const dealInfo = getLeadAmount(lead);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, ...getLeadRowBackgroundStyle(lead) }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Open ${lead.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      className={cx('cursor-pointer rounded-lg border border-line bg-canvas p-3 text-left hover:border-line-strong', focusRing)}
    >
      <p className="truncate text-body font-medium text-fg">{lead.name}</p>
      <p className="mt-0.5 truncate text-dense text-fg-secondary">
        {[formatSource(lead.source), lead.serviceInterest].filter(Boolean).join(' · ')}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-meta text-fg-tertiary">
        <span className="flex min-w-0 items-center gap-1.5">
          {owner && owner !== 'Unassigned' && <Avatar name={owner} size={20} />}
          <span className="truncate">{owner || 'Unassigned'}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {dealInfo && <span className="font-medium text-fg-secondary tabular">{formatLeadAmount(dealInfo.amount, dealInfo.currency)}</span>}
          {lead.nextFollowUpAt && <FollowupChip date={lead.nextFollowUpAt} />}
        </span>
      </div>
    </div>
  );
}
