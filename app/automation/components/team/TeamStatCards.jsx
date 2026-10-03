'use client';

import { Users, UserCheck, TrendingUp, Crown } from 'lucide-react';

const CARDS = [
  { key: 'total', label: 'Team size', icon: Users, accent: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg' },
  { key: 'active', label: 'Active now', icon: UserCheck, accent: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg' },
  { key: 'totalLeads', label: 'Leads handled', icon: TrendingUp, accent: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/40 dark:text-accent-fg' },
  { key: 'owners', label: 'Owners', icon: Crown, accent: 'bg-warning-subtle text-warning dark:bg-amber-950/40 dark:text-amber-400' }
];

export default function TeamStatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${card.accent}`}>
              <Icon className="w-4 h-4" strokeWidth={2} />
            </div>
            <p className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary">{card.label}</p>
            <p className="text-xl font-semibold text-fg dark:text-slate-50 tabular-nums mt-0.5">{stats[card.key] ?? 0}</p>
          </div>
        );
      })}
    </div>
  );
}
