'use client';

import { Flame, AlertTriangle, MessageSquare, TrendingUp, Bot as Sparkles } from 'lucide-react';
import DashboardCard from './primitives/DashboardCard';

const PLACEHOLDERS = [
  { id: 'hot-deal', icon: Flame, label: 'Hot Deal', desc: 'AI will surface deals most likely to close', color: 'text-warning bg-warning-subtle dark:bg-orange-950/30' },
  { id: 'at-risk', icon: AlertTriangle, label: 'Deals at Risk', desc: 'Stalled deals needing intervention', color: 'text-danger bg-danger-subtle dark:bg-red-950/30' },
  { id: 'waiting', icon: MessageSquare, label: 'Customers Waiting', desc: 'Unanswered leads and pending replies', color: 'text-accent-fg bg-accent-subtle dark:bg-teal-950/30' },
  { id: 'forecast', icon: TrendingUp, label: 'Revenue Forecast', desc: 'Projected revenue based on pipeline velocity', color: 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/30' },
];

export default function AiInsightsPlaceholder() {
  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent-fg" />
        <div>
          <h2 className="text-base font-semibold text-fg dark:text-white">AI Insights</h2>
          <p className="text-xs text-fg-tertiary">Coming in Phase 4 — hooks ready</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLACEHOLDERS.map(({ id, icon: Icon, label, desc, color }) => (
          <div
            key={id}
            data-ai-hook={id}
            className="p-3 rounded-lg border border-dashed border-line dark:border-slate-700 opacity-75"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">{label}</p>
            <p className="text-meta text-fg-tertiary mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
