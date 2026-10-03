'use client';

import { forwardRef, useEffect, useId, useRef } from 'react';
import cx, { focusRing } from './cx';

/**
 * Checkbox — native input (keyboard + forms work), styled with accent-color so
 * the accent appears only when checked. Supports `indeterminate` for bulk select.
 */
const Checkbox = forwardRef(function Checkbox({ label, indeterminate = false, className, id, ...props }, ref) {
  const autoId = useId();
  const innerRef = useRef(null);
  const inputId = id || autoId;

  useEffect(() => {
    const el = innerRef.current;
    if (el) el.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (el) => {
    innerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  const box = (
    <input
      ref={setRefs}
      id={inputId}
      type="checkbox"
      className={cx(
        'h-4 w-4 shrink-0 cursor-pointer rounded-sm border-line-strong accent-[var(--accent)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        className
      )}
      {...props}
    />
  );
  if (!label) return box;
  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 text-body text-fg">
      {box}
      {label}
    </label>
  );
});

export default Checkbox;
