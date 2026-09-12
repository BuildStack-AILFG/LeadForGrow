'use client';

import { Kanban } from 'lucide-react';
import Link from 'next/link';
import WidgetCard from './WidgetCard';
import { formatCurrency } from '@/lib/crm/formatCurrency';

// New — surfaces the `pipeline` stage-breakdown array the dashboard API
// already computes but never rendered anywhere (a classic CRM dashboard
// widget, per DECISIONS.md 2026-09-12). Full-width row of its own since a
// stage-by-stage funnel needs more horizontal room than a 3-up grid cell.
export default function PipelineBreakdownCard({ pipeline, currency = 'INR', onRefresh }) {
  const stages = pipeline || [];
  const maxCount = Math.max(...stages.map((s) => s.count || 0), 1);

  return (
    <WidgetCard
      title="Sales Pipeline"
      subtitle="Deals by stage"
      icon={Kanban}
      onRefresh={onRefresh}
      collapsible
      action={
        <Link href="/automation/deals" className="text-[12.5px] font-normal text-[#1D4B3E] hover:text-[#163c32] transition-colors">
          View all
        </Link>
      }
    >
      {stages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
          <p className="text-[13px] font-medium text-[#475569]">No deals in the pipeline yet</p>
          <p className="text-[12px] text-[#98A2B3] mt-1">Convert a lead into a deal to see the breakdown here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stage) => {
            const heightPct = Math.max(6, ((stage.count || 0) / maxCount) * 100);
            return (
              <div key={stage.key} className="flex flex-col rounded-none border border-[#E8ECEF] bg-[#FAFBFB] p-3">
                <p className="text-[11px] font-normal text-[#475569] truncate mb-2" title={stage.label}>
                  {stage.label}
                </p>
                <div className="h-16 flex items-end mb-2">
                  <div
                    className="w-full rounded-none transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ height: `${heightPct}%`, backgroundColor: stage.color || '#1D4B3E' }}
                  />
                </div>
                <p className="text-[18px] font-medium text-[#1A1D1F] tabular-nums leading-none tracking-[-0.02em]">
                  {stage.count}
                </p>
                <p className="text-[11px] font-normal text-[#94A3B8] tabular-nums mt-1 truncate">
                  {formatCurrency(stage.totalValue, currency)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
