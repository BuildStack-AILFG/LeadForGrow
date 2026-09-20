'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { useMeetingsTeam } from '../../hooks/useMeetingsWorkspace';
import DashboardCard from '../dashboard/primitives/DashboardCard';
import PageLoader from '../PageLoader';

export default function MeetingsTeamView() {
  const { loading, team } = useMeetingsTeam();

  if (loading) {
    return (
      <PageLoader label="Loading team members…" height="50vh" />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1200px] mx-auto space-y-6">
      <Link href="/automation/meetings" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
        <ArrowLeft className="w-4 h-4" /> Revenue Scheduling
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Team scheduling</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Availability, meeting load, and performance by rep.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((m) => (
          <DashboardCard key={String(m.userId)} padding="p-5" hover>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-50">{m.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{m.role?.replace('_', ' ')}</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Metric label="Booked" value={m.metrics.meetingsBooked} />
                  <Metric label="Upcoming" value={m.metrics.upcoming} />
                  <Metric label="No-show %" value={`${m.metrics.noShowRate}%`} />
                  <Metric label="Conversion" value={`${m.metrics.conversionRate}%`} />
                  <Metric label="Revenue" value={m.metrics.revenue ? `₹${m.metrics.revenue}` : '—'} className="col-span-2" />
                </div>
              </div>
            </div>
          </DashboardCard>
        ))}
        {!team.length && (
          <p className="text-sm text-slate-500 dark:text-slate-400 col-span-2 text-center py-12">Add team members in Settings → Team.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}
