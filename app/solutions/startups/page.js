import Link from 'next/link';
import { ArrowRight, Check, X } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { PRICING_PLANS } from '@/app/components/pricing/pricingData';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow for Startups',
  description: 'Capture every enquiry, reply fast on WhatsApp and automate follow-up before you hire a sales team — on one affordable plan.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/startups' },
};

const WEEKS = [
  { when: 'Day 1', title: 'Plug in your channels', points: ['Connect WhatsApp and your email inbox', 'Embed a LeadForGrow form on your landing page', 'Import the leads you already have from a spreadsheet'] },
  { when: 'Week 1', title: 'Reply faster than anyone', points: ['Every enquiry lands in one inbox with an owner', 'Turn on the welcome message for new leads', 'Use saved templates for the questions you get daily'] },
  { when: 'Week 2', title: 'Put follow-up on autopilot', points: ['Start a “no reply in 24 hours” sequence', 'Book demos through your own booking page', 'Reminders go out before every meeting'] },
  { when: 'Month 1', title: 'Know your numbers', points: ['See which source brings paying customers', 'Spot leads slipping with Leak Radar', 'Send bills with a payment link when a deal closes'] },
];

const INSTEAD = [
  ['A WhatsApp phone passed around the team', 'One shared inbox with assignment'],
  ['A spreadsheet of leads nobody updates', 'A pipeline that updates itself as you chat'],
  ['Separate tools for forms, booking, email and invoices', 'One workspace, one login, one bill'],
];

export default function StartupsPage() {
  const starter = PRICING_PLANS.find((p) => p.id === 'starter') || PRICING_PLANS[0];
  return (
    <MarketingShell>
      {/* Editorial hero — left-aligned, large type, no image */}
      <section className="pt-32 lg:pt-40">
        <div className={SITE.wrap}>
          <p className={SITE.eyebrow}>For startups &amp; founders</p>
          <h1 className={`${SITE.display} mt-4 max-w-4xl`}>Your first sales system, before your first sales hire.</h1>
          <div className="mt-8 grid gap-8 border-t border-[#E4E7E1] pt-8 lg:grid-cols-[1.3fr_1fr]">
            <p className={SITE.lead}>
              Early on, every lead matters and nobody has time to chase them. LeadForGrow catches each enquiry, answers it quickly on WhatsApp
              and email, and reminds you to follow up — so a two-person team sells like a bigger one.
            </p>
            <div className="flex flex-wrap items-start gap-3 lg:justify-end">
              <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className={SITE.btnGhost}>See plans</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 30-day roadmap timeline */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <h2 className={SITE.h2}>Your first 30 days.</h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
            <span className="absolute left-0 right-0 top-[11px] hidden h-px bg-[#E4E7E1] md:block" aria-hidden />
            {WEEKS.map((w) => (
              <li key={w.when} className="relative">
                <span className="relative z-10 block h-[22px] w-[22px] rounded-full border-4 border-white bg-[#1D4B3E] ring-1 ring-[#1D4B3E]" />
                <p className="mt-5 text-sm font-semibold text-[#1D4B3E]">{w.when}</p>
                <h3 className={`${SITE.h3} mt-1`}>{w.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {w.points.map((p) => <li key={p} className="flex gap-2 text-sm text-[#4B5563]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4B3E]" />{p}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Instead of / with */}
      <section className="bg-[#F5F6F2] py-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.h2} max-w-2xl`}>Replace the duct tape.</h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-[#E4E7E1] bg-white">
            <div className="grid grid-cols-2 border-b border-[#E4E7E1] bg-[#FAFAF8] text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              <p className="px-5 py-3 sm:px-8">Instead of</p><p className="border-l border-[#E4E7E1] px-5 py-3 sm:px-8">With LeadForGrow</p>
            </div>
            {INSTEAD.map(([a, b]) => (
              <div key={a} className="grid grid-cols-2 border-b border-[#E4E7E1] last:border-0">
                <p className="flex gap-3 px-5 py-5 text-[15px] text-[#6B7280] sm:px-8"><X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />{a}</p>
                <p className="flex gap-3 border-l border-[#E4E7E1] px-5 py-5 text-[15px] font-medium text-[#0B1712] sm:px-8"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4B3E]" />{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price card */}
      <section className="py-20">
        <div className={`${SITE.wrap} grid items-center gap-10 lg:grid-cols-2`}>
          <div>
            <p className={SITE.eyebrow}>Priced for early teams</p>
            <h2 className={`${SITE.h2} mt-3`}>Start small. Upgrade when you grow.</h2>
            <p className={`${SITE.body} mt-4`}>Every plan starts with a 14-day free trial. No credit card is needed to sign up, and you can cancel any time from billing settings.</p>
          </div>
          <div className="rounded-2xl border-2 border-[#1D4B3E] p-8">
            <p className="text-sm font-semibold text-[#1D4B3E]">{starter.name}</p>
            <p className="mt-2 font-[family-name:var(--font-plus-jakarta)] text-4xl font-bold text-[#0B1712]">
              ₹{starter.yearlyPrice?.toLocaleString('en-IN')}<span className="text-base font-medium text-[#6B7280]"> /month, billed yearly</span>
            </p>
            <p className={`${SITE.small} mt-1`}>₹{starter.monthlyPrice?.toLocaleString('en-IN')} /month billed monthly · {starter.seats}</p>
            <Link href="/pricing" className={`${SITE.btn} mt-6 w-full`}>Compare all plans</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
