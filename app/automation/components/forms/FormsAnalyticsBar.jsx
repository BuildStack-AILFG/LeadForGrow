'use client';

import { FileInput, TrendingUp, Eye, Percent } from 'lucide-react';

export default function FormsAnalyticsBar({ stats }) {
  const cards = [
    { label: 'Active forms', value: stats.activeForms, icon: FileInput, accent: 'text-accent-fg bg-accent-subtle dark:bg-teal-950/40' },
    { label: 'Total submissions', value: stats.totalSubmissions, icon: TrendingUp, accent: 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/40' },
    { label: 'Forms with leads', value: stats.withLeads, icon: Eye, accent: 'text-accent-fg bg-accent-subtle dark:bg-violet-950/40' },
    { label: 'Avg conversion', value: `${stats.avgConversion}%`, icon: Percent, accent: 'text-warning bg-warning-subtle dark:bg-amber-950/40' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-line dark:border-slate-800 bg-canvas/80 dark:bg-slate-900/80">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-subtle dark:bg-slate-800/30">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.accent}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-meta text-fg-tertiary">{c.label}</p>
              <p className="text-lg font-semibold text-fg dark:text-slate-50 tabular-nums">{c.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
