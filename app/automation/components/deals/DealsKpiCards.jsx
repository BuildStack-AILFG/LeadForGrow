'use client';

import { formatValue } from './utils';

function MiniSparkline({ data = [], color = '#344054' }) {
  if (!data?.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function KpiCard({ label, value, trendLabel, sparkData, accent, subtext }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-[#667085] dark:text-slate-300 mb-2">{label}</p>
          <p className="text-[26px] font-semibold text-[#101828] dark:text-slate-100 tracking-tight tabular-nums leading-none">
            {value}
          </p>
          {subtext && (
            <p className="text-[11px] font-medium mt-2 text-[#667085] dark:text-slate-300">{subtext}</p>
          )}
          {trendLabel && (
            <p className="text-[11px] font-medium mt-2 text-[#667085] dark:text-slate-300">{trendLabel}</p>
          )}
        </div>
        <MiniSparkline data={sparkData} color={accent || '#667085'} />
      </div>
    </div>
  );
}

export default function DealsKpiCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[120px] rounded-xl border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 animate-shimmer bg-gradient-to-r from-[#F9FAFB] via-white to-[#F9FAFB] bg-[length:200%_100%]" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const currency = stats.currency || 'INR';

  const cards = [
    {
      label: 'Revenue Won',
      value: formatValue(stats.wonRevenue, currency),
      trendLabel: stats.wonThisMonth ? `${formatValue(stats.wonThisMonth, currency)} this month` : null,
      sparkData: stats.sparklines?.revenue,
      accent: '#059669',
    },
    {
      label: 'Pipeline Value',
      value: formatValue(stats.pipelineValue, currency),
      subtext: stats.forecast ? `${formatValue(stats.forecast, currency)} forecast` : null,
      sparkData: stats.sparklines?.pipeline,
      accent: '#101828',
    },
    {
      label: 'Open Deals',
      value: stats.openDeals?.toLocaleString() || '0',
      trendLabel: `${stats.totalDeals || 0} total deals`,
      sparkData: stats.sparklines?.open,
      accent: '#344054',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate ?? 0}%`,
      trendLabel: `${stats.wonDeals || 0} won · ${stats.lostDeals || 0} lost`,
      sparkData: stats.sparklines?.open,
      accent: '#7C3AED',
    },
    {
      label: 'Avg Deal Value',
      value: formatValue(stats.avgDealValue, currency),
      trendLabel: 'across won deals',
      sparkData: stats.sparklines?.avg,
      accent: '#0EA5E9',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
