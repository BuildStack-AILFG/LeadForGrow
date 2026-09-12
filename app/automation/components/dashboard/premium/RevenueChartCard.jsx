'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import PremiumCard from './PremiumCard';
import WidgetMenu from './WidgetMenu';
import { formatCurrency } from '@/lib/crm/formatCurrency';

const TIMEFRAMES = ['1D', '1W', '1M', '6M', '1Y', 'ALL'];
const PAD = { top: 10, right: 6, bottom: 10, left: 6 };

function formatLabel(label, timeframe) {
  if (!label) return '';
  // Ignore synthetic padding labels
  const clean = String(label).replace(/-prev$/, '');
  if (timeframe === '1D') {
    const h = clean.split('T')[1];
    return h ? `${parseInt(h, 10)}h` : clean;
  }
  if (timeframe === '1Y' || timeframe === '6M' || timeframe === 'ALL') {
    const [y, m] = clean.split('-');
    if (!y || !m) return clean;
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    if (Number.isNaN(d.getTime())) return clean;
    return d.toLocaleString('en-US', { month: 'short' });
  }
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (Number.isNaN(d.getTime())) return clean;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  }
  return clean;
}

function formatYTick(n) {
  const v = Number(n) || 0;
  if (v >= 10000000) return `${(v / 10000000).toFixed(v % 10000000 === 0 ? 0 : 1)}Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${Math.round(v)}`;
}

