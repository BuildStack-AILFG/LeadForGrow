'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ChartCard from './primitives/ChartCard';
import ActivityItem from './primitives/ActivityItem';

export default function RecentActivity({ activities = [] }) {
  return (
    <ChartCard
      title="Recent Activity"
      subtitle="Latest team actions across leads"
      action={
        <Link href="/automation/leads" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
          View leads <ArrowRight className="w-3 h-3" />
        </Link>
      }
    >
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
          Activity will appear as your team works leads.
        </p>
      ) : (
        <div className="max-h-[280px] overflow-y-auto pr-1">
          {activities.slice(0, 8).map((activity, i) => (
            <ActivityItem
              key={activity._id || i}
              activity={activity}
              showConnector={i < activities.length - 1}
            />
          ))}
        </div>
      )}
    </ChartCard>
  );
}
