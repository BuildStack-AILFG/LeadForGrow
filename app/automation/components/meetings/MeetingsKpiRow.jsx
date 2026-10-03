'use client';

import {
  CalendarCheck,
  TrendingUp,
  UserX,
  IndianRupee,
  Clock,
  CalendarDays,
} from 'lucide-react';
import StatCard from '../dashboard/primitives/StatCard';

export default function MeetingsKpiRow({ kpis }) {
  if (!kpis) return null;

  const cards = [
    { label: 'Meetings booked', value: kpis.meetingsBooked ?? 0, icon: CalendarCheck, accent: 'blue' },
    { label: 'Conversion rate', value: `${kpis.conversionRate ?? 0}%`, icon: TrendingUp, accent: 'green' },
    { label: 'No-show rate', value: `${kpis.noShowRate ?? 0}%`, icon: UserX, accent: 'amber' },
    {
      label: 'Revenue generated',
      value: kpis.revenueGenerated ? `₹${kpis.revenueGenerated.toLocaleString()}` : '₹0',
      icon: IndianRupee,
      accent: 'slate',
    },
    { label: 'Avg response', value: kpis.avgResponseTime || '—', icon: Clock, accent: 'blue' },
    { label: 'Upcoming', value: kpis.upcomingMeetings ?? 0, icon: CalendarDays, accent: 'green' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}
