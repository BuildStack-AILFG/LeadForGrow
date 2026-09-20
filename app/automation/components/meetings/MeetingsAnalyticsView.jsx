'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMeetingsAnalytics } from '../../hooks/useMeetingsWorkspace';
import StatCard from '../dashboard/primitives/StatCard';
import DashboardCard from '../dashboard/primitives/DashboardCard';
import SimpleBarChart from '../dashboard/charts/SimpleBarChart';
import PageLoader from '../PageLoader';

export default function MeetingsAnalyticsView() {
  const { loading, data } = useMeetingsAnalytics(30);

  if (loading) {
    return (
      <PageLoader label="Loading meeting analytics…" height="50vh" />
    );
  }

  const chartData = (data?.daily || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: d.bookings,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      <Link href="/automation/meetings" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
        <ArrowLeft className="w-4 h-4" /> Revenue Scheduling
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Meeting analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bookings, no-shows, conversion, and rep performance — last 30 days.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total bookings" value={data?.totals?.bookings ?? 0} accent="blue" />
        <StatCard label="No-show rate" value={`${data?.noShowRate ?? 0}%`} accent="amber" />
        <StatCard label="Conversion" value={`${data?.conversionRate ?? 0}%`} accent="green" />
        <StatCard
          label="Revenue"
          value={data?.totals?.revenue ? `₹${data.totals.revenue.toLocaleString()}` : '₹0'}
          accent="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCard padding="p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Bookings over time</h2>
          {chartData.length > 0 ? (
            <SimpleBarChart data={chartData} color="#4338ca" />
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-12 text-center">No booking data yet.</p>
          )}
        </DashboardCard>

        <DashboardCard padding="p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Top-performing reps</h2>
          <div className="space-y-3">
            {(data?.topReps || []).map((r, i) => (
              <div key={r.userId || i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {r.bookings} booked · {r.conversionRate}% conv.
                </span>
              </div>
            ))}
            {!data?.topReps?.length && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No rep data yet.</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard padding="p-5">
          <h2 className="text-sm font-semibold mb-4">Source conversion</h2>
          <div className="space-y-2">
            {(data?.sources || []).map((s) => (
              <div key={s.source} className="flex justify-between text-sm">
                <span className="capitalize text-slate-700 dark:text-slate-300">{s.source?.replace('_', ' ')}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard padding="p-5">
          <h2 className="text-sm font-semibold mb-4">Best booking times</h2>
          <div className="space-y-2">
            {(data?.bestTimes || []).slice(0, 6).map((t) => (
              <div key={t.hour} className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{t.hour}:00</span>
                <span className="font-medium">{t.count} meetings</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
