'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a number from 0 to `value` on mount / when value changes.
 * Purely presentational — does not alter the underlying data.
 */
export default function CountUp({
  value = 0,
  duration = 0, // static by default (DESIGN_BRIEF §4: motion only for user-caused changes)
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  format,
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef();
  const startRef = useRef();

  useEffect(() => {
    const target = Number(value) || 0;
    if (typeof window === 'undefined') {
      setDisplay(target);
      return;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce || duration <= 0) {
      setDisplay(target);
      return;
    }

    startRef.current = undefined;
    const step = (ts) => {
      if (startRef.current === undefined) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // easeOutExpo for a premium settle
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else setDisplay(target);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  const rendered = format
    ? format(display)
    : `${prefix}${display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

  return <span className={className}>{rendered}</span>;
}
