'use client';

/** Compact switch for CRM settings */
export function CrmSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 disabled:opacity-50 ${
        enabled ? 'bg-slate-900 dark:bg-muted' : 'bg-muted dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-canvas dark:bg-slate-900 shadow-sm transition duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function CrmSettingRow({ label, description, children, border = true }) {
  return (
    <div
      className={`flex items-start justify-between gap-6 py-4 ${border ? 'border-b border-line dark:border-slate-800/80 last:border-0' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg dark:text-slate-100">{label}</p>
        {description && (
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-1 leading-relaxed max-w-md">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

export function CrmPanel({ title, description, children, action }) {
  return (
    <section className="bg-canvas dark:bg-slate-900/90 border border-line/90 dark:border-slate-800 rounded-lg overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.03]">
      {(title || description) && (
        <div className="px-6 py-5 border-b border-line dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold text-fg dark:text-slate-50 tracking-tight">{title}</h2>}
            {description && <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mt-1">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="px-6 py-2">{children}</div>
    </section>
  );
}

export function CrmPanelBody({ children, className = '' }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
