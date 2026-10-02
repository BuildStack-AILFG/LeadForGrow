import cx from './cx';

/**
 * EmptyState — small neutral icon, what's missing, when it appears, one action.
 * Copy rules (Stripe/Carbon, docs/design/research.md): title states what's
 * missing ("No leads yet."), description <14 words, action mirrors the title
 * ("Add lead"). For filtered-to-zero, pass a "No leads match your filters."
 * title and a Clear filters action instead of a create action.
 */
export default function EmptyState({ icon: Icon, title, description, action, secondaryAction, compact = false, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center text-center', compact ? 'px-4 py-8' : 'px-6 py-16', className)}>
      {Icon && (
        <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-fg-tertiary">
          <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </span>
      )}
      <p className="text-body font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-dense text-fg-secondary">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/** ErrorState — what happened + how to fix + retry. */
export function ErrorState({ title = 'Couldn’t load this.', description = 'Check your connection and try again.', action, className }) {
  return (
    <div role="alert" className={cx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <p className="text-body font-medium text-fg">{title}</p>
      <p className="mt-1 max-w-sm text-dense text-fg-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
