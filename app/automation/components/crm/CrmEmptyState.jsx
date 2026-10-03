'use client';

export default function CrmEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-16 px-4 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg">
      <p className="text-lg font-medium text-fg-secondary dark:text-fg-disabled">{title}</p>
      <p className="text-sm text-fg-tertiary mt-2 max-w-md mx-auto">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
