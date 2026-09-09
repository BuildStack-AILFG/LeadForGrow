import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuide, HELP_GUIDES, HELP_CATEGORIES } from '@/lib/help/guides';
import {
  ChevronRight, Clock, CheckCircle2, Lightbulb, AlertCircle,
  Rocket, MessageCircle, Workflow, IndianRupee, SlidersHorizontal, Sparkles,
  Users2, BarChart3, ArrowRight,
} from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, GmailIcon } from '@/app/automation/components/chat/BrandIcons';
import { StepIcon, StepVisual } from '../StepVisuals';
import TrackGuideView from '../TrackGuideView';
import GuideToc from './GuideToc';

/**
 * Guide detail page — a documentation-style article (Stripe/Mintlify shape):
 * white canvas, a narrow reading column, and a sticky right rail "On this
 * page" navigator that scroll-spies + smooth-scrolls. Every section below
 * carries an `id` that GuideToc's IntersectionObserver watches — keep the
 * two in sync if you add/remove a section.
 */

const CATEGORY_META = {
  'get-started':   { Icon: Rocket,             tone: 'blue' },
  'crm':           { Icon: Users2,             tone: 'indigo' },
  'communication': { Icon: MessageCircle,      tone: 'emerald' },
  'automation':    { Icon: Workflow,           tone: 'amber' },
  'ai':            { Icon: Sparkles,           tone: 'purple' },
  'insights':      { Icon: BarChart3,          tone: 'cyan' },
  'commerce':      { Icon: IndianRupee,        tone: 'violet' },
  'settings':      { Icon: SlidersHorizontal,  tone: 'slate' },
};
const TONE_TEXT = {
  blue: 'text-blue-600', indigo: 'text-indigo-600', emerald: 'text-emerald-600',
  amber: 'text-amber-600', violet: 'text-violet-600', purple: 'text-purple-600',
  cyan: 'text-cyan-600', slate: 'text-slate-600',
};
const TONE_BG_SOFT = {
  blue: 'bg-blue-50', indigo: 'bg-indigo-50', emerald: 'bg-emerald-50',
  amber: 'bg-amber-50', violet: 'bg-violet-50', purple: 'bg-purple-50',
  cyan: 'bg-cyan-50', slate: 'bg-slate-100',
};

