'use client';

import { toast } from 'react-hot-toast';

/** A toast with an Undo button (a plain toast cannot hold a button). `onUndo` runs once, then the toast closes. */
export function showUndoToast(message, onUndo, duration = 6000) {
  return toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 rounded bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-2.5 text-sm shadow-lg ${t.visible ? 'animate-in fade-in' : 'opacity-0'}`}
        role="status"
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={() => { toast.dismiss(t.id); onUndo(); }}
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Undo
        </button>
      </div>
    ),
    { duration }
  );
}
