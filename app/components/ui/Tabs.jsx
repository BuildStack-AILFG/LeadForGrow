'use client';

import Link from 'next/link';
import cx, { focusRing } from './cx';
import Badge from './Badge';

/**
 * Tabs — underline style (DESIGN_BRIEF §8 page header). Each tab is either a
 * button (`onChange`) or a link (`href`). Arrow keys move between tabs.
 * tabs: [{ value, label, count?, href? }]
 */
export default function Tabs({ tabs, value, onChange, className, ariaLabel }) {
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const items = [...e.currentTarget.querySelectorAll('[role="tab"]')];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    items[(i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length].focus();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={cx('flex items-center gap-5 border-b border-line', className)}>
      {tabs.map((t) => {
        const selected = t.value === value;
        const cls = cx(
          '-mb-px inline-flex h-9 items-center gap-1.5 border-b-2 text-body transition-colors duration-[var(--duration-fast)]',
          selected ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg',
          focusRing
        );
        const content = (
          <>
            {t.label}
            {t.count != null && <Badge count>{t.count}</Badge>}
          </>
        );
        return t.href ? (
          <Link key={t.value} href={t.href} role="tab" aria-selected={selected} className={cls}>
            {content}
          </Link>
        ) : (
          <button key={t.value} type="button" role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={() => onChange?.(t.value)} className={cls}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
