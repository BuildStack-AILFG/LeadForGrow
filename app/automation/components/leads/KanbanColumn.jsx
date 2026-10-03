'use client';

import { useDroppable } from '@dnd-kit/core';
import Badge from '@/app/components/ui/Badge';
import cx from '@/app/components/ui/cx';

/**
 * Board column (DESIGN_BRIEF §8): 288px, header = stage dot + name + count,
 * cards sit on a subtle track; drop target gets an accent dashed outline.
 */
export default function KanbanColumn({ id, title, count, children, color = 'var(--stage-1)', total }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section aria-label={title} className="flex w-[288px] shrink-0 flex-col">
      <header className="flex h-9 items-center gap-2 px-1">
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="truncate text-dense font-medium text-fg">{title}</h3>
        <Badge count>{count}</Badge>
        {total != null && <span className="ml-auto text-meta text-fg-tertiary tabular">{total}</span>}
      </header>
      <div
        ref={setNodeRef}
        className={cx(
          'flex min-h-[200px] max-h-[calc(100vh-260px)] flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition-colors duration-[var(--duration-fast)]',
          isOver ? 'bg-accent-subtle outline-1 outline-dashed outline-accent' : 'bg-subtle'
        )}
      >
        {children}
      </div>
    </section>
  );
}
