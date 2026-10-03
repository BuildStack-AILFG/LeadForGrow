'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { companyOrContact, ownerName } from './utils';
import Avatar from '@/app/components/ui/Avatar';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Deal card (DESIGN_BRIEF §8): name (14/500) · company/value (13 secondary) ·
 * owner + close date (12 tertiary). No shadow at rest; the column already
 * says the stage, so the card doesn't repeat it.
 */
export default function DealKanbanCard({ deal, formatValue, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal._id });
  const owner = ownerName(deal.assignedTo);
  const close = deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Open ${deal.title}`}
      onClick={() => onOpen?.(deal._id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(deal._id)}
      className={cx('cursor-pointer rounded-lg border border-line bg-canvas p-3 text-left hover:border-line-strong', focusRing)}
    >
      <p className="line-clamp-2 text-body font-medium text-fg">{deal.title}</p>
      <p className="mt-0.5 flex items-center justify-between gap-2 text-dense text-fg-secondary">
        <span className="truncate">{companyOrContact(deal)}</span>
        <span className="shrink-0 font-medium text-fg tabular">{formatValue(deal.amount, deal.currency)}</span>
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-meta text-fg-tertiary">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar name={owner} size={20} />
          <span className="truncate">{owner}</span>
        </span>
        {close && <span className="shrink-0 tabular">Closes {close}</span>}
      </div>
    </div>
  );
}
