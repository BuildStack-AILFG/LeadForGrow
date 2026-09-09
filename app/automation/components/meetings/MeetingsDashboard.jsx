'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Link2,
  Sparkles,
  Calendar,
  ArrowRight,
  MessageCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import MeetingsKpiRow from './MeetingsKpiRow';
import DashboardCard from '../dashboard/primitives/DashboardCard';
import { MEETING_STATUS_COLORS } from '@/lib/meetings/constants';
import CalendarIntegrationsPanel from './CalendarIntegrationsPanel';
import toast from 'react-hot-toast';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MeetingsDashboard({ dashboard, onCreate, onNoShow, onComplete }) {
  const copyLink = (slug) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Booking link copied');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Revenue Scheduling
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
            Smart Meeting Automation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            WhatsApp-first scheduling connected to your CRM, pipelines, and automations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/automation/meetings/analytics"
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Analytics
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New booking link
          </button>
        </div>
      </header>

      <AutoPageIntro />

      <MeetingsKpiRow kpis={dashboard?.kpis} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <DashboardCard className="xl:col-span-2" padding="p-0">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Upcoming appointments
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Guest bookings from your /book links</p>
            </div>
            <Link href="/automation/meetings/team" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Team schedules <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(dashboard?.upcomingBookings || []).length === 0 ? (
              <div className="p-6 sm:p-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                  No guest appointments yet. Upcoming shows bookings from your public link — not the link itself.
                </p>
                {(dashboard?.bookingLinks || []).length > 0 ? (
                  <div className="space-y-2 max-w-md mx-auto">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-center mb-2">
                      Share a link to get bookings
                    </p>
                    {dashboard.bookingLinks.slice(0, 3).map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.title}</p>
                          <p className="text-xs text-slate-500">/book/{m.bookingSlug}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyLink(m.bookingSlug)}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center">Publish a booking link to start accepting meetings.</p>
                )}
              </div>
            ) : (
              dashboard.upcomingBookings.map((b, i) => (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {b.guest?.name || 'Guest'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.meetingTypeId?.title || 'Meeting'} · {formatTime(b.startTime)}
                      {b.assignedTo?.name ? ` · ${b.assignedTo.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${MEETING_STATUS_COLORS[b.status] || ''}`}>
                      {b.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onComplete(String(b._id))}
                      className="text-[10px] font-medium text-emerald-600 hover:underline"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => onNoShow(String(b._id))}
                      className="text-[10px] font-medium text-amber-600 hover:underline"
                    >
                      No-show
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard padding="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI insights</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40">
              Peak booking window: <strong className="text-slate-800 dark:text-slate-200">10am–12pm</strong> drives highest show rates.
            </li>
            <li className="p-3 rounded-lg bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-100/80">
              WhatsApp reminders reduce no-shows by up to <strong>35%</strong> vs email-only.
            </li>
            <li className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
              AI summaries & transcripts — architecture ready. Enable in meeting settings when available.
            </li>
          </ul>
        </DashboardCard>
      </div>

      <CalendarIntegrationsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCard padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              Booking links
            </h2>
            <Link href="/automation/meetings/templates" className="text-xs text-indigo-600 hover:underline">
              Templates
            </Link>
          </div>
          <div className="space-y-2">
            {(dashboard?.bookingLinks || []).map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{m.title}</p>
                  <p className="text-xs text-slate-500">/book/{m.bookingSlug}</p>
                </div>
                <div className="flex gap-1 opacity-80 group-hover:opacity-100">
                  <button type="button" onClick={() => copyLink(m.bookingSlug)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Copy link">
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <a href={`/book/${m.bookingSlug}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>
              </div>
            ))}
            {!dashboard?.bookingLinks?.length && (
              <p className="text-sm text-slate-500 py-4 text-center">Publish a meeting type to get your booking link.</p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard padding="p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Recent activity
          </h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {(dashboard?.recentBookings || []).map((b) => (
              <div key={b._id} className="text-sm py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <span className="font-medium text-slate-800 dark:text-slate-200">{b.guest?.name}</span>
                <span className="text-slate-500"> booked </span>
                <span className="text-slate-700 dark:text-slate-300">{b.meetingTypeId?.title}</span>
                {b.whatsappConfirmationSent && (
                  <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                    WA sent
                  </span>
                )}
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
