'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from './Sparkline';
import { buildSparkline } from './utils';

const ACCENTS = {
  blue: { bg: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg', spark: '#1D4B3E' },
  green: { bg: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg', spark: '#1D4B3E' },
  amber: { bg: 'bg-warning-subtle text-warning dark:bg-amber-950/40 dark:text-amber-400', spark: '#8F5A0E' },
  slate: { bg: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary', spark: '#656F6A' }
};

function KPICard({ kpi, dailyTrends, globalTrend }) {
  const accent = ACCENTS[kpi.accent] || ACCENTS.blue;
  const sparkData = kpi.sparkKey ? buildSparkline(dailyTrends, kpi.sparkKey) : [];
  const showTrend = kpi.id === 'totalLeads' && typeof globalTrend === 'number';
  const trendUp = showTrend ? globalTrend >= 0 : !kpi.invertTrend;

  return (
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4 hover:shadow-popover transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary">{kpi.label}</p>
        {showTrend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
              trendUp
                ? 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/30 dark:text-accent-fg'
                : 'text-danger bg-danger-subtle dark:bg-red-950/30 dark:text-red-400'
            }`}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(globalTrend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-fg dark:text-slate-50 tabular-nums tracking-tight mb-2">{kpi.value}</p>
      {sparkData.length > 0 && <Sparkline data={sparkData} color={accent.spark} />}
    </div>
  );
}

export default function KPIGrid({ kpis, dailyTrends, trend }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} dailyTrends={dailyTrends} globalTrend={trend} />
      ))}
    </div>
  );
}
