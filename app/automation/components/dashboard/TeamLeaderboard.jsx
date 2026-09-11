'use client';

import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
import ChartCard from './primitives/ChartCard';

export default function TeamLeaderboard({ teamPerformance = [] }) {
  const sorted = [...teamPerformance].sort((a, b) => (b.converted || 0) - (a.converted || 0)).slice(0, 5);

  return (
    <ChartCard
      title="Team Performance"
      subtitle="Conversions by assignee · 30 days"
      action={
        <Link href="/automation/team" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
          Team <ArrowRight className="w-3 h-3" />
        </Link>
      }
      className="h-full"
    >
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Assign leads to track team performance.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((member, idx) => (
            <li
              key={member._id || member.email || idx}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  idx === 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {idx === 0 ? <Trophy className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {member.name || member.email || 'Team member'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {member.total || 0} leads · {Math.round(member.conversionRate || 0)}% won
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {member.converted || 0}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
