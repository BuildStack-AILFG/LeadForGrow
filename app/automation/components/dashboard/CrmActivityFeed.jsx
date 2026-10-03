'use client';

import DashboardCard from './primitives/DashboardCard';
import { formatRelative } from '@/lib/crm/formatCurrency';

const TYPE_ICONS = {
  lead_created: '🆕',
  deal_created: '💼',
  deal_stage_changed: '↔️',
  deal_won: '🏆',
  deal_lost: '❌',
  status_changed: '📊',
  meeting_booked: '📅',
  task_completed: '✅',
  note_added: '📝',
  assigned: '👤',
  lead_converted: '🔄',
};

export default function CrmActivityFeed({ activities = [] }) {
  return (
    <DashboardCard padding="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-fg dark:text-white">Recent Activity</h2>
        <p className="text-xs text-fg-tertiary mt-0.5">Live CRM timeline</p>
      </div>
      {activities.length === 0 ? (
        <p className="text-sm text-fg-tertiary py-6 text-center">No activity yet</p>
      ) : (
        <ul className="space-y-3 max-h-[360px] overflow-y-auto">
          {activities.map((a) => (
            <li key={a._id} className="flex gap-3 text-sm">
              <span className="text-base shrink-0 w-6 text-center">{TYPE_ICONS[a.type] || '•'}</span>
              <div className="flex-1 min-w-0 border-l-2 border-line dark:border-slate-800 pl-3">
                <p className="text-fg dark:text-slate-200">{a.description || a.type?.replace(/_/g, ' ')}</p>
                <p className="text-meta text-fg-tertiary mt-0.5">
                  {formatRelative(a.performedAt)}
                  {a.performedBy?.firstName && ` · ${a.performedBy.firstName}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
