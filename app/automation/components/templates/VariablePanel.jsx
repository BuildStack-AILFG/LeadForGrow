'use client';

import { PLACEHOLDERS } from './constants';

export default function VariablePanel({ onCopy }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">Variables</h3>
      <p className="text-xs text-slate-500 mb-4">Click to copy into your message</p>
      <div className="space-y-1.5">
        {PLACEHOLDERS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onCopy(p.value)}
            className="w-full flex items-center justify-between px-3 py-2 text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors group"
          >
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.label}</span>
            <code className="text-[10px] text-slate-400 group-hover:text-teal-600 font-mono">{p.value}</code>
          </button>
        ))}
      </div>
    </div>
  );
}
