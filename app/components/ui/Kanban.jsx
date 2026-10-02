'use client';

import { forwardRef } from 'react';
import { Plus } from 'lucide-react';
import cx, { focusRing } from './cx';
import Badge from './Badge';

/**
 * Kanban pieces (DESIGN_BRIEF §8 boards). Drag-and-drop stays with each
 * board's existing logic; these only define the look.
 *
 * KanbanColumn — 288px, header = stage dot + name + count (+ total value).
 * KanbanCard   — white, 1px border, radius 8, padding 12, no shadow at rest,
 *                subtle shadow only while `dragging`. Max 3–4 lines of content.
 */
export function KanbanColumn({ title, color, count, total, onAdd, isDropTarget = false, className, children }) {
  return (
    <section aria-label={title} className={cx('flex w-[288px] shrink-0 flex-col', className)}>
      <header className="flex h-9 items-center gap-2 px-1">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color || 'var(--stage-1)' }} />
        <h3 className="truncate text-dense font-medium text-fg">{title}</h3>
        {count != null && <Badge count>{count}</Badge>}
        {total != null && <span className="ml-auto text-meta text-fg-tertiary tabular">{total}</span>}
      </header>
      <div
        className={cx(
          'group/col flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-1 transition-colors duration-[var(--duration-fast)]',
          isDropTarget ? 'bg-accent-subtle outline-1 outline-dashed outline-accent' : 'bg-subtle'
        )}
      >
        {children}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className={cx(
              'flex h-8 items-center gap-1.5 rounded-md px-2 text-dense text-fg-tertiary hover:bg-muted hover:text-fg',
              '[@media(hover:hover)]:opacity-0 group-hover/col:opacity-100 focus-visible:opacity-100',
              focusRing
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Add
          </button>
        )}
      </div>
    </section>
  );
}

export const KanbanCard = forwardRef(function KanbanCard({ dragging = false, selected = false, onClick, className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick(e)) : undefined}
      className={cx(
        'rounded-lg border bg-canvas p-3 text-left transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
        selected ? 'border-accent' : 'border-line hover:border-line-strong',
        dragging && 'shadow-drag',
        onClick && 'cursor-pointer',
        focusRing,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
