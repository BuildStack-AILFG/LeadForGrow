'use client';

import { Bot as Sparkles } from 'lucide-react';
import ChartCard from '../dashboard/primitives/ChartCard';

export default function InsightsPanel({ insights = [] }) {
  return (
    <ChartCard title="Intelligence Insights" subtitle="Data-driven recommendations">
      {insights.length === 0 ? (
        <p className="text-sm text-fg-tertiary py-4">Insights will appear as your pipeline grows.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent-subtle dark:bg-teal-950/20 border border-line dark:border-teal-900/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-fg flex-shrink-0 mt-0.5" />
              <p className="text-xs text-fg-secondary dark:text-fg-disabled leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
