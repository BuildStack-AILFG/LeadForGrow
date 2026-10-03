'use client';

const COLORS = ['#1D4B3E', '#4F7CA8', '#5C8F8A', '#A08040', '#8A5F86', '#6B7A8F', '#A0664F'];

export default function SimpleDonutChart({ data = [], size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!total) {
    return (
      <div className="flex items-center justify-center text-sm text-fg-tertiary dark:text-fg-tertiary" style={{ minHeight: size }}>
        No data yet
      </div>
    );
  }

  let cumulative = 0;
  const r = 40;
  const cx = 50;
  const cy = 50;
  const stroke = 12;

  const segments = data.map((item, i) => {
    const fraction = item.value / total;
    const start = cumulative;
    cumulative += fraction;
    const largeArc = fraction > 0.5 ? 1 : 0;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    return { d, color: COLORS[i % COLORS.length], ...item };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-fg" strokeWidth={stroke} />
        {segments.map((seg) => (
          <path
            key={seg.label}
            d={seg.d}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-slate-900 dark:fill-slate-100 text-meta font-semibold">
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-400 text-meta">
          total
        </text>
      </svg>
      <ul className="flex-1 space-y-1.5 w-full min-w-0">
        {segments.slice(0, 5).map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="truncate text-fg-secondary dark:text-fg-tertiary flex-1">{seg.label || 'Unknown'}</span>
            <span className="tabular-nums font-medium text-fg dark:text-slate-200">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
