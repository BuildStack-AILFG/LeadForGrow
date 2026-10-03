'use client';
import MetricStrip, { fromKpiCard } from '@/app/components/ui/MetricStrip';

export default function ContactsKpiCards({ stats, loading }) {
  if (loading) return <MetricStrip loading metrics={Array.from({ length: 4 })} className="mb-6" />;

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Contacts',
      value: stats.totalContacts?.toLocaleString() || '0',
      trend: stats.totalContactsTrend,
      trendLabel: 'this month',
      sparkData: stats.sparklines?.contacts,
      accent: '#344054',
    },
    {
      label: 'Business Contacts',
      value: stats.businessContacts?.toLocaleString() || '0',
      trendLabel: 'business type',
      sparkData: stats.sparklines?.business,
      accent: '#059669',
    },
    {
      label: 'Engaged',
      value: `${stats.engagedRate ?? 0}%`,
      subText: `${stats.withOpenDeals?.toLocaleString() || '0'} with open deals`,
      sparkData: stats.sparklines?.engaged,
      accent: '#059669',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth?.toLocaleString() || '0',
      trend: stats.totalContactsTrend,
      trendLabel: 'vs last month',
      sparkData: stats.sparklines?.new,
      accent: '#7C3AED',
    },
  ];

  return <MetricStrip metrics={cards.map(fromKpiCard)} className="mb-6" />;
}
