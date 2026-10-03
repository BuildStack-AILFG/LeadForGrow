'use client';

import ChartCard from '../dashboard/primitives/ChartCard';

export default function WhatsAppAnalytics({ stats }) {
  const items = [
    { label: 'Total conversations', value: stats?.total || 0 },
    { label: 'Unread', value: stats?.unread || 0, alert: stats?.unread > 0 },
    { label: 'Intervened (live)', value: stats?.intervened || 0 },
    { label: 'Reply rate', value: `${stats?.replyRate || 0}%` }
  ];

  return (
    <ChartCard title="WhatsApp Analytics" subtitle="Conversation performance">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`p-3 rounded-lg border ${
              item.alert
                ? 'bg-danger-subtle dark:bg-red-950/20 border-danger/30 dark:border-red-900/50'
                : 'bg-subtle dark:bg-slate-800/50 border-line dark:border-slate-800'
            }`}
          >
            <p className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary mb-1">{item.label}</p>
            <p className={`text-xl font-semibold tabular-nums ${item.alert ? 'text-danger dark:text-red-400' : 'text-fg dark:text-slate-50'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
