'use client';

import { PLACEHOLDERS } from './constants';

export default function VariablePanel({ onCopy }) {
  return (
    <div className="bg-canvas dark:bg-slate-900 rounded p-5">
      <h3 className="text-sm font-semibold text-fg dark:text-slate-50 mb-1">Variables</h3>
      <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mb-4">Click to copy into your message</p>
      <div className="space-y-1.5">
        {PLACEHOLDERS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onCopy(p.value)}
            className="w-full flex items-center justify-between px-3 py-2 text-left rounded bg-subtle dark:bg-slate-800/50 hover:bg-brand/10 dark:hover:bg-teal-950/30 transition-colors group"
          >
            <span className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">{p.label}</span>
            <code className="text-meta text-fg-tertiary group-hover:text-brand-ink font-mono">{p.value}</code>
          </button>
        ))}
      </div>
    </div>
  );
}