export function generateStaticParams() {
  return HELP_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: 'Not found · LeadForGrow' };
  return { title: `${guide.title} · LeadForGrow Help`, description: guide.summary };
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const category = HELP_CATEGORIES.find((c) => c.id === guide.category);
  const meta = CATEGORY_META[guide.category] || CATEGORY_META['settings'];
  const Icon = meta.Icon;

  // Build the "On this page" nav from whatever sections this guide actually has.
  const tocItems = [
    { id: 'overview', label: 'Overview' },
    ...(guide.prereqs?.length > 0 ? [{ id: 'prerequisites', label: 'Before you start' }] : []),
    ...guide.steps.map((step, i) => ({ id: `step-${i + 1}`, label: step.title, indent: true })),
    ...(guide.tips?.length > 0 ? [{ id: 'tips', label: 'Tips' }] : []),
    ...(guide.commonIssues?.length > 0 ? [{ id: 'common-issues', label: 'Common issues' }] : []),
    ...(guide.related?.length > 0 ? [{ id: 'related', label: 'Related guides' }] : []),
  ];

  return (
    <div className="min-h-screen bg-white">
      <TrackGuideView slug={guide.slug} />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900">
            <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px]">L</span>
            LeadForGrow
          </Link>
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-[13px] text-slate-500">
            <Link href="/help" className="hover:text-slate-900">Help Center</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800">{category?.label}</span>
          </nav>
          <Link href="/help" className="sm:hidden inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-900">
            All guides
          </Link>
        </div>
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 border-b border-slate-200">
        <div className="max-w-[720px]">
          <div className="flex items-center gap-2 mb-4">
            <GuideBrandChip brandIcon={guide.brandIcon} meta={meta} Icon={Icon} />
            <span className="text-[12.5px] font-medium text-slate-500">{category?.label}</span>
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-[1.15] text-slate-900">
            {guide.title}
          </h1>
          <p className="text-slate-500 mt-3 text-[15px] sm:text-base leading-relaxed">{guide.summary}</p>
          <div className="flex items-center gap-1.5 mt-4 text-[13px] text-slate-400">
            <Clock className="w-3.5 h-3.5" /> {guide.time} read
          </div>
        </div>
      </header>

      {/* ── Body: reading column + sticky right rail ────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
        <article className="max-w-[720px] min-w-0">
          {/* Overview */}
          <section id="overview" className="scroll-mt-20 mb-10">
            <p className="text-[15px] text-slate-600 leading-relaxed">{guide.summary}</p>
          </section>

          {/* Prerequisites */}
          {guide.prereqs?.length > 0 && (
            <section id="prerequisites" className="scroll-mt-20 mb-10">
              <SectionHeading>Before you start</SectionHeading>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <ul className="space-y-2">
                  {guide.prereqs.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Steps */}
          <section className="mb-10">
            <SectionHeading>Steps</SectionHeading>
            <ol className="relative">
              <div aria-hidden className="absolute left-[17px] top-4 bottom-4 w-px bg-slate-200" />
              {guide.steps.map((step, i) => (
                <li key={i} id={`step-${i + 1}`} className="scroll-mt-20 relative flex gap-4 pb-8 last:pb-0">
                  <div className="relative z-10 bg-white p-0.5 rounded-2xl">
                    <StepIcon icon={step.icon} tone={step.tone || 'blue'} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <span className="text-[11px] font-mono font-medium text-slate-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="font-medium text-slate-900 text-[15px] mt-0.5">{step.title}</p>
                    {step.body && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{step.body}</p>}
                    {step.code && (
                      <pre className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
                        {step.code}
                      </pre>
                    )}
                    {step.visual && <StepVisual kind={step.visual.kind} data={step.visual.data || step.visual} />}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Tips */}
          {guide.tips?.length > 0 && (
            <section id="tips" className="scroll-mt-20 mb-10">
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-5">
                <h2 className="text-[13px] font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Tips
                </h2>
                <ul className="space-y-2.5">
                  {guide.tips.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-amber-900 leading-relaxed">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Common issues */}
          {guide.commonIssues?.length > 0 && (
            <section id="common-issues" className="scroll-mt-20 mb-10">
              <SectionHeading>Common issues</SectionHeading>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {guide.commonIssues.map((ci, i) => (
                    <li key={i} className="p-4 flex gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{ci.problem}</p>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{ci.fix}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Related */}
          {guide.related?.length > 0 && (
            <section id="related" className="scroll-mt-20 mb-10">
              <SectionHeading>Related guides</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guide.related.map((rslug) => {
                  const g = HELP_GUIDES.find((x) => x.slug === rslug);
                  if (!g) return null;
                  return (
                    <Link
                      key={rslug}
                      href={`/help/${rslug}`}
                      className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-medium text-slate-900 text-sm truncate">{g.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{g.summary}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 shrink-0 transition" />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom nav */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
            <Link href="/help" className="text-sm text-slate-500 hover:text-slate-900">
              ← All guides
            </Link>
            <a
              href="https://wa.me/916366966120"
              target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Still stuck? WhatsApp us
            </a>
          </div>
        </article>

        {/* ── Sticky right rail ────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <GuideToc items={tocItems} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
      {children}
    </h2>
  );
}

/**
 * Guide chip in the header. Prefers the guide's own `brandIcon` (real
 * WhatsApp / Instagram / Gmail mark or a small cluster) over the category's
 * generic Lucide icon so the reader instantly sees "this guide is about
 * that specific product".
 */
function GuideBrandChip({ brandIcon, meta, Icon }) {
  if (brandIcon === 'whatsapp') {
    return (
      <div className="w-7 h-7 rounded-md bg-[#25D366] flex items-center justify-center">
        <WhatsAppIcon size={15} className="text-white" />
      </div>
    );
  }
  if (brandIcon === 'instagram') {
    return (
      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center">
        <InstagramIcon size={15} className="text-white" />
      </div>
    );
  }
  if (brandIcon === 'gmail') {
    return (
      <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center">
        <GmailIcon size={15} />
      </div>
    );
  }
  if (brandIcon === 'cluster') {
    const dot = 'w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center';
    return (
      <div className="flex items-center -space-x-2">
        <div className={`${dot} bg-[#25D366]`}><WhatsAppIcon size={12} className="text-white" /></div>
        <div className={`${dot} bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]`}><InstagramIcon size={12} className="text-white" /></div>
        <div className={`${dot} bg-white`}><GmailIcon size={12} /></div>
      </div>
    );
  }
  return (
    <div className={`w-7 h-7 rounded-md ${TONE_BG_SOFT[meta.tone]} flex items-center justify-center`}>
      <Icon className={`w-3.5 h-3.5 ${TONE_TEXT[meta.tone]}`} />
    </div>
  );
}
