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
    blue: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
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
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                : 'text-red-700 bg-red-50 dark:bg-red-950/30'
            }`}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 tabular-nums mt-0.5">{value}</p>
        {trendLabel && <p className="text-[10px] text-slate-400 mt-0.5">{trendLabel}</p>}
      </div>
    </DashboardCard>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl">
        {inner}
      </button>
    );
  }
  return inner;
}
