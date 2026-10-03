import Link from 'next/link';
import { ArrowRight, MonitorPlay, MousePointerClick, BookOpen, Video } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Videos & walkthroughs',
  description: 'See LeadForGrow in action: book a live walkthrough with our team, take the interactive tours inside the app, or follow the illustrated guides.',
  alternates: { canonical: 'https://www.leadforgrow.com/videos' },
};

const TOURS = [
  ['Dashboard', 'What the numbers mean and where to start your day.'],
  ['Leads', 'Views, filters, row colours and adding a lead.'],
  ['Automation rules', 'Pick a template and switch on your first automation.'],
];

export default function VideosPage() {
  return (
    <MarketingShell>
      {/* Theatre hero */}
      <section className="bg-[#050A08] pb-16 pt-32 text-white lg:pb-24 lg:pt-40">
        <div className={`${SITE.wrap} text-center`}>
          <p className={SITE.eyebrowDark}><Video className="mr-1.5 inline h-4 w-4" aria-hidden />Videos &amp; walkthroughs</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            The best demo is one built around your business.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/65">
            Rather than a library of generic recordings, we walk you through LeadForGrow live — using your channels, your pipeline and your
            questions.
          </p>
        </div>
        <div className={`${SITE.wrap} mt-12`}>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1D4B3E] to-[#0B1712] shadow-[0_40px_120px_-40px_rgba(52,211,153,0.35)]">
            <div className="flex aspect-video flex-col items-center justify-center gap-6 p-8 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                <MonitorPlay className="h-9 w-9 text-[#34D399]" aria-hidden />
              </span>
              <div>
                <p className="text-xl font-semibold">Live walkthrough · about 30 minutes</p>
                <p className="mt-1 text-sm text-white/60">Screen-share with our team · Mon–Fri, 9:00 AM – 6:00 PM IST</p>
              </div>
              <Link href="/contact" className={SITE.btnLight}>Book a walkthrough <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive tours */}
      <section className="py-20">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <MousePointerClick className="h-7 w-7 text-[#1D4B3E]" aria-hidden />
            <h2 className={`${SITE.h2} mt-3`}>Prefer to click through yourself?</h2>
            <p className={`${SITE.body} mt-4`}>
              Start a free trial and the app shows you around. Each tour highlights one part of the screen at a time, and you can replay it from
              the Help button whenever you like.
            </p>
            <Link href="/register" className={`${SITE.btn} mt-6`}>Start free trial</Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {TOURS.map(([name, text], i) => (
              <li key={name} className="flex gap-4 rounded-xl border border-[#E4E7E1] p-5">
                <span className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold text-[#1D4B3E]/30">{i + 1}</span>
                <div><h3 className="font-semibold text-[#0B1712]">{name} tour</h3><p className={`${SITE.small} mt-1`}>{text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-20">
        <div className={SITE.wrap}>
          <Link href="/tutorials" className="group flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#F5F6F2] p-8 sm:flex-row sm:items-center">
            <span className="flex items-center gap-4">
              <BookOpen className="h-7 w-7 text-[#1D4B3E]" aria-hidden />
              <span><span className="block text-lg font-semibold text-[#0B1712]">Illustrated, step-by-step lessons</span><span className={SITE.small}>The full learning path, with a picture for every step.</span></span>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#1D4B3E]">Open tutorials <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
