'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LEAD_ROW_COLORS } from './constants';

const PANEL_WIDTH = 208; // w-52

export default function LeadColorPicker({ open, onClose, currentColor, onSelect, anchorRef }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Rendered through a portal and positioned via the anchor's own bounding rect (fixed
  // coordinates) instead of being nested `position: absolute` inside the table's
  // overflow-x-auto/overflow-hidden ancestors — those ancestors were clipping the popover
  // and fighting with it for scroll/overflow, causing the scrollbar glitch + misalignment.
  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return;

    function place() {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      let left = rect.right - PANEL_WIDTH;
      left = Math.max(8, Math.min(left, viewport.w - PANEL_WIDTH - 8));

      const panelHeight = panelRef.current?.offsetHeight || 180;
      let top = rect.bottom + 4;
      if (top + panelHeight > viewport.h - 8) {
        top = rect.top - panelHeight - 4;
      }
      top = Math.max(8, top);
      setPos({ top, left });
    }

    place();
    // Re-measure once the panel has actually rendered so `panelHeight` reflects its real
    // size (varies with whether "Clear color" is shown) rather than the first-pass estimate.
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, currentColor]);

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

  if (!open || !mounted || !pos) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[100] w-52 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg"
      style={{ top: pos.top, left: pos.left }}
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
    </div>,
    document.body
  );
}
