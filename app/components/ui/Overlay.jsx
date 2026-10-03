'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import cx from './cx';
import Button from './Button';

/**
 * Shared modal behaviour for Sheet and Dialog: portal, Escape to close,
 * body scroll lock, initial focus inside, focus trap, focus restore.
 */
function useModal(open, onClose, panelRef) {
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const focusables = () =>
      [...(panel?.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') || [])];
    (panel?.querySelector('[data-autofocus]') || focusables()[0] || panel)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      } else if (e.key === 'Tab') {
        const els = focusables();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

function OverlayHeader({ titleId, title, description, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 id={titleId} className="text-title font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-dense text-fg-secondary">{description}</p>}
      </div>
      <Button variant="ghost" size="sm" icon={X} aria-label="Close" onClick={onClose} />
    </div>
  );
}

/** Sheet — right side panel (480–560px) for create/edit records. */
export function Sheet({ open, onClose, title, description, footer, width = 520, children }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useModal(open, onClose, panelRef);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-[rgba(16,24,20,0.24)]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ width: `min(${width}px, 100vw)` }}
        className="absolute inset-y-0 right-0 flex flex-col bg-canvas shadow-modal outline-none"
      >
        <OverlayHeader titleId={titleId} title={title} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Dialog — centred, for confirmations and short focused tasks only. */
export function Dialog({ open, onClose, title, description, footer, width = 440, children }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useModal(open, onClose, panelRef);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(16,24,20,0.32)]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ width: `min(${width}px, 100%)` }}
        className={cx('relative flex max-h-[85vh] flex-col rounded-xl bg-canvas shadow-modal outline-none')}
      >
        <OverlayHeader titleId={titleId} title={title} description={description} onClose={onClose} />
        {children && <div className="overflow-y-auto px-5 py-4 text-body text-fg-secondary">{children}</div>}
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
