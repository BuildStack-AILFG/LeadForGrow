import cx from './cx';

/**
 * Tooltip — CSS-only, shown on hover and keyboard focus of the wrapped
 * element. Dark neutral surface, 12px text. side: right (rail nav) · top · bottom.
 */
const SIDES = {
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
};

export default function Tooltip({ label, side = 'top', disabled = false, className, children }) {
  if (disabled || !label) return children;
  return (
    <span className={cx('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cx(
          'pointer-events-none absolute z-[70] whitespace-nowrap rounded-sm bg-fg px-2 py-1 text-meta text-canvas opacity-0',
          'transition-opacity duration-[var(--duration-fast)] group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          SIDES[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}
