'use client';

import { X } from 'lucide-react';

export default function RescheduleTaskModal({ open, task, dueDate, onDueDateChange, onClose, onSubmit }) {
  if (!open || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(dueDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg shadow-modal p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-fg dark:text-slate-50">Reschedule task</h3>
            <p className="text-xs text-fg-tertiary mt-0.5 truncate">{task.title}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">New due date</label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm font-medium text-fg-secondary bg-muted dark:bg-slate-800 rounded hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
