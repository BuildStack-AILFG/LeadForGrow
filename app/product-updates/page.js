import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { RELEASES } from '@/lib/marketing/releases';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Product Updates',
  description: 'The biggest recent additions to LeadForGrow, explained: what’s new, why it matters and where to find it.',
  alternates: { canonical: 'https://www.leadforgrow.com/product-updates' },
};

const month = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export default function ProductUpdatesPage() {
  const [lead, ...rest] = RELEASES.filter((r) => r.highlight);
  return (
    <MarketingShell>
      <section className="bg-[#F5F6F2] pb-16 pt-32 sm:pt-36">
        <div className={SITE.wrap}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className={SITE.eyebrow}><Sparkles className="mr-1.5 inline h-4 w-4" aria-hidden />Product updates</p>
              <h1 className={`${SITE.display} mt-3`}>What’s new in LeadForGrow</h1>
            </div>
            <Link href="/changelog" className={SITE.btnGhost}>Full changelog <ArrowRight className="h-4 w-4" /></Link>
          </div>

          {/* Cover story */}
          {lead && (
            <article className="mt-12 grid overflow-hidden rounded-2xl bg-white lg:grid-cols-2">
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="text-sm text-[#6B7280]">{month(lead.date)} · {lead.tag}</p>
                <h2 className={`${SITE.h2} mt-3`}>{lead.title}</h2>
                <p className={`${SITE.lead} mt-4`}>{lead.summary}</p>
                <ul className="mt-6 space-y-2">
                  {lead.items.slice(0, 3).map((it) => <li key={it} className="text-[15px] text-[#374151]">— {it}</li>)}
                </ul>
              </div>
              <div className="bg-[#E8F3EE] p-6 sm:p-10">
                <img src={lead.image} alt="" className="h-full w-full rounded-xl object-cover object-left-top shadow-lg" />
              </div>
            </article>
          )}
        </div>
      </section>

      {/* Story grid */}
      <section className="py-16">
        <div className={`${SITE.wrap} grid gap-10 md:grid-cols-2`}>
          {rest.map((r) => (
            <article key={r.title} className="group">
              <div className="aspect-[16/9] overflow-hidden rounded-xl bg-[#F5F6F2]">
                <img src={r.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              </div>
              <p className="mt-5 text-sm text-[#6B7280]">{month(r.date)} · {r.tag}</p>
              <h2 className="mt-2 font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold tracking-[-0.01em] text-[#0B1712]">{r.title}</h2>
              <p className={`${SITE.body} mt-3`}>{r.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#E4E7E1] py-14">
        <div className={`${SITE.wrap} flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center`}>
          <p className="max-w-xl text-lg text-[#0B1712]">Every update is already live in your workspace. Want a walkthrough of what changed?</p>
          <Link href="/contact" className={SITE.btn}>Book a walkthrough</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
