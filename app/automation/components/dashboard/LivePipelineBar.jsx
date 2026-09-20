'use client';

import Link from 'next/link';
import DashboardCard from './primitives/DashboardCard';
import { formatCurrency } from '@/lib/crm/formatCurrency';

export default function LivePipelineBar({ pipeline, currency = 'INR' }) {
  if (!pipeline?.length) return null;

  const openStages = pipeline.filter((s) => !s.isWon && !s.isLost);
  const maxValue = Math.max(...openStages.map((s) => s.totalValue), 1);

  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Live Pipeline</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Deal count and value by stage — click to filter</p>
        </div>
        <Link href="/automation/deals" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
          All deals
        </Link>
      </div>

      <div className="space-y-2">
        {pipeline.map((stage) => {
          const width = stage.isWon || stage.isLost
            ? 100
            : Math.max(4, Math.round((stage.totalValue / maxValue) * 100));

          return (
            <Link
              key={stage.key}
              href={`/automation/deals?stage=${stage.key}`}
              className="block group"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  {stage.label}
                </span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0 ml-2">
                  {stage.count} · {formatCurrency(stage.totalValue, currency)}
                  {stage.count > 0 && (
                    <span className="text-slate-400 ml-1">avg {formatCurrency(stage.avgValue, currency)}</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all group-hover:opacity-90"
                  style={{ width: `${width}%`, backgroundColor: stage.color || '#6366f1' }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardCard>
  );
}
