'use client';

import { SOURCE_FILTER_OPTIONS, STAGE_FILTER_OPTIONS } from './constants';
import { mapTeamMemberOptions } from '../leads/utils';

export default function FilterBar({
  sourceFilter,
  onSourceChange,
  stageFilter,
  onStageChange,
  assigneeFilter,
  onAssigneeChange,
  teamMembers = []
}) {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Source</label>
          <select
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            {SOURCE_FILTER_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Lead stage</label>
          <select
            value={stageFilter}
            onChange={(e) => onStageChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            {STAGE_FILTER_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">Assigned agent</label>
          <select
            value={assigneeFilter}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <option value="all">All team members</option>
            {mapTeamMemberOptions(teamMembers).map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
