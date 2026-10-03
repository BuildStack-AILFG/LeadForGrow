import Link from 'next/link';
import { ArrowRight, ShieldCheck, ScrollText, KeyRound, LockKeyhole, Building, UserCog, FileSignature, Headset } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow Enterprise',
  description: 'Role-based access, an audit log, unlimited seats and a dedicated account manager for larger sales and support teams.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/enterprise' },
};

const CONTROLS = [
  { icon: UserCog, title: 'Roles & permissions', text: 'Six built-in roles — Owner, Admin, Manager, Sales Agent, Support and Viewer — plus page-level locks in the navigation.' },
  { icon: ScrollText, title: 'Audit log', text: 'Security and admin activity — sign-ins, role changes, settings — recorded with who did it.' },
  { icon: KeyRound, title: 'Encrypted credentials', text: 'WhatsApp, Instagram, Facebook and email credentials are encrypted at rest and never shown back.' },
  { icon: LockKeyhole, title: 'Verified webhooks', text: 'Messages from Meta are only accepted with a valid signature; unsigned requests are refused.' },
  { icon: Building, title: 'Separate workspaces', text: 'Each business’s leads, conversations and settings are isolated from every other tenant.' },
  { icon: ShieldCheck, title: 'Your own AI key', text: 'Run AI replies on your own OpenAI account instead of the shared platform provider.' },
];

const INCLUDED = [
  ['Seats', 'Unlimited team members'],
  ['Leads & automations', 'No plan limits'],
  ['Account management', 'A dedicated account manager'],
  ['Terms', 'Custom terms for security review, compliance or multi-workspace needs'],
  ['Data Processing Agreement', 'Countersigned DPA on request'],
];

export default function EnterprisePage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[#0B1712] pt-12 text-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#1D4B3E] opacity-60 blur-3xl" aria-hidden />
        <div className={`${SITE.wrap} relative py-24 lg:py-32`}>
          <p className={SITE.eyebrowDark}>Enterprise</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.75rem]">
            One revenue system for every team, branch and channel.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            When dozens of people answer customers on WhatsApp, Instagram and email, you need to know who did what — and to keep each team to its
            own leads. Enterprise gives you the controls and the people to roll it out.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className={SITE.btnLight}>Contact sales <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/security" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[15px] font-semibold text-white hover:bg-white/10">Security overview</Link>
          </div>
        </div>
      </section>

      {/* Controls grid with hairlines */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <p className={SITE.eyebrow}>Controls</p>
          <h2 className={`${SITE.h2} mt-3 max-w-2xl`}>Governance your IT and compliance teams will ask about.</h2>
          <div className="mt-12 grid border-l border-t border-[#E4E7E1] sm:grid-cols-2 lg:grid-cols-3">
            {CONTROLS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="border-b border-r border-[#E4E7E1] p-8">
                <Icon className="h-6 w-6 text-[#1D4B3E]" aria-hidden />
                <h3 className={`${SITE.h3} mt-4`}>{title}</h3>
                <p className={`${SITE.small} mt-2`}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included — spec sheet */}
      <section className="bg-[#F5F6F2] py-20">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <h2 className={SITE.h2}>What the Enterprise plan includes.</h2>
            <p className={`${SITE.body} mt-4`}>Pricing is set with you, based on team size and the channels you use.</p>
            <div className="mt-8 flex items-center gap-3 text-[#0B1712]"><Headset className="h-5 w-5 text-[#1D4B3E]" /> <span className="text-[15px]">Support hours: Mon–Fri, 9:00 AM – 6:00 PM IST</span></div>
            <div className="mt-3 flex items-center gap-3 text-[#0B1712]"><FileSignature className="h-5 w-5 text-[#1D4B3E]" /> <Link href="/dpa" className={`${SITE.link} text-[15px]`}>Data Processing Agreement</Link></div>
          </div>
          <dl className="rounded-2xl bg-white">
            {INCLUDED.map(([k, v], i) => (
              <div key={k} className={`grid gap-1 px-6 py-5 sm:grid-cols-[220px_1fr] sm:px-8 ${i ? 'border-t border-[#E4E7E1]' : ''}`}>
                <dt className="text-sm font-semibold uppercase tracking-wider text-[#6B7280]">{k}</dt>
                <dd className="text-[15px] font-medium text-[#0B1712]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-20">
        <div className={`${SITE.narrow} text-center`}>
          <h2 className={SITE.h2}>Plan a rollout with us.</h2>
          <p className={`${SITE.body} mt-4`}>Tell us your team size, channels and any security questionnaire you need answered.</p>
          <Link href="/contact" className={`${SITE.btn} mt-8`}>Contact sales <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </MarketingShell>
  );
}
