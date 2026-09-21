'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, X, BookOpen } from 'lucide-react';

const CARD_WIDTH = 320;
const GAP = 14;

function getRect(target) {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  // A responsively-hidden target (e.g. `hidden md:flex`) still matches the selector but
  // reports a zero-size rect — treat that the same as "no target found" instead of
  // spotlighting a phantom 0x0 box pinned to the corner.
  if (rect.width === 0 || rect.height === 0) return null;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return rect;
}

function placeCard(rect, placement, viewport, cardWidth) {
  if (!rect) {
    // No target found — center the card in the viewport.
    return {
      top: viewport.h / 2 - 90,
      left: viewport.w / 2 - cardWidth / 2,
    };
  }
  const spotPad = 8;
  let top;
  let left = rect.left + rect.width / 2 - cardWidth / 2;
  left = Math.max(16, Math.min(left, viewport.w - cardWidth - 16));

  const spaceBelow = viewport.h - rect.bottom;
  const spaceAbove = rect.top;
  const preferBelow = placement === 'bottom' || (!placement && spaceBelow > 200) || (placement === 'auto' && spaceBelow >= spaceAbove);

  if (placement === 'right') {
    return { top: Math.max(16, rect.top + rect.height / 2 - 80), left: Math.min(rect.right + GAP + spotPad, viewport.w - cardWidth - 16) };
  }
  if (placement === 'left') {
    return { top: Math.max(16, rect.top + rect.height / 2 - 80), left: Math.max(16, rect.left - cardWidth - GAP - spotPad) };
  }

  if (preferBelow) {
    top = rect.bottom + GAP + spotPad;
  } else {
    top = rect.top - GAP - spotPad - 190; // approx card height — clamped precisely against the real rendered height below
  }
  top = Math.max(12, Math.min(top, viewport.h - 12));
  return { top, left };
}

export default function TourOverlay({ tour, onNext, onBack, onSkip }) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: CARD_WIDTH });
  const cardRef = useRef(null);
  const step = tour.steps[tour.stepIndex];
  const isLast = tour.stepIndex === tour.steps.length - 1;
  const isFirst = tour.stepIndex === 0;

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    let raf;
    function measure() {
      const r = getRect(step?.target);
      setRect(r);
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      const cardWidth = Math.min(CARD_WIDTH, viewport.w - 32);
      setPos({ ...placeCard(r, step?.placement, viewport, cardWidth), width: cardWidth });
    }
    // Delay one tick so scrollIntoView from the previous measure settles.
    const t = setTimeout(measure, 60);
    const onResize = () => { raf = requestAnimationFrame(measure); };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [tour.stepIndex, step?.target, step?.placement]);

  // placeCard's vertical offset is only an estimate until the card is actually in the
  // DOM — once it renders, clamp `top` against its real measured height so it can never
  // overflow the bottom of a short viewport (the previous hardcoded `190` guess could).
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const height = cardRef.current.offsetHeight;
    const viewportH = window.innerHeight;
    setPos((prev) => {
      const maxTop = Math.max(12, viewportH - height - 12);
      const clampedTop = Math.min(prev.top, maxTop);
      if (clampedTop === prev.top) return prev;
      return { ...prev, top: clampedTop };
    });
  }, [pos.top, pos.left, pos.width]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft' && !isFirst) onBack();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onBack, onSkip, isFirst]);

  const spotlightStyle = useMemo(() => {
    if (!rect) return null;
    const pad = 8;
    return {
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 14,
      zIndex: 9998,
      pointerEvents: 'none',
    };
  }, [rect]);

  if (!mounted) return null;

  return createPortal(
    <div aria-live="polite" role="dialog" aria-label={step?.title || 'Product tour'}>
      {/* Dimmed backdrop — the spotlight box itself carries the giant box-shadow
          that dims everything else, so a fallback full backdrop only shows up
          when there's no target to spotlight. */}
      {!rect && (
        <div
          className="fixed inset-0 bg-slate-900/55 z-[9997]"
          style={{ animation: 'fadeIn 150ms ease-out' }}
          onClick={onSkip}
        />
      )}
      {spotlightStyle && <div className="lfg-tour-spotlight" style={spotlightStyle} />}

      <div
        ref={cardRef}
        className="lfg-tour-pop glass-panel fixed z-[9999] rounded-2xl text-slate-900 dark:text-slate-50 p-5"
        style={{ top: pos.top, left: pos.left, width: pos.width || CARD_WIDTH }}
      >
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {tour.label || 'Quick tour'}
          </p>
          <button
            type="button"
            onClick={onSkip}
            aria-label="Close tour"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors -mt-1 -mr-1 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug mb-1.5 text-slate-900 dark:text-slate-50">{step.title}</h3>
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>

        {tour.guideHref && (
          <Link
            href={tour.guideHref}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2.5"
          >
            <BookOpen className="w-3 h-3" /> Read the full guide
          </Link>
        )}

        <div className="flex items-center justify-between mt-5">
          <div className="flex items-center gap-1.5">
            {tour.steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === tour.stepIndex ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            {isFirst && (
              <button
                type="button"
                onClick={onSkip}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Skip tour
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            >
              {isLast ? "You're ready" : 'Next'}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
