'use client';

import { Zap, Plus } from 'lucide-react';
import AutomationCard from './AutomationCard';

export default function AutomationList({ rules, selectedId, onSelect, onToggle, isFirstRun, onCreate }) {
  if (rules.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
        <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        {isFirstRun ? (
          <>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No automations yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Automations handle repetitive work for you — like welcoming a new lead the second they arrive.
            </p>
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Create your first automation
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No automations found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search or filter.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rules.map((rule) => (
        <AutomationCard
          key={rule._id}
          rule={rule}
          selected={selectedId === rule._id}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
