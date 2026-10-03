import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { LEGAL_NAME } from '@/lib/company';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Careers',
  description: 'Work on LeadForGrow — the CRM and automation platform built in India for businesses that sell on WhatsApp.',
  alternates: { canonical: 'https://www.leadforgrow.com/careers' },
};

const PRINCIPLES = [
  ['Start from the customer’s chat', 'Our users are garage owners, admission counsellors and sales teams. We judge our work by whether their day got easier.'],
  ['Say only what’s true', 'No invented numbers on the website and no features we haven’t built. If it isn’t real, we don’t claim it.'],
  ['Finish the job', 'A feature is done when it works on a phone, in dark mode and for the edge cases — and when it’s documented.'],
  ['Ship, then improve', 'Small, frequent releases. The changelog shows the pace.'],
];

const AREAS = [
  ['Engineering', 'Next.js, Node.js, MongoDB, messaging APIs'],
  ['Product design', 'Interfaces people use all day'],
  ['Customer success', 'Onboarding and support for growing teams'],
  ['Growth & content', 'Guides, campaigns and partnerships'],
];

export default function CareersPage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} pb-16`}>
        <div className={SITE.narrow}>
          <p className={SITE.label}>Careers at LeadForGrow</p>
          <h1 className={`${SITE.serifXL} mt-6`}>Help small businesses stop losing customers to an unanswered message.</h1>
        </div>
      </header>

      {/* Letter */}
      <section className="pb-20">
        <div className={`${SITE.narrow} ${SITE.prose} space-y-5 text-[18px]`}>
          <p>
            Most businesses in India sell over WhatsApp. Most of them also lose customers every week — not because the product was wrong, but
            because nobody replied in time, or nobody followed up.
          </p>
          <p>
            LeadForGrow exists to fix that. It’s built by {LEGAL_NAME}, a small team in India, and it’s the first thing many of our
            customers open in the morning. That’s a responsibility we take personally.
          </p>
          <p className="text-[#6B6B63]">— The LeadForGrow team</p>
        </div>
      </section>

      {/* Principles */}
      <section className={`border-y ${SITE.rule} ${SITE.paper} py-20`}>
        <div className={SITE.wrap}>
          <h2 className={SITE.serifH2}>How we work</h2>
          <ol className="mt-12 grid gap-x-16 md:grid-cols-2">
            {PRINCIPLES.map(([t, d], i) => (
              <li key={t} className={`border-t ${SITE.rule} py-7`}>
                <p className="font-mono text-xs text-[#6B6B63]">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-[#0B1712]">{t}</h3>
                <p className={`${SITE.body} mt-2`}>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Openings */}
      <section className="py-20">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[1.2fr_0.8fr]`}>
          <div>
            <h2 className={SITE.serifH2}>Open positions</h2>
            <table className="mt-8 w-full border-t-2 border-[#0B1712] text-left">
              <thead>
                <tr className={`border-b ${SITE.rule}`}>
                  <th className={`${SITE.label} py-3 font-semibold`}>Team</th>
                  <th className={`${SITE.label} py-3 font-semibold`}>Area</th>
                  <th className={`${SITE.label} py-3 text-right font-semibold`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {AREAS.map(([team, area]) => (
                  <tr key={team} className={`border-b ${SITE.rule}`}>
                    <td className="py-4 pr-4 font-medium text-[#0B1712]">{team}</td>
                    <td className="py-4 pr-4 text-sm text-[#4B4D46]">{area}</td>
                    <td className="py-4 text-right text-sm text-[#6B6B63]">No opening</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`${SITE.small} mt-4`}>We don’t have roles advertised right now. When one opens, it will be listed here first.</p>
          </div>
          <aside className="self-start border-l-2 border-[#1D4B3E] pl-8">
            <h3 className={`${SITE.serif} text-2xl`}>Introduce yourself anyway</h3>
            <p className={`${SITE.body} mt-3`}>
              Send a short note about what you’d like to work on, with a link to something you’ve made — a portfolio, a GitHub profile or a
              product you shipped. We read every message.
            </p>
            <a href="mailto:careers@leadforgrow.com" className={`${SITE.btn} mt-6`}>careers@leadforgrow.com <ArrowRight className="h-4 w-4" /></a>
            <p className={`${SITE.small} mt-6`}>Curious what we’ve been building? Read the <Link href="/changelog" className={SITE.link}>changelog</Link>.</p>
          </aside>
        </div>
      </section>
    </MarketingShell>
  );
}
