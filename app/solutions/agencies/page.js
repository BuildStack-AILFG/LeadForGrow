import Link from 'next/link';
import { ArrowRight, LayoutGrid, FileText, Receipt, BarChart3, UsersRound, Gauge, ChevronDown } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow for Agencies',
  description: 'Run lead capture, WhatsApp follow-up and reporting for every client from one agency portal — with separate client workspaces and per-client reports.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/agencies' },
};

const PORTAL = [
  { icon: LayoutGrid, name: 'Clients', text: 'Every client in one list, each with its own leads, pipeline and inbox.' },
  { icon: FileText, name: 'Forms', text: 'Build lead forms per client and see which campaign each submission came from.' },
  { icon: BarChart3, name: 'Reports', text: 'Leads, response times and conversions per client — the numbers for your monthly review.' },
  { icon: Receipt, name: 'Invoices', text: 'Bill clients for your retainer from the same place you run their leads.' },
  { icon: UsersRound, name: 'Team', text: 'Decide which of your people work on which client.' },
  { icon: Gauge, name: 'Usage', text: 'See how much of each plan’s limits every client is using.' },
];

const CLIENTS = [
  { name: 'Sunrise Dental', leads: 42, color: '#1D4B3E' },
  { name: 'Metro Realty', leads: 118, color: '#B45309' },
  { name: 'FitHub Gym', leads: 27, color: '#1D4ED8' },
];

export default function AgenciesPage() {
  return (
    <MarketingShell>
      {/* Split hero with a workspace-switcher drawing */}
      <section className="bg-[#0B1712] pt-16 text-white sm:pt-20">
        <div className={`${SITE.wrap} grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-24`}>
          <div>
            <p className={SITE.eyebrowDark}>For marketing agencies</p>
            <h1 className="mt-4 font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              You bring the leads. Prove what happened to them.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Clients judge your ads by the sales they see. LeadForGrow makes sure every lead you generate is answered, followed up and
              reported — for every client, from one portal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className={SITE.btnLight}>Talk to us about agency plans <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-3 text-[#0B1712] shadow-2xl" aria-label="Client workspace switcher illustration">
            <div className="flex items-center justify-between rounded-xl border border-[#E4E7E1] px-4 py-3">
              <span className="text-sm font-semibold">Your Agency</span><ChevronDown className="h-4 w-4 text-[#6B7280]" />
            </div>
            <p className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Client workspaces</p>
            {CLIENTS.map((c, i) => (
              <div key={c.name} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${i === 0 ? 'bg-[#F0F9F5]' : ''}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: c.color }}>{c.name[0]}</span>
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                <span className="text-xs text-[#6B7280]">{c.leads} leads</span>
              </div>
            ))}
            <p className="px-4 pb-1 pt-3 text-center text-[11px] text-[#9CA3AF]">Illustration — example client names</p>
          </div>
        </div>
      </section>

      {/* Portal map — six tiles */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className={SITE.eyebrow}>The agency portal</p>
              <h2 className={`${SITE.h2} mt-3`}>Everything you manage for clients, in one menu.</h2>
            </div>
          </div>
          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {PORTAL.map(({ icon: Icon, name, text }) => (
              <div key={name} className="flex gap-4">
                <Icon className="h-6 w-6 shrink-0 text-[#1D4B3E]" aria-hidden />
                <div><h3 className={SITE.h3}>{name}</h3><p className={`${SITE.body} mt-1.5`}>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The client conversation */}
      <section className="bg-[#F5F6F2] py-20">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-2`}>
          <div>
            <h2 className={SITE.h2}>Change the monthly review.</h2>
            <p className={`${SITE.body} mt-4`}>Without a shared system the conversation is always the same. With one, it can be about what to do next.</p>
          </div>
          <div className="space-y-4">
            <blockquote className="rounded-xl bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Before</p>
              <p className="mt-2 text-[15px] text-[#0B1712]">“The leads you sent were bad.” — and no way to check whether anyone called them.</p>
            </blockquote>
            <blockquote className="rounded-xl bg-white p-6 ring-2 ring-[#1D4B3E]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1D4B3E]">After</p>
              <p className="mt-2 text-[15px] text-[#0B1712]">You can show how many leads came in, how fast they were answered, which ones are still waiting and which became customers.</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className={`${SITE.narrow} text-center`}>
          <h2 className={SITE.h2}>Running more than a few clients?</h2>
          <p className={`${SITE.body} mt-4`}>Agency and multi-workspace needs are set up on our Enterprise plan with custom terms. Tell us how many clients you manage.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className={SITE.btn}>Contact sales</Link>
            <Link href="/partners" className={SITE.btnGhost}>Partner programme</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
