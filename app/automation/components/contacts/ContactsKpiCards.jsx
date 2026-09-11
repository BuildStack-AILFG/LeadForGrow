'use client';

function MiniSparkline({ data = [], color = '#344054' }) {
  if (!data?.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function KpiCard({ label, value, trend, trendLabel, sparkData, accent, subText }) {
  const trendUp = trend == null ? true : trend >= 0;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-[#667085] mb-2">{label}</p>
          <p className="text-[26px] font-semibold text-[#101828] tracking-tight tabular-nums leading-none">
            {value}
          </p>
          {subText && (
            <p className="text-[11px] font-medium mt-2 text-[#667085]">{subText}</p>
          )}
          {trendLabel && trend != null && (
            <p className={`text-[11px] font-medium mt-2 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendUp && trend > 0 ? '+' : ''}{trend}% {trendLabel}
            </p>
          )}
          {trendLabel && trend == null && !subText && (
            <p className="text-[11px] font-medium mt-2 text-[#667085]">{trendLabel}</p>
          )}
        </div>
        <MiniSparkline data={sparkData} color={accent || '#667085'} />
      </div>
    </div>
  );
}

export default function ContactsKpiCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] rounded-xl border border-[#E5E7EB] bg-white animate-shimmer bg-gradient-to-r from-[#F9FAFB] via-white to-[#F9FAFB] bg-[length:200%_100%]" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Contacts',
      value: stats.totalContacts?.toLocaleString() || '0',
      trend: stats.totalContactsTrend,
      trendLabel: 'this month',
      sparkData: stats.sparklines?.contacts,
      accent: '#344054',
    },
    {
      label: 'Business Contacts',
      value: stats.businessContacts?.toLocaleString() || '0',
      trendLabel: 'business type',
      sparkData: stats.sparklines?.business,
      accent: '#059669',
    },
    {
      label: 'Engaged',
      value: `${stats.engagedRate ?? 0}%`,
      subText: `${stats.withOpenDeals?.toLocaleString() || '0'} with open deals`,
      sparkData: stats.sparklines?.engaged,
      accent: '#059669',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth?.toLocaleString() || '0',
      trend: stats.totalContactsTrend,
      trendLabel: 'vs last month',
      sparkData: stats.sparklines?.new,
      accent: '#7C3AED',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
