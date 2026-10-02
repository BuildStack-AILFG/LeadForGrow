'use client';

import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import cx from './cx';
import { Field, fieldClass } from './Input';

/** Native <select> in the shared field chrome — keyboard/screen-reader behaviour for free. */
const Select = forwardRef(function Select({ label, hint, error, id, options, children, className, size = 'md', ...props }, ref) {
  const autoId = useId();
  const selectId = id || autoId;
  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={cx(fieldClass(error), 'appearance-none pr-8', size === 'sm' && 'h-8 text-dense', className)}
        {...props}
      >
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-tertiary" strokeWidth={1.5} aria-hidden />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={selectId}>
      {control}
    </Field>
  );
});

export default Select;
