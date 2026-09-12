'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, RefreshCw, ChevronsDownUp, ChevronsUpDown, Maximize2 } from 'lucide-react';

/**
 * Reusable three-dot widget menu: Refresh, Collapse/Expand, plus custom items.
 * UI-only affordances — refresh/collapse call the provided handlers.
 */
export default function WidgetMenu({ onRefresh, onToggleCollapse, collapsed, extraItems = [] }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleRefresh = async () => {
    setOpen(false);
    if (!onRefresh) return;
    try {
      setBusy(true);
      await onRefresh();
    } finally {
      setTimeout(() => setBusy(false), 500);
    }
  };

  const items = [
    onRefresh && {
      key: 'refresh',
      label: 'Refresh',
      icon: RefreshCw,
      onClick: handleRefresh,
    },
    onToggleCollapse && {
      key: 'collapse',
      label: collapsed ? 'Expand' : 'Collapse',
      icon: collapsed ? ChevronsUpDown : ChevronsDownUp,
      onClick: () => {
        setOpen(false);
        onToggleCollapse();
      },
    },
    ...extraItems,
  ].filter(Boolean);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-none text-[#98A2B3] transition-all duration-200 hover:bg-[#F2F4F3] hover:text-[#344054] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4B3E]/25 ${open ? 'bg-[#F2F4F3] text-[#344054]' : ''
          }`}
        aria-label="Widget options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="lfg-scale-in absolute right-0 top-full mt-1.5 z-30 min-w-[168px] py-1.5 bg-white border border-[#E8ECEF] rounded-none shadow-[0_12px_32px_rgba(16,24,40,0.12)]"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={item.onClick}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-[#344054] transition-colors hover:bg-[#F6F8F7]"
              >
                {Icon && <Icon className="w-4 h-4 text-[#98A2B3]" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
