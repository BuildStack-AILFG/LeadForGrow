'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Download, Palette } from 'lucide-react';
import { mapTeamMemberOptions } from './utils';
import { LEAD_ROW_COLORS } from './constants';

export default function BulkActionsBar({
  count,
  teamMembers,
  onAssign,
  onDelete,
  onExport,
  onBulkRowColorChange
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef(null);

  useEffect(() => {
    if (!colorOpen) return;
    const close = (e) => {
      if (!colorRef.current?.contains(e.target)) setColorOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [colorOpen]);

  if (count === 0) return null;

  return (
    <div className="sticky top-[72px] z-20 flex items-center gap-3 px-4 py-2.5 bg-accent-subtle dark:bg-teal-950/30 border border-line dark:border-teal-900 rounded-lg mb-3">
      <span className="text-sm font-medium text-accent-fg dark:text-accent-fg">{count} selected</span>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            onClick={() => setColorOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-canvas dark:bg-slate-900 border border-line dark:border-violet-800 text-accent-fg dark:text-accent-fg hover:bg-accent-subtle dark:hover:bg-violet-950/30 font-medium"
          >
            <Palette className="w-3.5 h-3.5" />
            Row color
          </button>
          {colorOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 w-52 p-3 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg shadow-popover">
              <p className="text-xs font-semibold text-fg-secondary dark:text-slate-200 mb-2">
                Apply to {count} lead{count > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {LEAD_ROW_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      onBulkRowColorChange?.(c.value);
                      setColorOpen(false);
                    }}
                    className="w-8 h-8 rounded-lg border-2 border-line dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onBulkRowColorChange?.(null);
                  setColorOpen(false);
                }}
                className="mt-2 w-full text-meta text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled py-1"
              >
                Clear color
              </button>
            </div>
          )}
        </div>
        <select
          defaultValue=""
          onChange={(e) => { if (e.target.value) { onAssign(e.target.value); e.target.value = ''; } }}
          className="text-xs px-2 py-1.5 rounded-md border border-line dark:border-teal-800 bg-canvas dark:bg-slate-900"
        >
          <option value="" disabled>Assign to...</option>
          {mapTeamMemberOptions(teamMembers).map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <button type="button" onClick={onExport} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-canvas dark:bg-slate-900 border border-line dark:border-teal-800 hover:bg-accent-subtle">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-danger text-white hover:bg-red-700">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
