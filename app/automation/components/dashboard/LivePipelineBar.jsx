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
          <h2 className="text-base font-semibold text-fg dark:text-white">Live Pipeline</h2>
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">Deal count and value by stage — click to filter</p>
        </div>
        <Link href="/automation/deals" className="text-xs text-accent-fg dark:text-accent-fg hover:underline font-medium">
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
                <span className="font-medium text-fg-secondary dark:text-fg-disabled group-hover:text-accent-fg dark:group-hover:text-accent-fg truncate">
                  {stage.label}
                </span>
                <span className="text-fg-tertiary dark:text-fg-tertiary tabular-nums shrink-0 ml-2">
                  {stage.count} · {formatCurrency(stage.totalValue, currency)}
                  {stage.count > 0 && (
                    <span className="text-fg-tertiary ml-1">avg {formatCurrency(stage.avgValue, currency)}</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
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
