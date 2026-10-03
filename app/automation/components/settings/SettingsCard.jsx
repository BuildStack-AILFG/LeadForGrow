'use client';

import { memo } from 'react';

export const SettingsCard = memo(function SettingsCard({ title, description, children, footer, className = '', accent }) {
  return (
    <div className={`bg-canvas/90 dark:bg-slate-900/90 border border-line/90 dark:border-slate-800 rounded-lg ${className}`}>
      {(title || description) && (
        <div className={`px-5 py-4 border-b border-line dark:border-slate-800 ${accent ? 'bg-subtle dark:bg-slate-800/30' : ''}`}>
          {title && <h3 className="text-sm font-semibold text-fg dark:text-slate-50">{title}</h3>}
          {description && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{description}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-line dark:border-slate-800 bg-subtle dark:bg-slate-900/50 rounded-b-xl">{footer}</div>}
    </div>
  );
});

export const SettingsSection = memo(function SettingsSection({ title, description, children }) {
  return (
    <section className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h2 className="text-sm font-semibold text-fg dark:text-slate-50">{title}</h2>}
          {description && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
});

export function SettingsField({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-fg-secondary dark:text-fg-disabled mb-1.5">{label}</label>}
      {children}
      {hint && <p className="text-meta text-fg-tertiary mt-1">{hint}</p>}
    </div>
  );
}

export function SettingsInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-900 text-fg dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent ${className}`}
      {...props}
    />
  );
}

export function SettingsSelect({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-900 text-fg dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function SettingsToggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        {label && <p className="text-sm font-medium text-fg dark:text-slate-100">{label}</p>}
        {description && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-accent' : 'bg-muted dark:bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-canvas rounded-full transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export function SettingsTabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-canvas/70 dark:bg-slate-900/70 rounded-lg border border-line/80 dark:border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            active === tab.id
              ? 'bg-accent text-white'
              : 'text-fg-secondary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 hover:text-fg dark:hover:text-slate-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsSaveBar({ onSave, saving, label = 'Save changes' }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
      >
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}

export function SettingsTagList({ items, onRemove, colorClass = 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${colorClass}`}>
          {item}
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)} className="opacity-60 hover:opacity-100">×</button>
          )}
        </span>
      ))}
    </div>
  );
}
