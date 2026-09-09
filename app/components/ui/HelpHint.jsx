'use client';

import { useId, useState } from 'react';
import { Info } from 'lucide-react';

/**
 * HelpHint — the small ⓘ that explains a confusing field without cluttering
 * the UI. Click or focus to open; click outside / Escape / blur to close.
 * Keyboard accessible (button + aria-describedby) so it doesn't regress a11y
 * for the sake of a "cute" tooltip.
 *
 * Usage:
 *   <label className="inline-flex items-center gap-1.5">
 *     Trigger <HelpHint text="When a new lead enters LeadForGrow, this automation will start." />
 *   </label>
 */
export default function HelpHint({ text, title, placement = 'top', size = 'sm', className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const iconSize = size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label={title ? `Help: ${title}` : 'Help'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        className="inline-flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1"
      >
        <Info className={iconSize} strokeWidth={2} />
      </button>

      {open && (
        <span
          role="tooltip"
          id={id}
          className={`absolute z-[70] w-64 pointer-events-none animate-[fadeIn_120ms_ease-out] ${placementClasses[placement] || placementClasses.top}`}
        >
          <span className="block rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs leading-relaxed px-3.5 py-2.5 shadow-xl shadow-slate-900/20 border border-white/10">
            {title && <span className="block font-semibold mb-0.5">{title}</span>}
            {text}
          </span>
        </span>
      )}
    </span>
  );
}
