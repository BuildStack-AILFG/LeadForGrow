'use client';

import Link from 'next/link';
import DashboardCard from './DashboardCard';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Stat tile — quiet by design (DESIGN_BRIEF §8): small neutral icon next to
 * the label, the number, an optional note; trend as plain coloured text.
 * `accent` is accepted for backwards compatibility but no longer colours a tile.
 */
export default function StatCard({ label, value, trend, trendLabel, icon: Icon, href, onClick }) {
  const clickable = !!(href || onClick);
  const inner = (
    <DashboardCard padding="p-4" hover={clickable} className={cx('flex min-h-[88px] flex-col justify-between', clickable && 'cursor-pointer')}>
      <p className="flex items-center gap-1.5 text-meta text-fg-tertiary">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />}
        <span className="truncate">{label}</span>
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-page font-semibold text-fg tabular">{value}</span>
        {typeof trend === 'number' && (
          <span className={cx('text-meta tabular', trend >= 0 ? 'text-success' : 'text-danger')}>
            {trend >= 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      {trendLabel && <p className="mt-0.5 truncate text-meta text-fg-tertiary">{trendLabel}</p>}
    </DashboardCard>
  );

  if (href) {
    return (
      <Link href={href} className={cx('block rounded-lg', focusRing)}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx('block w-full rounded-lg text-left', focusRing)}>
        {inner}
      </button>
    );
  }
  return inner;
}
