'use client';

/**
 * Nav count badge. Neutral on rest rows; on the solid green active row it
 * flips to a translucent white chip so it stays readable.
 * In the collapsed rail it becomes a small dot on the icon.
 */
export default function NotificationBadge({ count, collapsed = false, inverse = false }) {
  if (!count || count <= 0) return null;
  if (collapsed) {
    return <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />;
  }
  return (
    <span
      className={`inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-sm px-1 text-meta font-medium leading-none tabular ${
        inverse ? 'bg-canvas/20 text-white' : 'bg-muted text-fg-secondary'
      }`}
    >
      <span className="sr-only">, </span>
      {count > 99 ? '99+' : count}
    </span>
  );
}
