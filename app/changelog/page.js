import Link from 'next/link';
import { Rss } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { RELEASES } from '@/lib/marketing/releases';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Changelog',
  description: 'Every improvement shipped to LeadForGrow, newest first.',
  alternates: { canonical: 'https://www.leadforgrow.com/changelog' },
};

const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ChangelogPage() {
  return (
    <MarketingShell>
      <section className="border-b border-[#E4E7E1] pb-16 pt-32 sm:pt-36">
        <div className={`${SITE.narrow}`}>
          <p className="font-mono text-sm text-[#1D4B3E]">$ leadforgrow --changelog</p>
          <h1 className="mt-3 font-[family-name:var(--font-plus-jakarta)] text-4xl font-bold tracking-[-0.02em] text-[#0B1712] sm:text-5xl">Changelog</h1>
          <p className={`${SITE.lead} mt-4`}>Everything we shipped, newest first. Updates reach every workspace automatically — there is nothing to install.</p>
          <Link href="/product-updates" className={`${SITE.link} mt-4 inline-flex items-center gap-1.5 text-sm`}><Rss className="h-4 w-4" /> Read the highlights</Link>
        </div>
      </section>

      <section className="py-14">
        <div className={SITE.narrow}>
          <ol className="space-y-0">
            {RELEASES.map((r) => (
              <li key={`${r.date}-${r.title}`} className="grid gap-3 border-b border-[#F1F2EF] py-10 first:pt-0 md:grid-cols-[150px_1fr] md:gap-8">
                <div>
                  <time dateTime={r.date} className="text-sm font-medium text-[#6B7280]">{fmt(r.date)}</time>
                  <p className="mt-2"><span className="rounded-full bg-[#E8F3EE] px-2.5 py-0.5 text-xs font-semibold text-[#1D4B3E]">{r.tag}</span></p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0B1712]">{r.title}</h2>
                  <ul className="mt-4 space-y-2">
                    {r.items.map((it) => (
                      <li key={it} className="relative pl-5 text-[15px] leading-relaxed text-[#374151] before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#1D4B3E]">{it}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          <p className={`${SITE.small} mt-10`}>Earlier releases aren’t listed here. Questions about a change? <Link href="/contact" className={SITE.link}>Contact us</Link>.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
