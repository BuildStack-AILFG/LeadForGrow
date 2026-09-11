'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ChartCard from './primitives/ChartCard';

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-teal-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-indigo-500' },
  { key: 'follow-up', label: 'Follow-up', color: 'bg-violet-500' },
  { key: 'converted', label: 'Won', color: 'bg-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'bg-slate-400' }
];

export default function PipelineOverview({ statusCounts = {} }) {
  const counts = STAGES.map((s) => ({
    ...s,
    count: statusCounts[s.key] || 0
  }));
  const total = counts.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <ChartCard
      title="Sales Pipeline"
      subtitle="Lead distribution by stage"
      action={
        <Link
          href="/automation/leads"
          className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      }
      className="h-full"
    >
      <div className="space-y-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {counts.map((stage) =>
            stage.count > 0 ? (
              <div
                key={stage.key}
                className={`${stage.color} transition-all duration-500`}
                style={{ width: `${(stage.count / total) * 100}%` }}
                title={`${stage.label}: ${stage.count}`}
              />
            ) : null
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {counts.map((stage) => (
            <Link
              key={stage.key}
              href={`/automation/leads?filter=${stage.key === 'follow-up' ? 'follow-up' : stage.key}`}
              className="group p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-teal-200 dark:hover:border-teal-900 hover:bg-white dark:hover:bg-slate-800 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {stage.label}
                </span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {stage.count}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
