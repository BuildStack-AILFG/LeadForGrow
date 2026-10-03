'use client';

/**
 * Custom Grovia mark — growth arc, not a generic AI brain/sparkle icon.
 * Ascending path + peak node = business growth advisor.
 */
export default function GroviaIcon({ className = 'w-5 h-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      {/* Base node */}
      <circle cx="5.5" cy="17.5" r="2.25" fill="currentColor" opacity="0.45" />
      {/* Growth curve */}
      <path
        d="M5.5 17.5 C5.5 17.5 8 11.5 12 12.5 C15 13.25 16.5 10 19 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak */}
      <circle cx="19" cy="7" r="2.75" fill="currentColor" />
    </svg>
  );
}

/** Icon container — solid brand tile, no purple AI gradient */
export function GroviaMark({ size = 'md', className = '' }) {
  const sizes = {
    sm: { box: 'w-6 h-6 rounded-md', icon: 'w-3.5 h-3.5' },
    md: { box: 'w-9 h-9 rounded-lg', icon: 'w-4 h-4' },
    lg: { box: 'w-11 h-11 rounded-lg', icon: 'w-5 h-5' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={`${s.box} bg-accent flex items-center justify-center text-white shadow-popover ${className}`}
    >
      <GroviaIcon className={s.icon} />
    </div>
  );
}
