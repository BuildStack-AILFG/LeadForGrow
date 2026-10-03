import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Partners',
  description: 'Partner with LeadForGrow as an agency, an implementation partner or a referral partner.',
  alternates: { canonical: 'https://www.leadforgrow.com/partners' },
};

const TRACKS = ['Agency', 'Implementation', 'Referral'];
const ROWS = [
  ['Who it’s for', ['Marketing and performance agencies', 'Consultants and freelancers who set up systems', 'Anyone who advises small businesses']],
  ['What you do', ['Run lead handling and reporting for your clients', 'Set up WhatsApp, pipelines, flows and sequences for clients', 'Introduce businesses that need a WhatsApp-first CRM']],
  ['What we provide', ['The agency portal: client workspaces, forms, reports, invoices', 'Product walkthroughs and help on larger roll-outs', 'The demo, onboarding and ongoing support']],
  ['Terms', ['Agreed with you on a call', 'Agreed with you on a call', 'Agreed with you before your first referral']],
];

const STEPS = [
  ['Apply', 'Tell us about you, your clients and the track you’re interested in.'],
  ['Talk', 'A short call to agree the right track and the terms.'],
  ['Start', 'Access, a walkthrough, and your first client set up together.'],
];

export default function PartnersPage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} ${SITE.paper} border-b ${SITE.rule} pb-16`}>
        <div className={`${SITE.wrap} grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end`}>
          <div>
            <p className={SITE.label}>Partner programme</p>
            <h1 className={`${SITE.serifXL} mt-6`}>Grow your business by growing your clients’.</h1>
          </div>
          <div>
            <p className={SITE.prose}>Three ways to work with us, depending on how you already help businesses.</p>
            <Link href="/contact" className={`${SITE.btn} mt-6`}>Apply to partner <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      {/* Comparison table */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <h2 className={SITE.serifH2}>The three tracks</h2>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[720px] border-t-2 border-[#0B1712] text-left">
              <thead>
                <tr className={`border-b ${SITE.rule}`}>
                  <th className="w-44 py-5" aria-label="Detail" />
                  {TRACKS.map((t) => (
                    <th key={t} scope="col" className="py-5 pr-6 align-bottom">
                      <span className={`${SITE.serif} text-2xl`}>{t}</span>
                      <span className="block text-sm font-normal text-[#6B6B63]">partner</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, cells]) => (
                  <tr key={label} className={`border-b ${SITE.rule} align-top`}>
                    <th scope="row" className={`${SITE.label} py-5 pr-6 font-semibold`}>{label}</th>
                    {cells.map((c, i) => <td key={i} className="py-5 pr-6 text-[15px] leading-relaxed text-[#33352F]">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-[#0B1712] py-20 text-white">
        <div className={SITE.wrap}>
          <h2 className="font-[family-name:var(--font-landing-serif)] text-[1.75rem] sm:text-[2.125rem]">How to join</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="border-t border-white/20 pt-6">
                <p className="font-mono text-sm text-[#34D399]">Step {i + 1}</p>
                <h3 className="mt-2 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-white/70">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-14 text-white/70">
            On the contact form choose <strong className="text-white">Partnerships</strong>, or read how{' '}
            <Link href="/solutions/agencies" className="text-white underline underline-offset-4 hover:text-[#34D399]">agencies use LeadForGrow</Link>.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
