'use client';

/**
 * Nav count badge: 11px, tertiary on muted, right-aligned (DESIGN_BRIEF §7).
 * Neutral by design — only the notification bell uses danger for unread.
 * In the collapsed rail it becomes a small neutral dot on the icon.
 */
export default function NotificationBadge({ count, collapsed = false }) {
  if (!count || count <= 0) return null;
  if (collapsed) {
    return <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-fg-tertiary" />;
  }
  return (
    <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-sm bg-muted px-1 text-[11px] font-medium leading-none text-fg-tertiary tabular">
      <span className="sr-only">, </span>
      {count > 99 ? '99+' : count}
    </span>
  );
}
