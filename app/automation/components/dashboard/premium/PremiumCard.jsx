'use client';

import { DASHBOARD_THEME } from './tokens';

/**
 * Base surface for every dashboard widget — one radius, one border, one shadow.
 * `interactive` adds a subtle lift on hover for clickable cards.
 */
export default function PremiumCard({
  children,
  className = '',
  padding = 'p-6',
  interactive = false,
  style,
  ...props
}) {
  return (
    <div
      className={`group/card relative bg-white rounded-none border border-[#E9ECEF] ${padding} transition-[box-shadow,transform,border-color] duration-300 ease-out ${interactive ? 'hover:-translate-y-0.5 hover:border-[#DDE2E6]' : ''
        } ${className}`}
      style={{ boxShadow: DASHBOARD_THEME.shadow, ...style }}
      onMouseEnter={interactive ? (e) => { e.currentTarget.style.boxShadow = DASHBOARD_THEME.shadowHover; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.boxShadow = DASHBOARD_THEME.shadow; } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
