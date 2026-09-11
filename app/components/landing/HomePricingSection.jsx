import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PricingTable from '@/app/components/pricing/PricingTable';

/**
 * Homepage pricing section — reuses the real PricingTable from /pricing
 * (same live data, same Interakt-fidelity grid/column design) instead of
 * the old SimplePricingSection's own hardcoded 3-card duplicate, which had
 * drifted out of sync with the actual plans (missing Scale, stale numbers).
 * One source of truth: app/components/pricing/pricingData.js.
 */
export default function HomePricingSection() {
  return (
    <section id="pricing" className="relative bg-white pt-14 sm:pt-16 lg:pt-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Pricing</p>
        <h2
          className="mt-3 text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#111827] sm:text-[2.15rem]"
          style={{ fontFamily: 'var(--font-plus-jakarta)' }}
        >
          Simple, Transparent Pricing
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#64748B]">
          Every plan includes Email — even your free trial. Compare exactly what you get at every tier.
        </p>
      </div>

      <PricingTable />

      <div className="-mt-12 sm:-mt-16 pb-14 sm:pb-16 lg:pb-20 text-center relative">
        <Link
          href="/pricing"
          className="group inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
        >
          View Full Pricing &amp; FAQ
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
