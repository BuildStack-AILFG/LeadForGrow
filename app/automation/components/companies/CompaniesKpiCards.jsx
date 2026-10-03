'use client';

import { formatCurrency } from './utils';
import MetricStrip, { fromKpiCard } from '@/app/components/ui/MetricStrip';

export default function CompaniesKpiCards({ stats, loading }) {
  if (loading) return <MetricStrip loading metrics={Array.from({ length: 4 })} className="mb-6" />;

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Companies',
      value: stats.totalCompanies?.toLocaleString() || '0',
      trend: stats.totalCompaniesTrend,
      trendLabel: 'this month',
      sparkData: stats.sparklines?.companies,
      accent: '#344054',
    },
    {
      label: 'Customers',
      value: stats.customers?.toLocaleString() || '0',
      trend: stats.customerConversionRate,
      trendLabel: 'conversion',
      sparkData: stats.sparklines?.customers,
      accent: '#059669',
    },
    {
      label: 'Active Deals',
      value: stats.activeDeals?.toLocaleString() || '0',
      pipelineText: `${formatCurrency(stats.pipelineValue, stats.currency)} Pipeline`,
      sparkData: stats.sparklines?.deals,
      accent: '#059669',
    },
    {
      label: 'Avg Deal Value',
      value: formatCurrency(stats.avgDealValue, stats.currency),
      trend: stats.avgDealValueTrend,
      trendLabel: 'vs last month',
      sparkData: stats.sparklines?.avgDeal,
      accent: '#7C3AED',
    },
  ];

  return <MetricStrip metrics={cards.map(fromKpiCard)} className="mb-6" />;
}
