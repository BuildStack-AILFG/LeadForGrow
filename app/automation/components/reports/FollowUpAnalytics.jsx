'use client';

import ChartCard from '../dashboard/primitives/ChartCard';

export default function FollowUpAnalytics({ stats }) {
  const items = [
    { label: 'Overdue tasks', value: stats?.overdue || 0, alert: true },
    { label: 'Due today', value: stats?.today || 0 },
    { label: 'Upcoming', value: stats?.upcoming || 0 },
    { label: 'Success rate', value: `${stats?.successRate || 0}%` }
  ];

  return (
    <ChartCard title="Follow-up Analytics" subtitle="Task completion and pipeline hygiene">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`p-3 rounded-lg border ${
              item.alert && item.value > 0
                ? 'bg-warning-subtle dark:bg-amber-950/20 border-warning/30 dark:border-amber-900/50'
                : 'bg-subtle dark:bg-slate-800/50 border-line dark:border-slate-800'
            }`}
          >
            <p className="text-meta font-medium text-fg-tertiary mb-1">{item.label}</p>
            <p className={`text-xl font-semibold tabular-nums ${
              item.alert && item.value > 0 ? 'text-warning dark:text-amber-400' : 'text-fg dark:text-slate-50'
            }`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
