'use client';

import { Users, UserCheck, TrendingUp, Crown } from 'lucide-react';

const CARDS = [
  { key: 'total', label: 'Team size', icon: Users, accent: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },
  { key: 'active', label: 'Active now', icon: UserCheck, accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { key: 'totalLeads', label: 'Leads handled', icon: TrendingUp, accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
  { key: 'owners', label: 'Owners', icon: Crown, accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' }
];

export default function TeamStatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.accent}`}>
              <Icon className="w-4 h-4" strokeWidth={2} />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums mt-0.5">{stats[card.key] ?? 0}</p>
          </div>
        );
      })}
    </div>
  );
}
