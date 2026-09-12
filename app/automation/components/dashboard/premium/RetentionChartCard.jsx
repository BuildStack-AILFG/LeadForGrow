'use client';

import { useState } from 'react';
import PremiumCard from './PremiumCard';
import WidgetMenu from './WidgetMenu';
import { CHART } from './tokens';

export default function RetentionChartCard({ retention, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!retention) return null;

  const { rate, change, segments = [], monthly = [] } = retention;
  const monthUp = (change ?? 0) >= 0;

  // Re-color segments into the brand green family for a cohesive look.
  const greenSegments = segments.map((s, i) => ({
    ...s,
    color: CHART.segments[i % CHART.segments.length],
  }));

  const maxVal = Math.max(
    ...monthly.flatMap((m) => greenSegments.map((s) => m.values?.[s.key] || 0)),
    1
  );

  return (
    <PremiumCard padding="p-4" className="h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-normal text-[#475569] mb-1.5">Retention Rate</p>
          <div className="flex items-baseline gap-2">
            <p className="text-[22px] font-medium text-[#1A1D1F] tabular-nums leading-none tracking-[-0.02em]">
              {rate}%
            </p>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-normal ${monthUp ? 'text-[#047857] bg-[#ECFDF5]' : 'text-[#C0353A] bg-[#FEF3F2]'
                }`}
            >
              {monthUp ? '+' : ''}{change}%
            </span>
          </div>
        </div>
        <WidgetMenu
          onRefresh={onRefresh}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
      </div>

      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-out ${collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100'
          }`}
      >
        {greenSegments.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
            {greenSegments.map((seg) => (
              <span key={seg.key} className="inline-flex items-center gap-1.5 text-[11.5px] text-[#667085] font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                {seg.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-[180px]">
          {monthly.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-[13px] font-medium text-[#475569]">No retention data yet</p>
              <p className="text-[12px] text-[#98A2B3] mt-1">This fills in once customers start coming back for repeat business.</p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-full pt-2">
              {monthly.map((month, mi) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '85%' }}>
                    {greenSegments.map((seg, si) => {
                      const val = month.values?.[seg.key] || 0;
                      const h = (val / maxVal) * 100;
                      return (
                        <div
                          key={seg.key}
                          className="lfg-grow-y w-full max-w-[13px] rounded-none transition-opacity duration-200 hover:opacity-80"
                          style={{
                            height: `${Math.max(h, 4)}%`,
                            backgroundColor: seg.color,
                            minHeight: val > 0 ? 4 : 0,
                            animationDelay: `${mi * 45 + si * 20}ms`,
                          }}
                          title={`${seg.label}: ${val}%`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-[#98A2B3] font-medium">{month.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PremiumCard>
  );
}
