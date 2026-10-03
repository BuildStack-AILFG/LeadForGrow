'use client';

import { Check, UserCircle, RefreshCw } from 'lucide-react';
import { STRATEGIES } from './constants';

const ICONS = { UserCircle, RefreshCw };

export default function AssignmentStrategy({ value, onChange, onSave, saving }) {
  return (
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-fg dark:text-slate-50">Lead assignment</h2>
        <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">How new leads get routed to your team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {STRATEGIES.map((s) => {
          const Icon = ICONS[s.icon];
          const selected = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                selected
                  ? s.selectedClass
                  : 'border-line dark:border-slate-700 hover:border-line-strong dark:hover:border-slate-600 bg-canvas dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? s.iconClass : 'bg-muted text-fg-tertiary dark:bg-slate-800'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-fg dark:text-slate-100">{s.title}</p>
                    {selected && (
                      <span className="inline-flex items-center gap-1 text-meta font-semibold text-accent-fg dark:text-accent-fg">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-1 leading-relaxed">{s.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save strategy'}
        </button>
      </div>
    </div>
  );
}
