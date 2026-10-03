import Link from 'next/link';
import { GraduationCap, PlayCircle, Clock } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { getGuide } from '@/lib/help/guides';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Tutorials — the LeadForGrow learning path',
  description: 'A four-module course that takes you from a new account to a fully automated sales process in LeadForGrow.',
  alternates: { canonical: 'https://www.leadforgrow.com/tutorials' },
};

const MODULES = [
  { level: 'Module 1', name: 'Foundations', outcome: 'Your workspace is set up and your first lead is in.', lessons: ['getting-started', 'account-settings', 'team-management', 'leads'] },
  { level: 'Module 2', name: 'Conversations', outcome: 'Every channel answers from one inbox.', lessons: ['connect-whatsapp', 'inbox-basics', 'create-template'] },
  { level: 'Module 3', name: 'Automation', outcome: 'Follow-up happens without anyone remembering to do it.', lessons: ['automation-rules', 'sequences', 'whatsapp-flows', 'meetings'] },
  { level: 'Module 4', name: 'Growth', outcome: 'You run campaigns, get paid on time and measure what works.', lessons: ['send-broadcast', 'create-bill', 'ai-knowledge', 'reports-analytics'] },
];

const minutes = (t) => parseInt(String(t || '').replace(/\D+/g, ''), 10) || 0;

export default function TutorialsPage() {
  const modules = MODULES.map((m) => {
    const lessons = m.lessons.map(getGuide).filter(Boolean);
    return { ...m, lessons, total: lessons.reduce((s, g) => s + minutes(g.time), 0) };
  });
  const lessonCount = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalMinutes = modules.reduce((s, m) => s + m.total, 0);

  return (
    <MarketingShell>
      {/* Course header */}
      <section className="bg-[#0B1712] pt-16 text-white sm:pt-20">
        <div className={`${SITE.wrap} grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:py-20`}>
          <div>
            <p className={SITE.eyebrowDark}><GraduationCap className="mr-1.5 inline h-4 w-4" aria-hidden />Learning path</p>
            <h1 className="mt-4 font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              From new account to automated sales — in four modules.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">Work through the lessons in order. Each one is a short, step-by-step walkthrough you follow inside your own workspace.</p>
          </div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/10 text-center">
            {[['Modules', modules.length], ['Lessons', lessonCount], ['Minutes', totalMinutes || '—']].map(([k, v]) => (
              <div key={k} className="bg-[#0B1712] px-3 py-6">
                <dd className="font-[family-name:var(--font-plus-jakarta)] text-3xl font-bold text-[#34D399]">{v}</dd>
                <dt className="mt-1 text-xs uppercase tracking-wider text-white/50">{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Syllabus */}
      <section className="py-16">
        <div className={`${SITE.wrap} max-w-4xl`}>
          <ol className="space-y-10">
            {modules.map((m, mi) => (
              <li key={m.name} className="grid gap-6 md:grid-cols-[180px_1fr]">
                <div>
                  <p className="text-sm font-semibold text-[#1D4B3E]">{m.level}</p>
                  <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold text-[#0B1712]">{m.name}</h2>
                  {m.total > 0 && <p className="mt-1 flex items-center gap-1 text-sm text-[#6B7280]"><Clock className="h-3.5 w-3.5" /> about {m.total} min</p>}
                </div>
                <div className="rounded-2xl border border-[#E4E7E1]">
                  <p className="border-b border-[#E4E7E1] bg-[#FAFAF8] px-5 py-3 text-sm text-[#374151]"><span className="font-semibold">You’ll finish with: </span>{m.outcome}</p>
                  <ol>
                    {m.lessons.map((g, li) => (
                      <li key={g.slug} className="border-b border-[#F1F2EF] last:border-0">
                        <Link href={`/help/${g.slug}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-[#F0F9F5]">
                          <span className="w-10 font-mono text-sm text-[#9CA3AF]">{mi + 1}.{li + 1}</span>
                          <PlayCircle className="h-5 w-5 shrink-0 text-[#1D4B3E]" aria-hidden />
                          <span className="min-w-0 flex-1 font-medium text-[#0B1712] group-hover:text-[#1D4B3E]">{g.title}</span>
                          {g.time && <span className="shrink-0 text-xs text-[#6B7280]">{g.time}</span>}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[#E4E7E1] bg-[#F5F6F2] py-14">
        <div className={`${SITE.wrap} flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center`}>
          <div>
            <h2 className={SITE.h3}>Learn faster inside the app</h2>
            <p className={`${SITE.body} mt-1`}>Key pages have a short interactive tour — open it any time from the Help button.</p>
          </div>
          <Link href="/register" className={SITE.btn}>Start free trial</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
