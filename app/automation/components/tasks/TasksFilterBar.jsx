'use client';

import { TASK_FILTERS } from './constants';

export default function TasksFilterBar({ filter, onFilterChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
      {TASK_FILTERS.map((f) => {
        const Icon = f.icon;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
