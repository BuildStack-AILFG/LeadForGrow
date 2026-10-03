'use client';

export default function Sparkline({ data = [], color = '#2563eb', height = 32 }) {
  if (!data.length) {
    return <div className="h-8 bg-subtle dark:bg-slate-800/50 rounded" style={{ height }} />;
  }

  const max = Math.max(...data, 1);
  const pad = 2;
  const w = 100;
  const h = height - pad * 2;
  const points = data
    .map((v, i) => {
      const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
      const y = pad + h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" points={points} />
    </svg>
  );
}
