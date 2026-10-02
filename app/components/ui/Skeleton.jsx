import cx from './cx';

/** Skeleton block — neutral pulse, disabled under prefers-reduced-motion. */
export default function Skeleton({ className, style }) {
  return <span aria-hidden style={style} className={cx('block rounded-sm bg-muted motion-safe:animate-pulse', className)} />;
}

/** Table-shaped skeleton: header + N rows matching the real DataTable geometry. */
export function TableSkeleton({ rows = 8, columns = 5, dense = false }) {
  return (
    <div role="status" aria-label="Loading" className="overflow-hidden rounded-lg border border-line">
      <div className="flex h-9 items-center gap-6 border-b border-line bg-subtle px-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cx('h-3', i === 0 ? 'w-32' : 'w-20')} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cx('flex items-center gap-6 border-b border-line px-4 last:border-b-0', dense ? 'h-8' : 'h-10')}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cx('h-3', i === 0 ? 'w-40' : 'w-16')} />
          ))}
        </div>
      ))}
    </div>
  );
}