function niceMax(rawMax) {
  const m = Math.max(rawMax, 1);
  const pow = Math.pow(10, Math.floor(Math.log10(m)));
  const norm = m / pow;
  let nice;
  if (norm <= 1) nice = 1;
  else if (norm <= 2) nice = 2;
  else if (norm <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

/** Ensure we always have enough points to draw a line. */
function normalizeSeries(series, total) {
  let data = Array.isArray(series) ? series.map((d) => ({
    label: d.label,
    value: Number(d.value) || 0,
  })) : [];

  // Empty but we know total revenue — synthesize a minimal series
  if (data.length === 0 && total > 0) {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    data = [
      { label: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`, value: 0 },
      { label: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, value: total },
    ];
  }

  // Completely empty — flat zero line across 6 months
  if (data.length === 0) {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.push({
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        value: 0,
      });
    }
  }

  // Single point — extend to a line (zero → value)
  if (data.length === 1) {
    data = [{ label: `${data[0].label}-prev`, value: 0 }, data[0]];
  }

  return data;
}

function buildLinePath(points) {
  if (points.length < 2) {
    // Horizontal segment through the single point
    const p = points[0];
    if (!p) return '';
    return `M ${PAD.left} ${p.y} L ${100 - PAD.right} ${p.y}`;
  }

  // Smooth curve (Catmull-Rom → Bezier)
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function RevenueChartCard({ revenue, currency = 'INR', onRefresh }) {
  const [timeframe, setTimeframe] = useState('1Y');
  const [hoverIdx, setHoverIdx] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const plotRef = useRef(null);

  const tfIndex = TIMEFRAMES.indexOf(timeframe);
  const rawSeries = revenue?.chart?.series?.[timeframe] || [];
  const total = revenue?.chart?.totalRevenue ?? revenue?.wonRevenue ?? 0;
  const monthChange = revenue?.monthChange ?? 0;
  const monthUp = monthChange >= 0;

  const chart = useMemo(() => {
    const series = normalizeSeries(rawSeries, total);
    const values = series.map((d) => d.value);
    const rawMax = Math.max(...values, 0);
    const max = niceMax(rawMax || 1);
    const yTicks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);

    const plotW = 100 - PAD.left - PAD.right;
    const plotH = 100 - PAD.top - PAD.bottom;
    const n = series.length;

    const points = series.map((d, i) => {
      const x = PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
      const y = PAD.top + plotH - (d.value / max) * plotH;
      return {
        x,
        y,
        value: d.value,
        label: d.label,
        displayLabel: formatLabel(d.label, timeframe),
      };
    });

    const lineD = buildLinePath(points);
    const first = points[0];
    const last = points[points.length - 1];
    const baseline = PAD.top + plotH;
    const areaD = lineD
      ? `${lineD} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
      : '';

    return {
      points,
      yTicks: [...yTicks].reverse(),
      max,
      lineD,
      areaD,
    };
  }, [rawSeries, total, timeframe]);

  const handleMouseMove = useCallback(
    (e) => {
      if (!plotRef.current || !chart.points.length) return;
      const rect = plotRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      let closest = 0;
      let minDist = Infinity;
      chart.points.forEach((p, i) => {
        const dist = Math.abs(p.x - relX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setHoverIdx(closest);
    },
    [chart.points]
  );

  const hovered = hoverIdx != null ? chart.points[hoverIdx] : null;
  const xLabelStep = chart.points.length > 12 ? 2 : chart.points.length > 8 ? 1 : 1;

  return (
    <PremiumCard padding="p-4" className="h-[40vh] min-h-[240px] max-h-[80vh] flex flex-col overflow-auto resize-y">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <p className="text-[13px] font-normal text-[#475569]">Revenue</p>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <p className="text-[22px] font-medium text-[#1A1D1F] tabular-nums leading-none tracking-[-0.02em]">
              {formatCurrency(total, currency)}
            </p>
            <p className="text-[12px] font-normal text-[#94A3B8]">
              <span className={monthUp ? 'text-[#059669]' : 'text-[#E5484D]'}>
                {monthUp ? '+' : ''}{monthChange}%
              </span>
              {' '}vs last month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <div className="relative flex p-1 bg-[#F2F4F3] rounded-none">
            <span
              className="absolute top-1 bottom-1 rounded-none bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: 4,
                width: `calc((100% - 8px) / ${TIMEFRAMES.length})`,
                transform: `translateX(${tfIndex * 100}%)`,
              }}
            />
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTimeframe(tf);
                  setHoverIdx(null);
                }}
                className={`relative z-10 flex-1 px-2 py-1.5 text-[11px] font-normal rounded-none transition-colors duration-200 ${timeframe === tf ? 'text-[#1A1D1F]' : 'text-[#64748B] hover:text-[#1A1D1F]'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <WidgetMenu
            onRefresh={onRefresh}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            collapsed={collapsed}
          />
        </div>
      </div>

      <div
        className={`flex flex-1 min-h-0 transition-all duration-300 ease-out ${collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100'
          }`}
      >
        <div className="flex w-full h-full min-h-0">
          {/* Y-axis */}
          <div className="flex flex-col justify-between pr-2 py-1 shrink-0 w-9 text-right">
            {chart.yTicks.map((tick) => (
              <span
                key={tick}
                className="text-[10px] font-normal text-[#94A3B8] tabular-nums leading-none"
              >
                {formatYTick(tick)}
              </span>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div
              ref={plotRef}
              className="relative flex-1 min-h-0"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <svg
                key={timeframe}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1D4B3E" stopOpacity="0.2" />
                    <stop offset="55%" stopColor="#1D4B3E" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#1D4B3E" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = PAD.top + ((100 - PAD.top - PAD.bottom) / 4) * i;
                  return (
                    <line
                      key={`h-${i}`}
                      x1={PAD.left}
                      x2={100 - PAD.right}
                      y1={y}
                      y2={y}
                      stroke="#E8ECEF"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}

                {/* Vertical grid */}
                {chart.points.map((p, i) => (
                  <line
                    key={`v-${i}`}
                    x1={p.x}
                    x2={p.x}
                    y1={PAD.top}
                    y2={100 - PAD.bottom}
                    stroke="#F1F3F2"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}

                {/* Area under line */}
                {chart.areaD && (
                  <path d={chart.areaD} fill="url(#revenueGrad)" />
                )}

                {/* Main line — always drawn */}
                {chart.lineD && (
                  <path
                    d={chart.lineD}
                    fill="none"
                    stroke="#1D4B3E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}

                {/* Hover */}
                {hovered && (
                  <>
                    <line
                      x1={hovered.x}
                      x2={hovered.x}
                      y1={PAD.top}
                      y2={100 - PAD.bottom}
                      stroke="#1D4B3E"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.4"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={hovered.x}
                      cy={hovered.y}
                      r="4"
                      fill="#1D4B3E"
                      opacity="0.12"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={hovered.x}
                      cy={hovered.y}
                      r="2"
                      fill="#1D4B3E"
                      stroke="white"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </svg>

              {hovered && (
                <div
                  className="absolute top-0 pointer-events-none px-2.5 py-1.5 bg-[#1A1D1F] text-white rounded-none shadow-[0_6px_16px_rgba(16,24,40,0.18)] tabular-nums whitespace-nowrap z-10"
                  style={{
                    left: `${hovered.x}%`,
                    transform: `translateX(${hovered.x > 75 ? '-90%' : hovered.x < 15 ? '-10%' : '-50%'})`,
                  }}
                >
                  <p className="text-[10px] text-white/60 font-normal">{hovered.displayLabel}</p>
                  <p className="text-[12px] font-medium">{formatCurrency(hovered.value, currency)}</p>
                </div>
              )}
            </div>

            {/* X-axis */}
            <div className="relative h-5 mt-1 shrink-0">
              {chart.points.map((p, i) => {
                const show =
                  i === 0 ||
                  i === chart.points.length - 1 ||
                  i % xLabelStep === 0;
                if (!show) return null;
                // Skip synthetic prev labels on axis
                if (String(p.label).endsWith('-prev')) return null;
                return (
                  <span
                    key={`${p.label}-${i}`}
                    className="absolute text-[10px] font-normal text-[#94A3B8] tabular-nums -translate-x-1/2"
                    style={{ left: `${p.x}%` }}
                  >
                    {p.displayLabel}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
