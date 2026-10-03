'use client';

import { Loader2 } from 'lucide-react';

/**
 * Shared loading indicator used across the app.
 *
 * <PageLoader />                            — full-viewport centered spinner
 * <PageLoader label="Loading leads…" />     — with descriptive text
 * <PageLoader height="60vh" />              — fixed height instead of viewport
 * <PageLoader inline />                     — small inline spinner (for buttons/sections)
 * <PageLoader variant="skeleton" count={5}/> — shimmer skeleton rows
 *
 * Always uses the brand emerald color so loading state feels consistent
 * from the login screen through every page.
 */
export default function PageLoader({
  label,
  height = '60vh',
  inline = false,
  variant = 'spinner',
  count = 4,
  className = '',
}) {
  if (variant === 'skeleton') {
    return (
      <div className={`p-6 space-y-3 ${className}`}>
        {label && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-fg-tertiary">
            <Loader2 className="w-4 h-4 animate-spin text-accent-fg" />
            <span>{label}</span>
          </div>
        )}
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-canvas rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  }

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-2 text-xs text-fg-tertiary ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-fg" />
        {label || 'Loading…'}
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      style={{ minHeight: height }}
    >
      <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">
        {label || 'Loading…'}
      </p>
    </div>
  );
}
