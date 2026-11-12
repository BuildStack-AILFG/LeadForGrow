import cx from './cx';

/**
 * PageHeader — title (20/600) left, optional one-line description, actions
 * right (at most ONE primary button; rest secondary/ghost or in a ⋯ menu),
 * optional tab bar underneath. DESIGN_BRIEF §8.
 */
export default function PageHeader({ title, description, actions, tabs, meta, className }) {
  return (
    <header
      className={cx(
        'relative border-b border-line bg-canvas px-6',
        // faint gold glow top-right + green→gold hairline at the bottom
        'bg-[radial-gradient(420px_140px_at_100%_0%,var(--gold-subtle),transparent_70%)]',
        'after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-[linear-gradient(90deg,var(--accent)_0%,var(--gold)_35%,transparent_80%)] after:opacity-60 after:content-[""]',
        tabs ? 'pt-5' : 'py-5',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-page font-semibold text-fg">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-0.5 text-body text-fg-secondary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-4 [&>[role=tablist]]:border-b-0">{tabs}</div>}
    </header>
  );
}
