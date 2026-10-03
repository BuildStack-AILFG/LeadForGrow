import Link from 'next/link';
import { ArrowRight, Zap, GitBranch, Workflow, Megaphone, ShieldCheck, Clock3, Hand, Gauge } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Automation — workflows, flows and broadcasts',
  description: 'Build follow-up workflows on a visual canvas, run WhatsApp conversation flows and send broadcasts — with opt-out, 24-hour window and send limits handled for you.',
  alternates: { canonical: 'https://www.leadforgrow.com/products/automation' },
};

const ENGINES = [
  { icon: Zap, name: 'Automation rules', what: 'Ready-made rules for the everyday: welcome a new lead, follow up when nobody replies, alert the team.', when: 'You want results today, no building.' },
  { icon: GitBranch, name: 'Sequences', what: 'A visual canvas: drag steps in, connect them, branch with If / Else, wait, send email or WhatsApp, create tasks.', when: 'Your follow-up has more than one step.' },
  { icon: Workflow, name: 'WhatsApp Flows', what: 'Conversation flows with buttons and lists — a booking flow, a menu, a qualification chat — on WhatsApp, Instagram or Messenger.', when: 'The customer should answer questions in chat.' },
  { icon: Megaphone, name: 'Broadcasts', what: 'Approved WhatsApp templates or designed emails to a segment, a tag or an uploaded list, with per-recipient delivery status.', when: 'One message to many people.' },
];

const TRIGGERS = [
  'Lead created', 'Form submitted', 'WhatsApp message received', 'Instagram DM', 'Instagram comment', 'Facebook comment',
  'Messenger message', 'Email received', 'Meta lead ad', 'Stage changed', 'Tag added', 'No reply', 'Missed call', 'Payment received',
  'Deal won', 'Meeting booked', 'Meeting completed', 'Meeting no-show', 'Webhook received', 'Recurring schedule',
];

const SAFETY = [
  { icon: Hand, title: 'STOP means stop', text: 'A customer who replies STOP is never messaged by an automation again. START opts them back in.' },
  { icon: Clock3, title: 'The 24-hour window', text: 'Outside WhatsApp’s reply window only approved templates are sent, so messages are not rejected.' },
  { icon: Gauge, title: 'Warm-up limits', text: 'Comment-to-DM automations start slow and raise their hourly limits as the account ages, and pause if Meta blocks sending.' },
  { icon: ShieldCheck, title: 'Test before you go live', text: 'Run a flow in test mode, set a start node, and check each step before real customers see it.' },
];

function Node({ children, tone = 'default', className = '' }) {
  const tones = {
    default: 'border-white/15 bg-white/[0.06] text-white',
    trigger: 'border-[#34D399]/50 bg-[#34D399]/10 text-white',
    yes: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
    no: 'border-rose-300/40 bg-rose-300/10 text-rose-100',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${tones[tone]} ${className}`}>{children}</div>;
}

export default function AutomationProductPage() {
  return (
    <MarketingShell>
      {/* Dark canvas hero with a workflow drawing */}
      <section className="relative overflow-hidden bg-[#0B1712] pt-16 text-white sm:pt-20">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
        <div className={`${SITE.wrap} relative grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28`}>
          <div>
            <p className={SITE.eyebrowDark}>Automation</p>
            <h1 className="mt-4 font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              Follow-up that runs while you sleep.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Decide once what should happen when someone enquires, comments, books or goes quiet. LeadForGrow does it on WhatsApp, Instagram,
              Messenger and email — every time, for every lead.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={SITE.btnLight}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/help/sequences" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[15px] font-semibold text-white hover:bg-white/10">
                How sequences work
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md" aria-label="Example workflow: lead created, send welcome, wait one day, check for a reply, then branch">
            <div className="flex flex-col items-center gap-3">
              <Node tone="trigger" className="w-64 text-center">⚡ Lead created — from Meta ad</Node>
              <span className="h-6 w-px bg-white/30" />
              <Node className="w-64 text-center">Send WhatsApp template “welcome”</Node>
              <span className="h-6 w-px bg-white/30" />
              <Node className="w-64 text-center">Wait 1 day</Node>
              <span className="h-6 w-px bg-white/30" />
              <Node className="w-64 text-center">If / Else — customer replied?</Node>
              <div className="grid w-full grid-cols-2 gap-4 pt-3">
                <div className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">Yes</span>
                  <Node tone="yes" className="w-full text-center">Assign to sales</Node>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-rose-400/20 px-2 py-0.5 text-xs text-rose-100">No</span>
                  <Node tone="no" className="w-full text-center">Create call task</Node>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four engines — comparison layout */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <div className="max-w-2xl">
            <p className={SITE.eyebrow}>Four ways to automate</p>
            <h2 className={`${SITE.h2} mt-3`}>Pick the tool that fits the job.</h2>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-[#E4E7E1]">
            {ENGINES.map(({ icon: Icon, name, what, when }, i) => (
              <div key={name} className={`grid gap-4 p-6 sm:p-8 md:grid-cols-[220px_1fr_260px] ${i ? 'border-t border-[#E4E7E1]' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F3EE]"><Icon className="h-5 w-5 text-[#1D4B3E]" aria-hidden /></span>
                  <h3 className={SITE.h3}>{name}</h3>
                </div>
                <p className={SITE.body}>{what}</p>
                <p className="text-sm text-[#0B1712]"><span className="font-semibold">Use it when: </span>{when}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Triggers cloud */}
      <section className="bg-[#F5F6F2] py-20">
        <div className={`${SITE.wrap} grid gap-10 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <p className={SITE.eyebrow}>Triggers</p>
            <h2 className={`${SITE.h2} mt-3`}>Start a workflow from anything that happens.</h2>
            <p className={`${SITE.body} mt-4`}>A sequence can start from any of these. Webhook triggers let your website or another app start a workflow too.</p>
          </div>
          <ul className="flex flex-wrap content-start gap-2.5">
            {TRIGGERS.map((t) => (
              <li key={t} className="rounded-full border border-[#0B1712]/10 bg-white px-4 py-2 text-sm font-medium text-[#0B1712]">{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Safety */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <div className="max-w-2xl">
            <p className={SITE.eyebrow}>Guardrails, built in</p>
            <h2 className={`${SITE.h2} mt-3`}>Automation that protects your number.</h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="border-t-2 border-[#1D4B3E] pt-5">
                <Icon className="h-5 w-5 text-[#1D4B3E]" aria-hidden />
                <h3 className="mt-3 font-semibold text-[#0B1712]">{title}</h3>
                <p className={`${SITE.small} mt-2`}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className={SITE.wrap}>
          <div className="flex flex-col items-start gap-6 rounded-2xl bg-[#1D4B3E] p-8 text-white sm:p-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold sm:text-3xl">Start from a template, not a blank canvas.</h2>
              <p className="mt-2 text-white/75">Welcome, no-reply follow-up and team alerts are one click away.</p>
            </div>
            <Link href="/register" className={SITE.btnLight}>Try it free <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
