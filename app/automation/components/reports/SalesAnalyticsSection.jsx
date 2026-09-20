'use client';

import ChartCard from '../dashboard/primitives/ChartCard';
import { formatCurrency } from './utils';

export default function SalesAnalyticsSection({ reports, metrics }) {
  const sc = reports?.statusCounts || {};
  const total = reports?.totalLeads || 0;
  const won = sc.converted || 0;
  const avgDeal = won > 0 && metrics?.totalPipelineValue ? Math.round(metrics.totalPipelineValue / won) : 0;
  const velocity = reports?.avgResponseTimeHours
    ? `${reports.avgResponseTimeHours}h to first touch`
    : '—';

  const items = [
    { label: 'Pipeline value', value: formatCurrency(metrics?.totalPipelineValue, metrics?.currency) },
    { label: 'Deals won', value: won.toLocaleString() },
    { label: 'Win rate', value: `${reports?.conversionRate || 0}%` },
    { label: 'Avg deal size', value: avgDeal ? formatCurrency(avgDeal, metrics?.currency) : '—' },
    { label: 'Sales velocity', value: velocity },
    { label: 'Active pipeline', value: (total - won - (sc.lost || 0)).toLocaleString() }
  ];

  return (
    <ChartCard title="Sales Analytics" subtitle="Revenue and conversion metrics">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
