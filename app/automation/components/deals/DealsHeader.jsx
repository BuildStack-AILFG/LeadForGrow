'use client';

import { LayoutGrid, Table2 } from 'lucide-react';
import CrmPageHeader from '../crm/CrmPageHeader';

export default function DealsHeader({
  viewMode,
  onViewModeChange,
  onCreate,
  ...props
}) {
  return (
    <CrmPageHeader
      title="Deals"
      subtitle="Pipeline, revenue, and closed deals in one workspace."
      searchPlaceholder="Search deals, companies, contacts…"
      primaryLabel="New Deal"
      totalLabel="deals total"
      onPrimaryClick={onCreate}
      toolbarStart={
        onViewModeChange && (
          <div className="inline-flex items-center p-0.5 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-[#F9FAFB] dark:bg-slate-900 text-[#101828] dark:text-slate-100 shadow-sm'
                  : 'text-[#667085] dark:text-slate-300 hover:text-[#344054] dark:hover:text-slate-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'bg-[#F9FAFB] dark:bg-slate-900 text-[#101828] dark:text-slate-100 shadow-sm'
                  : 'text-[#667085] dark:text-slate-300 hover:text-[#344054] dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
        )
      }
      {...props}
    />
  );
}
