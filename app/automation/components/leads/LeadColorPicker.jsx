'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import RowColorSwatches from './RowColorSwatches';

const PANEL_WIDTH = 236; // w-[236px]

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
      className="fixed z-[100] w-[236px] p-3 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg shadow-popover"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-fg-secondary dark:text-slate-200">Row color</p>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <RowColorSwatches currentColor={currentColor} onSelect={onSelect} />
      {currentColor && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-2 w-full text-meta text-fg-tertiary dark:text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled py-1"
        >
          Clear color
        </button>
      )}
    </div>,
    document.body
  );
}
