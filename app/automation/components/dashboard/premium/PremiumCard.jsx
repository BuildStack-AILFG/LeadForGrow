'use client';

/**
 * Base surface for every dashboard widget — flat, 1px border, radius 8, no
 * shadow and no hover lift (DESIGN_BRIEF §4/§6: shadows are for floating
 * layers only). `interactive` cards get a stronger border on hover.
 */
export default function PremiumCard({ children, className = '', padding = 'p-6', interactive = false, style, ...props }) {
  return (
    <div
      className={`group/card relative rounded-lg border border-line bg-canvas ${padding} ${interactive ? 'transition-colors duration-[var(--duration-fast)] hover:border-line-strong' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
