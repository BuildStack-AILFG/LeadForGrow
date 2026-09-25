'use client';

export default function NotificationBadge({ count, urgent = false, dot = false, collapsed = false }) {
  if (dot && !count) {
    return (
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
        title="Active"
      />
    );
  }

  if (!count || count <= 0) return null;

  if (collapsed) {
    return (
      <span
        className={`absolute right-1 top-1 h-2 w-2 rounded-full ${
          urgent ? 'bg-teal-600' : 'bg-slate-400'
        }`}
      />
    );
  }

  return (
    <span
      className={`inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-semibold tabular-nums ${
        urgent
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          : 'bg-[#F1F5F9] text-[#64748B] dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
