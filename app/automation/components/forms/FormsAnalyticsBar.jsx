'use client';

import { FileInput, TrendingUp, Eye, Percent } from 'lucide-react';

export default function FormsAnalyticsBar({ stats }) {
  const cards = [
    { label: 'Active forms', value: stats.activeForms, icon: FileInput, accent: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
    { label: 'Total submissions', value: stats.totalSubmissions, icon: TrendingUp, accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Forms with leads', value: stats.withLeads, icon: Eye, accent: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
    { label: 'Avg conversion', value: `${stats.avgConversion}%`, icon: Percent, accent: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/30">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.accent}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{c.label}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{c.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
