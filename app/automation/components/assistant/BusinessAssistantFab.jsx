'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBusinessAssistant } from '../../context/BusinessAssistantContext';
import { ASSISTANT_NAME } from './constants';
import GroviaIcon from './GroviaIcon';

const STORAGE_KEY = 'grovia-fab-position';
const EDGE_MARGIN = 8;
const DRAG_THRESHOLD = 5;

export default function BusinessAssistantFab() {
  const { isOpen, toggle } = useBusinessAssistant();
  const buttonRef = useRef(null);
  const dragStateRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);

  const clampToViewport = useCallback((x, y) => {
    if (typeof window === 'undefined') return { x, y };
    const el = buttonRef.current;
    const w = el?.offsetWidth || 200;
    const h = el?.offsetHeight || 56;
    const maxX = window.innerWidth - w - EDGE_MARGIN;
    const maxY = window.innerHeight - h - EDGE_MARGIN;
    return {
      x: Math.min(Math.max(EDGE_MARGIN, x), Math.max(EDGE_MARGIN, maxX)),
      y: Math.min(Math.max(EDGE_MARGIN, y), Math.max(EDGE_MARGIN, maxY)),
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        setPosition(clampToViewport(saved.x, saved.y));
      }
    } catch {
      /* ignore */
    }
  }, [clampToViewport]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setPosition((prev) => (prev ? clampToViewport(prev.x, prev.y) : prev));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport]);

  const getPoint = (e) => {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const onPointerDown = (e) => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const point = getPoint(e);
    dragStateRef.current = {
      offsetX: point.x - rect.left,
      offsetY: point.y - rect.top,
      startX: point.x,
      startY: point.y,
      moved: false,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const s = dragStateRef.current;
      if (!s) return;
      const point = getPoint(e);
      if (!s.moved) {
        const dx = Math.abs(point.x - s.startX);
        const dy = Math.abs(point.y - s.startY);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
        s.moved = true;
      }
      if (e.cancelable) e.preventDefault();
      const next = clampToViewport(point.x - s.offsetX, point.y - s.offsetY);
      setPosition(next);
    };

    const handleUp = () => {
      const s = dragStateRef.current;
      const moved = !!s?.moved;
      dragStateRef.current = null;
      setDragging(false);
      if (moved) {
        setPosition((p) => {
          if (p) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
            } catch {
              /* ignore */
            }
          }
          return p;
        });
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', handleUp);
    };
  }, [dragging, clampToViewport]);

  const handleClick = (e) => {
    if (dragStateRef.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    toggle();
  };

  if (isOpen) return null;

  const positionedStyle = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : undefined;

  return (
    <button
      ref={buttonRef}
      type="button"
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onClick={handleClick}
      style={{ ...(positionedStyle || {}), touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
      className={`fixed z-50 group w-11 h-11 rounded-full bg-[#0d9488] text-white shadow-xl shadow-black/30 hover:bg-[#0f766e] transition-[transform,background-color,box-shadow] duration-300 hover:scale-105 active:scale-95 select-none flex items-center justify-center ${
        position ? '' : 'bottom-6 right-6'
      }`}
      aria-label={`Open ${ASSISTANT_NAME} (drag to move)`}
      title={ASSISTANT_NAME}
    >
      <div className="relative">
        <GroviaIcon className="w-[18px] h-[18px]" />
        <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#0d9488]" />
      </div>
    </button>
  );
}

/** Compact header trigger */
export function BusinessAssistantTrigger({ className = '' }) {
  const { open } = useBusinessAssistant();

  return (
    <button
      type="button"
      onClick={open}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all bg-[#0f1419] text-white border border-white/[0.08] hover:border-teal-500/30 hover:bg-[#151b22] ${className}`}
    >
      <GroviaMark size="sm" />
      <span className="hidden md:inline font-medium tracking-tight">{ASSISTANT_NAME}</span>
    </button>
  );
}
