'use client';

import { Plus, X } from 'lucide-react';
import cx, { focusRing } from './cx';

/**
 * Toolbar — sits under the page header for lists and boards.
 * left: view switcher, saved views, filter chips, sort · right: search, density, columns, export.
 * When `selectedCount > 0` the bulk bar replaces it ("3 selected" + actions).
 */
export default function Toolbar({ left, right, selectedCount = 0, bulkActions, onClearSelection, className }) {
  if (selectedCount > 0) {
    return (
      <div className={cx('flex h-12 items-center gap-3 border-b border-line bg-accent-subtle px-6', className)}>
        <span className="text-body font-medium text-accent-fg tabular">{selectedCount} selected</span>
        <div className="flex items-center gap-2">{bulkActions}</div>
        {onClearSelection && (
          <button type="button" onClick={onClearSelection} className={cx('ml-auto rounded-md px-2 py-1 text-dense text-accent-fg hover:underline', focusRing)}>
            Clear selection
          </button>
        )}
      </div>
    );
  }
  return (
    <div className={cx('flex min-h-12 flex-wrap items-center gap-2 border-b border-line bg-canvas px-6 py-2', className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{left}</div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

/**
 * FilterChip — suggested ("+ Status") or active ("Status is Open ×").
 * Active chip: remove button is separate from the chip body so clearing never
 * re-opens the menu (Stripe filter-controls pattern).
 */
export function FilterChip({ label, value, onClick, onClear }) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cx('inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-line-strong px-2 text-dense text-fg-secondary hover:border-solid hover:bg-subtle hover:text-fg', focusRing)}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-line bg-subtle text-dense">
      <button type="button" onClick={onClick} className={cx('h-full rounded-l-md pl-2 pr-1 text-fg-secondary hover:text-fg', focusRing)}>
        {label} <span className="text-fg-tertiary">is</span> <span className="font-medium text-fg">{value}</span>
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
        className={cx('inline-flex h-full items-center rounded-r-md px-1.5 text-fg-tertiary hover:bg-muted hover:text-fg', focusRing)}
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </span>
  );
}
