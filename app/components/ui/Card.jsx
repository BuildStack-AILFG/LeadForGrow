import cx from './cx';

/**
 * Panel — the one card. Flat: 1px border, radius 8, no shadow (shadows are
 * for floating layers only). Use for genuinely separate objects; group page
 * content with whitespace and dividers instead (DESIGN_BRIEF §4 "card soup").
 */
export default function Card({ as: Tag = 'div', padding = 'p-4', className, children, ...props }) {
  return (
    <Tag className={cx('rounded-lg border border-line bg-canvas', padding, className)} {...props}>
      {children}
    </Tag>
  );
}

/** Panel header row: title (16/600) + optional actions, separated by a hairline. */
export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-line px-4 py-3', className)}>
      <div className="min-w-0">
        <h3 className="text-body font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-dense text-fg-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
