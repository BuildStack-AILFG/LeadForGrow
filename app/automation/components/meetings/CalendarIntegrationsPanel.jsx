'use client';

import { Calendar, Video, Mail } from 'lucide-react';
import DashboardCard from '../dashboard/primitives/DashboardCard';

const INTEGRATIONS = [
  { id: 'googleCalendar', name: 'Google Calendar', icon: Calendar, status: 'ready', note: 'Sync availability & create events' },
  { id: 'outlook', name: 'Microsoft Outlook', icon: Mail, status: 'ready', note: 'Two-way calendar sync' },
  { id: 'zoom', name: 'Zoom', icon: Video, status: 'ready', note: 'Auto-generate meeting links' },
  { id: 'googleMeet', name: 'Google Meet', icon: Video, status: 'active', note: 'Enabled by default on new bookings' },
];

export default function CalendarIntegrationsPanel() {
  return (
    <DashboardCard padding="p-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">Calendar integrations</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Connect calendars to sync availability and auto-create conference links.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTEGRATIONS.map((i) => {
          const Icon = i.icon;
          return (
            <div
              key={i.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{i.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{i.note}</p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  i.status === 'active'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:text-slate-300 dark:bg-slate-800'
                }`}
              >
                {i.status === 'active' ? 'Active' : 'Configure in Integrations'}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
