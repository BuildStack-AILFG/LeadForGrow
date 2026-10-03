'use client';

import { forwardRef } from 'react';
import cx, { focusRing } from './cx';

/**
 * Button — DESIGN_BRIEF §8.
 * variant: primary (accent fill) · secondary (white, border) · ghost · destructive
 * size:    sm 28 · md 32 (default) · lg 36
 * Pass `icon` alone (no children) for a square icon button; give it `aria-label`.
 * `loading` keeps the button's width (label stays, made invisible).
 */
const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed disabled:bg-muted disabled:text-fg-disabled',
  secondary:
    'bg-canvas text-fg border border-line hover:bg-subtle hover:border-line-strong active:bg-muted disabled:text-fg-disabled disabled:bg-canvas',
  ghost:
    'bg-transparent text-fg-secondary hover:bg-muted hover:text-fg active:bg-line disabled:text-fg-disabled disabled:bg-transparent',
  destructive:
    'bg-danger text-white hover:brightness-95 active:brightness-90 disabled:bg-muted disabled:text-fg-disabled',
};

const SIZES = {
  sm: 'h-7 px-2.5 text-dense gap-1.5',
  md: 'h-8 px-3 text-body gap-2',
  lg: 'h-9 px-4 text-body gap-2',
};

const ICON_ONLY = { sm: 'h-7 w-7', md: 'h-8 w-8', lg: 'h-9 w-9' };

const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, disabled, className, children, type = 'button', ...props },
  ref
) {
  const iconOnly = Icon && !children;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium',
        'transition-colors duration-[var(--duration-fast)] ease-standard disabled:cursor-not-allowed',
        focusRing,
        VARIANTS[variant],
        iconOnly ? ICON_ONLY[size] : SIZES[size],
        className
      )}
      {...props}
    >
      <span className={cx('inline-flex items-center gap-[inherit]', loading && 'invisible')}>
        {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />}
        {children}
        {IconRight && <IconRight className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
        </span>
      )}
    </button>
  );
});

export default Button;
