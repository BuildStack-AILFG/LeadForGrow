'use client';

export default function SimpleBarChart({ data = [], maxBars = 6, color = '#2563eb' }) {
  const items = data.slice(0, maxBars);
  const max = Math.max(...items.map((d) => d.value), 1);

  if (items.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-fg-tertiary dark:text-fg-tertiary">
        No data yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="group">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-fg-secondary dark:text-fg-tertiary truncate max-w-[60%]">
              {item.label || 'Unknown'}
            </span>
            <span className="tabular-nums text-fg dark:text-slate-100 font-semibold">
              {item.value}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
