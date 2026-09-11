'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from './Sparkline';
import { buildSparkline } from './utils';

const ACCENTS = {
  blue: { bg: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400', spark: '#2563eb' },
  green: { bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', spark: '#059669' },
  amber: { bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', spark: '#d97706' },
  slate: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', spark: '#64748b' }
};

function KPICard({ kpi, dailyTrends, globalTrend }) {
  const accent = ACCENTS[kpi.accent] || ACCENTS.blue;
  const sparkData = kpi.sparkKey ? buildSparkline(dailyTrends, kpi.sparkKey) : [];
  const showTrend = kpi.id === 'totalLeads' && typeof globalTrend === 'number';
  const trendUp = showTrend ? globalTrend >= 0 : !kpi.invertTrend;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{kpi.label}</p>
        {showTrend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
              trendUp
                ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
            }`}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(globalTrend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums tracking-tight mb-2">{kpi.value}</p>
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
