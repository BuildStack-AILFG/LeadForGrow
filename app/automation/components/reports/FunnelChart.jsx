'use client';

import ChartCard from '../dashboard/primitives/ChartCard';
import { FUNNEL_STAGES } from './constants';

export default function FunnelChart({ statusCounts = {}, totalLeads = 0 }) {
  const stages = FUNNEL_STAGES.map((s) => ({
    ...s,
    count: statusCounts[s.key] || 0
  }));

  const max = Math.max(...stages.map((s) => s.count), totalLeads, 1);

  return (
    <ChartCard title="Sales Funnel" subtitle="Stage conversion and drop-off">
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
          const widthPct = Math.max(8, (stage.count / max) * 100);
          const prev = i > 0 ? stages[i - 1].count : totalLeads;
          const dropOff = prev > 0 && i > 0 ? Math.round(((prev - stage.count) / prev) * 100) : 0;

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">{stage.label}</span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  {stage.count.toLocaleString()} · {pct}%
                  {dropOff > 0 && <span className="text-red-500 ml-1">−{dropOff}%</span>}
                </span>
              </div>
              <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex justify-center">
                <div
                  className="h-full rounded-lg transition-all duration-700 flex items-center justify-center text-[11px] font-semibold text-white"
                  style={{ width: `${widthPct}%`, backgroundColor: stage.color, minWidth: stage.count > 0 ? '2rem' : 0 }}
                >
                  {stage.count > 0 && stage.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
