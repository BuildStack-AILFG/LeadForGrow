'use client';

import Link from 'next/link';
import DashboardCard from './DashboardCard';

export default function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  accent = 'blue',
  href,
  onClick,
}) {
  const accents = {
    blue: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg',
    green: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg',
    slate: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-disabled',
    amber: 'bg-warning-subtle text-warning dark:bg-amber-950/40 dark:text-amber-400',
    red: 'bg-danger-subtle text-danger dark:bg-red-950/40 dark:text-red-400',
    violet: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/40 dark:text-accent-fg',
  };

  const clickable = !!(href || onClick);
  const inner = (
    <DashboardCard
      padding="p-4"
      hover={clickable}
      className={`flex flex-col justify-between min-h-[100px] ${clickable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accents[accent] || accents.blue}`}>
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
        )}
        {typeof trend === 'number' && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
              trend >= 0
                ? 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/30'
                : 'text-danger bg-danger-subtle dark:bg-red-950/30'
            }`}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-meta font-medium text-fg-tertiary">{label}</p>
        <p className="text-lg font-semibold text-fg dark:text-slate-50 tabular-nums mt-0.5">{value}</p>
        {trendLabel && <p className="text-meta text-fg-tertiary mt-0.5">{trendLabel}</p>}
      </div>
    </DashboardCard>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg">
        {inner}
      </button>
    );
  }
  return inner;
}
