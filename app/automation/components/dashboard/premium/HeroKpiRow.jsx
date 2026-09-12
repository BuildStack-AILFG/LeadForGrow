'use client';

import Link from 'next/link';
import PremiumCard from './PremiumCard';
import TrendBadge from './TrendBadge';
import CountUp from './CountUp';

function KpiCard({
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  change,
  delta,
  deltaLabel,
  href,
  invertTrend,
  index = 0,
}) {
  const inner = (
    <PremiumCard
      padding="px-3 py-3"
      interactive={!!href}
      className="lfg-fade-up h-full min-h-[96px] flex flex-col justify-between"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <p className="text-[11px] font-normal text-[#475569] leading-none truncate">{label}</p>

      <div className="mt-2 flex items-center gap-1 min-w-0 flex-wrap">
        <p className="text-[18px] font-medium text-[#1A1D1F] leading-none tracking-[-0.02em] tabular-nums truncate">
          <CountUp
            value={value}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
          />
        </p>
        <TrendBadge change={change} positiveIsGood={!invertTrend} showIcon={false} />
      </div>

      {delta != null && (
        <p className="mt-1.5 text-[10px] font-normal text-[#94A3B8] leading-none truncate">
          <span className={delta >= 0 ? 'text-[#059669]' : 'text-[#E5484D]'}>
            {delta >= 0 ? '+' : ''}{delta}
          </span>
          {' '}{deltaLabel}
        </p>
      )}
    </PremiumCard>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4B3E]/30 rounded-none"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function HeroKpiRow({ heroKpis }) {
  if (!heroKpis) return null;

  const conv = heroKpis.conversionRate?.value ?? 0;

  return (
    <>
      <KpiCard
        index={0}
        label="Leads"
        value={heroKpis.leads?.value ?? 0}
        change={heroKpis.leads?.change}
        delta={heroKpis.leads?.delta}
        deltaLabel={heroKpis.leads?.deltaLabel}
        href="/automation/leads"
      />
      <KpiCard
        index={1}
        label="Conversion Rate"
        value={conv}
        decimals={Number.isInteger(conv) ? 0 : 1}
        suffix="%"
        change={heroKpis.conversionRate?.change}
        delta={heroKpis.conversionRate?.delta}
        deltaLabel={heroKpis.conversionRate?.deltaLabel}
        href="/automation/reports"
      />
      <KpiCard
        index={2}
        label="Avg Sales Cycle"
        value={heroKpis.avgSalesCycle?.value ?? 0}
        suffix={heroKpis.avgSalesCycle?.suffix || 'd'}
        change={heroKpis.avgSalesCycle?.change}
        delta={heroKpis.avgSalesCycle?.delta}
        deltaLabel={heroKpis.avgSalesCycle?.deltaLabel}
        invertTrend
        href="/automation/deals"
      />
      <KpiCard
        index={3}
        label="Active Deals"
        value={heroKpis.activeDeals?.value ?? 0}
        change={heroKpis.activeDeals?.change}
        delta={heroKpis.activeDeals?.delta}
        deltaLabel={heroKpis.activeDeals?.deltaLabel}
        href="/automation/deals"
      />
      <KpiCard
        index={4}
        label="Pipeline"
        value={heroKpis.pipeline?.value ?? 0}
        decimals={heroKpis.pipeline?.decimals ?? 0}
        prefix={heroKpis.pipeline?.prefix || '₹'}
        suffix={heroKpis.pipeline?.suffix || ''}
        change={heroKpis.pipeline?.change}
        delta={heroKpis.pipeline?.delta}
        deltaLabel={heroKpis.pipeline?.deltaLabel}
        href="/automation/deals"
      />
    </>
  );
}
