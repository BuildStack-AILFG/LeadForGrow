'use client';

export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-fg dark:text-slate-100">{title}</h3>
        {subtitle && (
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
