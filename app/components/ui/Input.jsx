'use client';

import { forwardRef, useId } from 'react';
import cx, { focusRing } from './cx';

/** Shared field chrome — 36px, radius 6, border → border-strong on hover, focus ring. */
export const fieldClass = (error) =>
  cx(
    'h-9 w-full rounded-md border bg-canvas px-3 text-body text-fg placeholder:text-fg-tertiary',
    'transition-colors duration-[var(--duration-fast)]',
    'disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-disabled',
    focusRing,
    error ? 'border-danger' : 'border-line hover:border-line-strong'
  );

/**
 * Field — label above, optional hint (tertiary), inline error that says what to do.
 * Wraps any control; Input/Select/Textarea use it.
 */
export function Field({ label, hint, error, htmlFor, required, children, className }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-dense font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-fg-tertiary" aria-hidden>*</span>}
        </label>
      )}
      {hint && !error && <p className="text-meta text-fg-tertiary" id={htmlFor ? `${htmlFor}-hint` : undefined}>{hint}</p>}
      {children}
      {error && (
        <p className="text-meta text-danger" id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
    </div>
  );
}

const Input = forwardRef(function Input({ label, hint, error, id, className, fieldClassName, required, icon: Icon, ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const control = (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-tertiary" strokeWidth={1.5} aria-hidden />}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(fieldClass(error), Icon && 'pl-8', className)}
        {...props}
      />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId} required={required} className={fieldClassName}>
      {control}
    </Field>
  );
});

export default Input;

export const Textarea = forwardRef(function Textarea({ label, hint, error, id, className, rows = 3, ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cx(fieldClass(error), 'h-auto py-2', className)}
        {...props}
      />
    </Field>
  );
});
