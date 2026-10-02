'use client';

import cx, { focusRing } from './cx';

/**
 * SegmentedControl — e.g. the List | Board view switcher. Selected segment is a
 * white raised chip on a muted track (neutral, not accent — it's a view choice,
 * not a primary action). options: [{ value, label, icon? }]
 */
export default function SegmentedControl({ options, value, onChange, size = 'md', ariaLabel, className }) {
  const h = size === 'sm' ? 'h-7' : 'h-8';
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cx('inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5', h, className)}>
      {options.map((o) => {
        const selected = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange?.(o.value)}
            className={cx(
              'inline-flex h-full items-center gap-1.5 rounded-[5px] px-2.5 text-dense font-medium transition-colors duration-[var(--duration-fast)]',
              selected ? 'bg-canvas text-fg shadow-[0_1px_2px_rgba(16,24,20,0.08)]' : 'text-fg-secondary hover:text-fg',
              focusRing
            )}
          >
            {Icon && <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
