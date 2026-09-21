'use client';

import Link from 'next/link';
import { Calendar, Video, ExternalLink } from 'lucide-react';
import DashboardCard from './primitives/DashboardCard';
import { formatTime } from '@/lib/crm/formatCurrency';

function MeetingRow({ meeting }) {
  const guest = meeting.guest?.name || 'Guest';
  const time = formatTime(meeting.startTime);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
      <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{guest}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
            title="Join"
          >
            <Video className="w-4 h-4" />
          </a>
        )}
        {meeting.leadId && (
          <Link
            href={`/automation/leads/${meeting.leadId}`}
            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Open lead"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function UpcomingMeetings({ meetings }) {
  const today = meetings?.today || [];
  const tomorrow = meetings?.tomorrow || [];

  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Meetings</h2>
        <Link href="/automation/meetings" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View all</Link>
      </div>

      {today.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Today</p>
          <div className="space-y-2">{today.map((m) => <MeetingRow key={m._id} meeting={m} />)}</div>
        </div>
      )}

      {tomorrow.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Tomorrow</p>
          <div className="space-y-2">{tomorrow.map((m) => <MeetingRow key={m._id} meeting={m} />)}</div>
        </div>
      )}

      {today.length === 0 && tomorrow.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No meetings scheduled</p>
      )}
    </DashboardCard>
  );
}
