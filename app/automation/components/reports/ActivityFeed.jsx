'use client';

import Link from 'next/link';
import ChartCard from '../dashboard/primitives/ChartCard';
import ActivityItem from '../dashboard/primitives/ActivityItem';
import StatusBadge from '../leads/StatusBadge';

export default function ActivityFeed({ activities = [], recentLeads = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Live Activity" subtitle="Recent CRM events">
        <div className="max-h-72 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No recent activity.</p>
          ) : (
            activities.slice(0, 10).map((a, i) => (
              <ActivityItem key={a._id || i} activity={a} showConnector={i < Math.min(activities.length, 10) - 1} />
            ))
          )}
        </div>
      </ChartCard>

      <ChartCard
        title="Recent Conversions"
        subtitle="Latest won and contacted leads"
        action={
          <Link href="/automation/leads" className="text-xs font-medium text-teal-600 hover:text-teal-700">
            All leads
          </Link>
        }
      >
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {recentLeads?.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No recent conversions.</p>
          ) : (
            recentLeads.map((lead) => (
              <Link
                key={lead._id}
                href={`/automation/leads/${lead._id}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{lead.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{lead.serviceInterest || 'General inquiry'}</p>
                </div>
                <StatusBadge status={lead.status} size="xs" />
              </Link>
            ))
          )}
        </div>
      </ChartCard>
    </div>
  );
}
