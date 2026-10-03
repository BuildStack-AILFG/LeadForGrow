import Link from 'next/link';
import { ArrowRight, Terminal, BookMarked } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { HELP_CATEGORIES, guidesByCategory } from '@/lib/help/guides';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Documentation',
  description: 'Product documentation for LeadForGrow: CRM, inbox, automation, AI, insights, bills and settings — organised by area, with step-by-step guides.',
  alternates: { canonical: 'https://www.leadforgrow.com/documentation' },
};

const INTRO = {
  'get-started': 'Create your workspace, connect your first channel and send your first message.',
  crm: 'Leads, deals, pipelines, contacts, companies and tasks.',
  communication: 'The unified inbox, WhatsApp setup, templates and broadcasts.',
  automation: 'Sequences, automation rules, WhatsApp Flows, journeys, meetings, chatbot and forms.',
  ai: 'Knowledge sources and AI reply settings.',
  insights: 'Reports and analytics.',
  commerce: 'Bills, your bill header and payment links.',
  settings: 'Team, integrations and account settings.',
};

export default function DocumentationPage() {
  const sections = HELP_CATEGORIES.map((c) => ({ ...c, guides: guidesByCategory(c.id) })).filter((c) => c.guides.length);
  return (
    <MarketingShell>
      {/* Thin docs header */}
      <header className="border-b border-[#E4E7E1] bg-[#FAFAF8] pt-20 sm:pt-24">
        <div className={`${SITE.wrap} flex flex-col gap-4 py-10 sm:flex-row sm:items-end sm:justify-between`}>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-[#6B7280]"><BookMarked className="h-4 w-4" /> Docs</p>
            <h1 className="mt-2 font-[family-name:var(--font-plus-jakarta)] text-3xl font-bold tracking-[-0.02em] text-[#0B1712] sm:text-4xl">LeadForGrow documentation</h1>
            <p className={`${SITE.body} mt-2`}>Everything the product does, organised the way the app’s menu is.</p>
          </div>
          <Link href="/api-docs" className="inline-flex items-center gap-2 self-start rounded-lg border border-[#E4E7E1] bg-white px-4 py-2 text-sm font-medium text-[#0B1712] hover:border-[#1D4B3E]/40 sm:self-auto">
            <Terminal className="h-4 w-4 text-[#1D4B3E]" /> Developer reference
          </Link>
        </div>
      </header>

      <div className={`${SITE.wrap} grid gap-10 py-12 lg:grid-cols-[220px_1fr]`}>
        {/* Sidebar index */}
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">On this page</p>
          <ul className="flex flex-wrap gap-2 lg:block lg:space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-md px-3 py-1.5 text-sm text-[#374151] hover:bg-[#F0F9F5] hover:text-[#1D4B3E]">
                  {s.label} <span className="text-[#9CA3AF]">· {s.guides.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <div className="border-b border-[#E4E7E1] pb-3">
                <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold text-[#0B1712]">{s.label}</h2>
                {INTRO[s.id] && <p className={`${SITE.small} mt-1`}>{INTRO[s.id]}</p>}
              </div>
              <ul className="mt-2 divide-y divide-[#F1F2EF]">
                {s.guides.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/help/${g.slug}`} className="group grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                      <span>
                        <span className="font-medium text-[#0B1712] group-hover:text-[#1D4B3E]">{g.title}</span>
                        <span className="mt-0.5 block text-sm text-[#6B7280]">{g.summary}</span>
                      </span>
                      <span className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                        {g.steps?.length ? `${g.steps.length} steps` : null}{g.time ? ` · ${g.time}` : null}
                        <ArrowRight className="h-4 w-4 text-[#1D4B3E] opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
