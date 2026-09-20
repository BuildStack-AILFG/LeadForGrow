'use client';

/**
 * Force light chrome for WhatsApp Flows routes even if the app shell is in dark mode.
 */
export default function WhatsAppFlowsLayout({ children }) {
  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-900 text-slate-900 dark:text-slate-50 [&_*]:[color-scheme:light]">
      {children}
    </div>
  );
}
