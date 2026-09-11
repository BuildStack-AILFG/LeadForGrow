'use client';

import { Sparkles } from 'lucide-react';
import ChartCard from '../dashboard/primitives/ChartCard';

export default function InsightsPanel({ insights = [] }) {
  return (
    <ChartCard title="Intelligence Insights" subtitle="Data-driven recommendations">
      {insights.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">Insights will appear as your pipeline grows.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100/80 dark:border-teal-900/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
