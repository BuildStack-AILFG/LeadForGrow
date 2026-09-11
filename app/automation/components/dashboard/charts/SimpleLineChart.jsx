'use client';

export default function SimpleLineChart({
  data = [],
  dataKey = 'leads',
  secondaryKey,
  height = 160,
  stroke = '#2563eb',
  secondaryStroke = '#10b981'
}) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-500 dark:text-slate-400" style={{ height }}>
        No trend data yet
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => (a._id || '').localeCompare(b._id || ''));
  const values = sorted.map((d) => d[dataKey] || 0);
  const secondaryValues = secondaryKey ? sorted.map((d) => d[secondaryKey] || 0) : [];
  const max = Math.max(...values, ...(secondaryValues.length ? secondaryValues : [0]), 1);

  const pad = 8;
  const w = 100;
  const h = 100 - pad * 2;

  const toPoints = (vals) =>
    vals
      .map((v, i) => {
        const x = pad + (i / Math.max(vals.length - 1, 1)) * (w - pad * 2);
        const y = pad + h - (v / max) * h;
        return `${x},${y}`;
      })
      .join(' ');

  const points = toPoints(values);
  const secondaryPoints = secondaryValues.length ? toPoints(secondaryValues) : null;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={pad}
            x2={100 - pad}
            y1={pad + h * ratio}
            y2={pad + h * ratio}
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="0.3"
          />
        ))}
        {secondaryPoints && (
          <polyline
            fill="none"
            stroke={secondaryStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={secondaryPoints}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 dark:text-slate-500 px-1">
        <span>{sorted[0]?._id?.slice(5) || ''}</span>
        <span>{sorted[sorted.length - 1]?._id?.slice(5) || ''}</span>
      </div>
      {secondaryKey && (
        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-3 h-0.5 rounded bg-teal-600" /> Leads
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-3 h-0.5 rounded bg-emerald-500" /> Conversions
          </span>
        </div>
      )}
    </div>
  );
}
