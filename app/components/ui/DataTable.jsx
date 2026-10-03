'use client';

import { forwardRef } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import cx, { focusRing } from './cx';

/**
 * DataTable building blocks (DESIGN_BRIEF §8 tables). Composable rather than a
 * config-driven grid, so existing list pages can adopt it cell by cell:
 *
 *   <TableFrame> <Table dense={dense}>
 *     <THead><tr><Th sticky>Name</Th><Th align="right" sort="desc" onSort>Value</Th></tr></THead>
 *     <tbody><Tr onClick selected><Td sticky>…</Td><Td align="right" numeric>…</Td></Tr></tbody>
 *   </Table></TableFrame>
 *
 * Header 36px on bg-subtle, 13/500 secondary · rows 40px (32 dense) · hairline
 * horizontal dividers only · numbers right-aligned with tabular figures ·
 * first column can be frozen (`sticky`) for horizontal scroll.
 */
export function TableFrame({ className, children }) {
  return <div className={cx('relative overflow-auto', className)}>{children}</div>;
}

export function Table({ dense = false, className, children }) {
  return (
    <table data-dense={dense || undefined} className={cx('group/table w-full border-separate border-spacing-0 text-body text-fg', className)}>
      {children}
    </table>
  );
}

export function THead({ children }) {
  return <thead className="sticky top-0 z-[2]">{children}</thead>;
}

export function Th({ align = 'left', sticky = false, sort, onSort, width, className, children }) {
  const SortIcon = sort === 'asc' ? ArrowUp : ArrowDown;
  const content = onSort ? (
    <button type="button" onClick={onSort} className={cx('group/sort inline-flex items-center gap-1 rounded-sm hover:text-fg', align === 'right' && 'flex-row-reverse', focusRing)}>
      {children}
      <SortIcon className={cx('h-3.5 w-3.5', sort ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-60')} strokeWidth={1.5} aria-hidden />
    </button>
  ) : (
    children
  );
  return (
    <th
      scope="col"
      aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : undefined}
      style={width ? { width } : undefined}
      className={cx(
        'h-9 whitespace-nowrap border-b border-line bg-subtle px-3 text-dense font-medium text-fg-secondary first:pl-6 last:pr-6',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        sticky && 'sticky left-0 z-[3] shadow-[inset_-1px_0_0_var(--color-line)]',
        className
      )}
    >
      {content}
    </th>
  );
}

export const Tr = forwardRef(function Tr({ selected = false, onClick, className, children, ...props }, ref) {
  return (
    <tr
      ref={ref}
      onClick={onClick}
      aria-selected={selected || undefined}
      className={cx(
        'group/row [&>td]:border-b [&>td]:border-line',
        selected ? '[&>td]:bg-accent-subtle' : '[&>td]:bg-canvas hover:[&>td]:bg-subtle',
        onClick && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
});

export function Td({ align = 'left', numeric = false, sticky = false, muted = false, className, children, ...props }) {
  return (
    <td
      className={cx(
        'h-10 whitespace-nowrap px-3 first:pl-6 last:pr-6 group-data-[dense]/table:h-8',
        align === 'right' || numeric ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        numeric && 'tabular',
        muted && 'text-fg-secondary',
        sticky && 'sticky left-0 z-[1] shadow-[inset_-1px_0_0_var(--color-line)]',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Row actions: hidden until row hover/focus on pointer devices with hover; always visible otherwise. */
export function RowActions({ children, className }) {
  return (
    <div className={cx('flex items-center justify-end gap-1 [@media(hover:hover)]:opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100', className)}>
      {children}
    </div>
  );
}
