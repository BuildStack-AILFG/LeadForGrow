'use client';

export default function CrmEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
      <p className="text-lg font-medium text-slate-700 dark:text-slate-300">{title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
