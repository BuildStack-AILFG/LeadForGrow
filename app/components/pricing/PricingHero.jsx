import { MARKETING } from '@/lib/marketing/designTokens';

/**
 * Centered title block — deliberately mirrors Interakt's own pricing hero
 * shape (small eyebrow pill, big centered two-line headline with one phrase
 * underlined, short subhead) rather than our old split hero-with-mockup.
 */
export default function PricingHero() {
  return (
    <section className="pt-28 sm:pt-32 pb-10 bg-white">
      <div className={`${MARKETING.containerNarrow} text-center`}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
          Pricing
        </span>
        <h1 className="mt-4 font-[family-name:var(--font-plus-jakarta)] text-[2rem] sm:text-[2.75rem] font-bold tracking-[-0.02em] text-[#111827] leading-[1.15]">
          The Best <span className="relative inline-block">
            WhatsApp &amp; Instagram
            <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-emerald-500 rounded-full" />
          </span>{' '}
          Automation Platform with Affordable Plans
        </h1>
        <p className="mt-5 text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
          Every plan includes Email — even your free trial. Add WhatsApp and Instagram as you grow, and let LeadForGrow chase the follow-ups your team doesn&apos;t have time for.
        </p>
      </div>
    </section>
  );
}
