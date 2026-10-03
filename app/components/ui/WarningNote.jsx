import { AlertTriangle } from 'lucide-react';

/**
 * The app's amber warning card: always a warning icon + message, so a warning never reads as plain text.
 * Use this instead of hand-rolled `bg-amber-50 border-amber-200` boxes.
 */
export default function WarningNote({ children, className = '' }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300 ${className}`}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-px text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
