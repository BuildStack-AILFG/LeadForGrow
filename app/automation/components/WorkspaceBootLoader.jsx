'use client';

import { useEffect, useRef, useState } from 'react';
import LogoMark from './layout/LogoMark';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Full-screen loader shown while the workspace boots. Pure CSS transitions: it used to pull
 * framer-motion into every /automation page load and re-render React on every animation
 * frame just to move the progress bar.
 *
 * The bar eases towards 92% while we wait; once `complete` it fills to 100% in ~250 ms,
 * fades out, then calls onFinished.
 */
export default function WorkspaceBootLoader({ complete = false, onFinished }) {
  const [started, setStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Next frame after mount, so the browser animates from 0% instead of jumping.
  useEffect(() => {
    const id = requestAnimationFrame(() => setStarted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!complete || finishedRef.current) return undefined;
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinishedRef.current?.();
    };
    // Background tabs pause transitions, and reduced-motion users get no animation:
    // finish straight away in both cases.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (document.visibilityState === 'hidden' || reduced) {
      finish();
      return undefined;
    }
    const fade = setTimeout(() => setExiting(true), 250);
    const done = setTimeout(finish, 550);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [complete]);

  const width = complete ? '100%' : started ? '92%' : '0%';
  const barTransition = complete ? `width 250ms ${EASE}` : `width 3500ms ${EASE}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-canvas"
      style={{ opacity: exiting ? 0 : 1, transition: `opacity 300ms ${EASE}` }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center px-6">
        <div className="flex flex-col items-center motion-safe:animate-[lfg-boot-in_500ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <LogoMark size={40} />
          <p className="mt-4 text-dense font-semibold text-fg">LeadForGrow</p>
        </div>

        <div className="mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-accent" style={{ width, transition: barTransition }} />
        </div>

        <p className="mt-5 text-dense text-fg-tertiary">Loading workspace</p>
      </div>
    </div>
  );
}
