'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import cx from './cx';

/**
 * Popover — portal-rendered, viewport-clamped floating panel anchored to a
 * trigger (same approach the app already uses for row menus, so it never
 * gets clipped by scroll/overflow containers). Closes on Escape / outside
 * click and returns focus to the trigger.
 *
 *   <Popover trigger={(props) => <Button {...props}>Open</Button>}>
 *     {({ close }) => …}
 *   </Popover>
 */
export function usePopover() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((o) => !o), close: () => setOpen(false) };
}

export default function Popover({ trigger, children, align = 'start', side = 'bottom', width, className, open: openProp, onOpenChange }) {
  const internal = usePopover();
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internal.open;
  const setOpen = useCallback((v) => (controlled ? onOpenChange?.(v) : internal.setOpen(v)), [controlled, onOpenChange, internal]);

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  const place = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect();
    const p = panelRef.current;
    if (!t || !p) return;
    const pw = p.offsetWidth;
    const ph = p.offsetHeight;
    const gap = 4;
    let top = side === 'top' ? t.top - ph - gap : t.bottom + gap;
    if (top + ph > window.innerHeight - 8) top = Math.max(8, t.top - ph - gap);
    let left = align === 'end' ? t.right - pw : t.left;
    left = Math.min(Math.max(8, left), window.innerWidth - pw - 8);
    setPos({ top, left });
  }, [align, side]);

  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place, setOpen]);

  const close = () => setOpen(false);

  return (
    <>
      {trigger({ ref: triggerRef, onClick: () => setOpen(!open), 'aria-expanded': open, 'aria-haspopup': 'true' })}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, visibility: pos ? 'visible' : 'hidden' }}
            className={cx('z-[80] rounded-lg bg-canvas shadow-popover', className)}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body
        )}
    </>
  );
}
