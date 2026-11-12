'use client';

import { LEAD_ROW_COLOR_GROUPS } from './constants';

/**
 * Grouped row-color swatches (Light / Strong) shared by the per-row picker and the bulk bar.
 */
export default function RowColorSwatches({ currentColor, onSelect }) {
  return (
    <div className="space-y-2.5">
      {LEAD_ROW_COLOR_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 text-meta font-medium text-fg-tertiary">{group.label}</p>
          <div className="grid grid-cols-6 gap-1.5">
            {group.colors.map((c) => {
              const active = currentColor === c.value;
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  aria-pressed={active}
                  onClick={() => onSelect(c.value)}
                  className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 ${
                    active ? 'border-accent ring-2 ring-focus dark:ring-teal-800' : 'border-line dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
