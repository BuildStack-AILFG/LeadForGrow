import Link from 'next/link';
import { ArrowRight, Check, KanbanSquare, Users, Building2, ListChecks, Radar, FileSpreadsheet, Palette, Filter } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'CRM & Sales Pipeline',
  description: 'A WhatsApp-first CRM: every enquiry becomes a lead, every lead has an owner, and every stage change does its follow-up work for you.',
  alternates: { canonical: 'https://www.leadforgrow.com/products/crm' },
};

/** What the pipeline does on its own when a lead moves stage (lib/crm/pipelineAutomation.js). */
const STAGES = [
  { name: 'New', does: 'Lead lands from WhatsApp, a form, an ad or your inbox — with source and owner.' },
  { name: 'Contacted', does: 'A follow-up task is created for the owner, so the next touch is never forgotten.' },
  { name: 'Demo scheduled', does: 'The meeting invite can go out on WhatsApp and email automatically.' },
  { name: 'Quotation sent', does: 'The quote message is sent and a reminder is queued.' },
  { name: 'Payment pending', does: 'A payment reminder goes out — with a Razorpay link from Bills.' },
  { name: 'Won', does: 'A thank-you message, if you switch it on. Lost leads ask for a reason.' },
];

const OBJECTS = [
  { icon: Users, title: 'Leads', text: 'Table or board view, saved views, smart filters, row colours, bulk upload from Excel or CSV and a full activity timeline per lead.' },
  { icon: KanbanSquare, title: 'Deals', text: 'Multiple pipelines with your own stages, deal values and a drag-and-drop board. Import deals from CSV.' },
  { icon: Building2, title: 'Contacts & companies', text: 'Keep people and the businesses they work for linked, so a new enquiry from a known company is recognised.' },
  { icon: ListChecks, title: 'Tasks & reminders', text: 'Calls, follow-ups and emails assigned to a person with a due time. Reminders pop up while you work.' },
];

const TABLE = [
  ['Who owns this lead?', 'Every lead has an assignee; unassigned enquiries sit in their own queue.'],
  ['When did we last reply?', 'First-response and waiting time are tracked per conversation.'],
  ['What happens next?', 'Next follow-up date and open tasks are shown on the lead page.'],
  ['Where did it come from?', 'Source is recorded: WhatsApp, Instagram, Facebook, email, forms, Meta Lead Ads, webhooks, manual.'],
  ['Why did we lose it?', 'Moving a lead to Lost asks for a reason, so you can report on it later.'],
];

export default function CrmProductPage() {
  return (
    <MarketingShell>
      {/* Hero: copy left, real product screenshot right */}
      <section className="bg-[#F5F6F2] pt-16 sm:pt-20">
        <div className={`${SITE.wrap} grid items-center gap-12 py-16 lg:grid-cols-[1fr_1.1fr] lg:py-24`}>
          <div>
            <p className={SITE.eyebrow}>CRM &amp; Pipeline</p>
            <h1 className={`${SITE.display} mt-4`}>The CRM that does the follow-up for you.</h1>
            <p className={`${SITE.lead} mt-6 max-w-xl`}>
              Every WhatsApp message, Instagram DM, form fill and ad enquiry becomes a lead with an owner and a next step.
              Move it a stage forward and LeadForGrow creates the task, sends the message and sets the reminder.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className={SITE.btnGhost}>See pricing</Link>
            </div>
            <p className={`${SITE.small} mt-5`}>14-day free trial · no card needed to start</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#0B1712]/10 bg-white shadow-[0_30px_80px_-30px_rgba(11,23,18,0.35)]">
            <div className="flex items-center gap-1.5 border-b border-[#E4E7E1] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E4E7E1]" /><span className="h-2.5 w-2.5 rounded-full bg-[#E4E7E1]" /><span className="h-2.5 w-2.5 rounded-full bg-[#E4E7E1]" />
              <span className="ml-3 text-xs text-[#6B7280]">leadforgrow.com/automation/leads</span>
            </div>
            <img src="/images/hero/crm.webp" alt="LeadForGrow leads table with status, owner and source columns" className="block w-full" />
          </div>
        </div>
      </section>

      {/* Pipeline anatomy */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <div className="max-w-2xl">
            <p className={SITE.eyebrow}>The pipeline, stage by stage</p>
            <h2 className={`${SITE.h2} mt-3`}>Each stage comes with its own follow-up.</h2>
            <p className={`${SITE.body} mt-4`}>
              Stage automations are built in. Customer messages are off by default for new workspaces — you choose which ones to switch on in Settings.
            </p>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#E4E7E1] bg-[#E4E7E1] sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s, i) => (
              <li key={s.name} className="bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D4B3E] text-sm font-bold text-white">{i + 1}</span>
                  <h3 className={SITE.h3}>{s.name}</h3>
                </div>
                <p className={`${SITE.body} mt-3`}>{s.does}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Objects */}
      <section className="bg-[#0B1712] py-20 text-white">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <p className={SITE.eyebrowDark}>What&apos;s inside</p>
            <h2 className="mt-3 font-[family-name:var(--font-plus-jakarta)] text-[1.75rem] font-bold leading-tight tracking-[-0.02em] sm:text-[2.25rem]">
              Leads, deals, people and tasks — connected.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Open any lead and you see the conversation on every channel, the deal, the tasks and the timeline on one page.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {OBJECTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-[#34D399]" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questions answered table */}
      <section className="py-20">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-2`}>
          <div>
            <p className={SITE.eyebrow}>Answers at a glance</p>
            <h2 className={`${SITE.h2} mt-3`}>The five questions every sales manager asks.</h2>
            <ul className="mt-8 flex flex-wrap gap-2">
              {[
                [Filter, 'Smart views'], [Palette, 'Row colours'], [FileSpreadsheet, 'Excel / CSV import'], [Radar, 'Leak Radar'],
              ].map(([Icon, label]) => (
                <li key={label} className="inline-flex items-center gap-2 rounded-full border border-[#E4E7E1] px-4 py-2 text-sm text-[#0B1712]">
                  <Icon className="h-4 w-4 text-[#1D4B3E]" aria-hidden /> {label}
                </li>
              ))}
            </ul>
          </div>
          <dl className="divide-y divide-[#E4E7E1] border-y border-[#E4E7E1]">
            {TABLE.map(([q, a]) => (
              <div key={q} className="grid gap-2 py-5 sm:grid-cols-[200px_1fr]">
                <dt className="font-semibold text-[#0B1712]">{q}</dt>
                <dd className={SITE.body}>{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Leak Radar callout */}
      <section className="pb-20">
        <div className={SITE.wrap}>
          <div className="grid items-center gap-8 rounded-2xl bg-[#E8F3EE] p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className={SITE.eyebrow}>Leak Radar</p>
              <h2 className={`${SITE.h2} mt-3`}>See which enquiries are slipping — before they go cold.</h2>
              <p className={`${SITE.body} mt-4`}>
                Leak Radar lists customers waiting for a reply, leads with no follow-up and overdue tasks, one card per lead, with a
                one-tap fix: reply, send a template, create a task or reassign. Nothing is sent automatically.
              </p>
            </div>
            <ul className="space-y-3">
              {['Off until an owner turns it on', 'Salespeople see their own leaks', 'Daily five-line brief by email'].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-[#0B1712]"><Check className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4B3E]" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E4E7E1] py-16">
        <div className={`${SITE.wrap} flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center`}>
          <h2 className={SITE.h2}>Bring your leads over in minutes.</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={SITE.btn}>Start free trial</Link>
            <Link href="/help/leads" className={SITE.btnGhost}>Read the Leads guide</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
