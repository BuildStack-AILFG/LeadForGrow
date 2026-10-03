'use client';

import { formatValue } from './utils';
import MetricStrip, { fromKpiCard } from '@/app/components/ui/MetricStrip';

export default function DealsKpiCards({ stats, loading }) {
  if (loading) return <MetricStrip loading metrics={Array.from({ length: 5 })} className="mb-6" />;

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

  return <MetricStrip metrics={cards.map(fromKpiCard)} className="mb-6" />;
}
