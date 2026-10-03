'use client';

import { useId } from 'react';
import cx, { focusRing } from './cx';

/** Switch — role="switch" button; accent only when on. */
export default function Switch({ checked, onChange, label, disabled, size = 'md', id, className }) {
  const autoId = useId();
  const switchId = id || autoId;
  const dims = size === 'sm' ? { track: 'h-4 w-7', knob: 'h-3 w-3', on: 'translate-x-3' } : { track: 'h-5 w-9', knob: 'h-4 w-4', on: 'translate-x-4' };

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-[var(--duration-fast)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-accent hover:bg-accent-hover' : 'bg-line-strong hover:bg-fg-disabled',
        focusRing,
        dims.track,
        className
      )}
    >
      <span
        aria-hidden
        className={cx(
          'rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,20,0.2)] transition-transform duration-[var(--duration-fast)] ease-standard',
          dims.knob,
          checked ? dims.on : 'translate-x-0'
        )}
      />
    </button>
  );
  if (!label) return control;
  return (
    <label htmlFor={switchId} className="inline-flex cursor-pointer items-center gap-2 text-body text-fg">
      {control}
      {label}
    </label>
  );
}
