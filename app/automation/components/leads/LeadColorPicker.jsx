'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LEAD_ROW_COLORS } from './constants';

export default function LeadColorPicker({ open, onClose, currentColor, onSelect, anchorRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        panelRef.current?.contains(e.target) ||
        anchorRef?.current?.contains(e.target)
      ) {
        return;
      }
      onClose();
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 z-50 w-52 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Row color</p>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {LEAD_ROW_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            onClick={() => onSelect(c.value)}
            className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
              currentColor === c.value
                ? 'border-teal-500 ring-2 ring-teal-200 dark:ring-teal-800'
                : 'border-slate-200 dark:border-slate-600'
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
      {currentColor && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-2 w-full text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-1"
        >
          Clear color
        </button>
      )}
    </div>
  );
}
