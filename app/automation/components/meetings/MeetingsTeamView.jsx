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
      <Link href="/automation/meetings" className="inline-flex items-center gap-2 text-sm text-fg-tertiary hover:text-fg">
        <ArrowLeft className="w-4 h-4" /> Revenue Scheduling
      </Link>
      <header>
        <h1 className="text-page font-semibold text-fg">Team scheduling</h1>
        <p className="text-sm text-fg-tertiary mt-1">Availability, meeting load, and performance by rep.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((m) => (
          <DashboardCard key={String(m.userId)} padding="p-5" hover>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-canvas border border-line dark:bg-indigo-950/40 flex items-center justify-center text-fg-secondary">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-fg dark:text-slate-50">{m.name}</p>
                <p className="text-xs text-fg-tertiary capitalize">{m.role?.replace('_', ' ')}</p>
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
          <p className="text-sm text-fg-tertiary col-span-2 text-center py-12">Add team members in Settings → Team.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-meta text-fg-tertiary">{label}</p>
      <p className="text-sm font-semibold text-fg dark:text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}
