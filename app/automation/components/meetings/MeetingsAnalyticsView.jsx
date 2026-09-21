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
            <SimpleBarChart data={chartData} color="#1D4B3E" />
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
          <div className="space-y-3">
            {(() => {
              const sources = data?.sources || [];
              const max = Math.max(1, ...sources.map((s) => s.count || 0));
              return sources.map((s) => (
                <div key={s.source}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-slate-700 dark:text-slate-300">{s.source?.replace('_', ' ')}</span>
                    <span className="font-medium tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#1D4B3E] rounded-full" style={{ width: `${((s.count || 0) / max) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
            {!data?.sources?.length && <p className="text-sm text-slate-500 text-center py-8">No source data yet.</p>}
          </div>
        </DashboardCard>

        <DashboardCard padding="p-5">
          <h2 className="text-sm font-semibold mb-4">Best booking times</h2>
          <div className="space-y-3">
            {(() => {
              const times = (data?.bestTimes || []).slice(0, 6);
              const max = Math.max(1, ...times.map((t) => t.count || 0));
              return times.map((t) => (
                <div key={t.hour}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 dark:text-slate-300">{t.hour}:00</span>
                    <span className="font-medium tabular-nums">{t.count} meetings</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#8FC4AE] rounded-full" style={{ width: `${((t.count || 0) / max) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
            {!data?.bestTimes?.length && <p className="text-sm text-slate-500 text-center py-8">No timing data yet.</p>}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
