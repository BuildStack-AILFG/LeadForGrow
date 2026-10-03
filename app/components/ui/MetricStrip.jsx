import cx from './cx';
import Skeleton from './Skeleton';

/**
 * MetricStrip — a single row of 3–5 key numbers (DESIGN_BRIEF §8 dashboard):
 * plain values with small labels and an optional muted note/delta, divided by
 * hairlines inside one bordered strip. Replaces rows of separate KPI cards.
 *
 * metrics: [{ label, value, note?, delta?: { value: '+12%', direction: 'up'|'down'|'flat' } }]
 */
const sentence = (s = '') => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

/**
 * Adapter for the older KPI-card objects ({ label, value, trend, trendLabel,
 * subText|subtext }) so existing pages keep their data mapping.
 */
export function fromKpiCard(card) {
  const hasTrend = card.trend != null && card.trend !== 0;
  return {
    label: sentence(card.label),
    value: card.value,
    delta: hasTrend
      ? { value: `${card.trend > 0 ? '+' : ''}${card.trend}%`, direction: card.trend > 0 ? 'up' : 'down' }
      : undefined,
    note: card.subText || card.subtext || card.trendLabel || undefined,
  };
}

export default function MetricStrip({ metrics, loading = false, className }) {
  const items = loading ? Array.from({ length: metrics?.length || 4 }) : metrics || [];
  return (
    <dl
      className={cx(
        'grid overflow-hidden rounded-lg border border-line bg-canvas',
        'grid-cols-2 sm:grid-cols-3 xl:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]',
        '[&>div]:border-line [&>div]:px-4 [&>div]:py-3 xl:[&>div:not(:first-child)]:border-l',
        className
      )}
      style={{ '--cols': items.length }}
    >
      {items.map((m, i) =>
        loading ? (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ) : (
          <div key={m.label} className="min-w-0">
            <dt className="truncate text-meta text-fg-tertiary">{m.label}</dt>
            <dd className="mt-1 flex items-baseline gap-2">
              <span className="text-page font-semibold text-fg tabular">{m.value}</span>
              {m.delta && (
                <span
                  className={cx(
                    'text-meta tabular',
                    m.delta.direction === 'up' ? 'text-success' : m.delta.direction === 'down' ? 'text-danger' : 'text-fg-tertiary'
                  )}
                >
                  {m.delta.value}
                </span>
              )}
            </dd>
            {m.note && <dd className="mt-0.5 truncate text-meta text-fg-tertiary">{m.note}</dd>}
          </div>
        )
      )}
    </dl>
  );
}
