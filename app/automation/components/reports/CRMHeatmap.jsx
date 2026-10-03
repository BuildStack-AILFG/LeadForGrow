'use client';

import ChartCard from '../dashboard/primitives/ChartCard';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CRMHeatmap({ data = [] }) {
  const max = Math.max(...data.map((d) => d.count || 0), 1);

  return (
    <ChartCard title="Lead Activity Heatmap" subtitle="Volume by day and hour">
      <div className="overflow-x-auto">
        <div className="min-w-[360px]">
          <div className="flex gap-0.5 mb-1 pl-7 text-meta text-fg-tertiary">
            {[0, 6, 12, 18].map((h) => (
              <span key={h} style={{ width: `${(100 / 24) * 6}%` }}>{h}:00</span>
            ))}
          </div>
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-0.5 mb-0.5">
              <span className="w-6 text-meta font-medium text-fg-tertiary text-right pr-1">{day.slice(0, 2)}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const entry = data.find((x) => x._id?.hour === h && x._id?.day === di + 1);
                const alpha = entry ? 0.12 + (entry.count / max) * 0.88 : 0;
                return (
                  <div
                    key={h}
                    title={`${day} ${h}:00 — ${entry?.count || 0} leads`}
                    className="flex-1 h-3 rounded-sm min-w-[8px]"
                    style={{ background: alpha > 0 ? `rgba(37, 99, 235, ${alpha.toFixed(2)})` : 'rgba(0,0,0,0.04)' }}
                  />
                );
              })}
            </div>
          ))}
          <div className="flex items-center gap-1 mt-3 pl-7 text-meta text-fg-tertiary">
            <span>Less</span>
            {[0.15, 0.35, 0.55, 0.75, 1].map((a, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: `rgba(37, 99, 235, ${a})` }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
