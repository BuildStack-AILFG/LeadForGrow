import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { COMPANY } from '@/lib/founders/data';
import { SITE } from '@/lib/marketing/designTokens';

const VALUES = [
  { title: 'Speed to lead', body: 'Every enquiry deserves a response in minutes, not hours. Automation should feel instant, never robotic.' },
  { title: 'AI that assists', body: 'Suggestions and workflows that make a team faster — without replacing the human relationship with the customer.' },
  { title: 'Trust by design', body: 'Customer data is not ours to be careless with. Security, privacy and reliability are part of the product, not an add-on.' },
  { title: 'Built with operators', body: 'We build for people who sell for a living. Every feature has to earn its place in a real working day.' },
];

const TECH = [
  { label: 'Cloud infrastructure', detail: 'Hosted on managed cloud infrastructure' },
  { label: 'Data protection', detail: 'TLS in transit, sensitive credentials encrypted at rest, role-based access' },
  { label: 'Real-time messaging', detail: 'WhatsApp, Instagram, Messenger, email and web chat in one pipeline' },
  { label: 'AI assistance', detail: 'Context-aware replies grounded in your business knowledge base' },
];

// Registered-company details shown in "About Our Company". Only facts the business has confirmed; do not add
// registration numbers, addresses or claims here without the owner's sign-off.
const COMPANY_DETAILS = [
  { term: 'Legal Company Name', value: 'ScaleDesk Technology Private Limited' },
  { term: 'Product Brand', value: 'LeadForGrow' },
  { term: 'Official Website', value: 'https://www.leadforgrow.com', href: 'https://www.leadforgrow.com' },
  { term: 'Country of Operation', value: 'India' },
];

const FACTS = [
  ['What we make', 'A CRM, team inbox and automation platform'],
  ['Who it’s for', 'Businesses that sell over WhatsApp, Instagram and email'],
  ['Where', 'Built in India'],
];

export default function AboutPageContent() {
  return (
    <MarketingShell>
      {/* Masthead */}
      <header className={`${SITE.top} ${SITE.paper} border-b ${SITE.rule}`}>
        <div className={`${SITE.wrap} pb-16`}>
          <p className={SITE.label}>About {COMPANY.name}</p>
          <h1 className={`${SITE.serifXL} mt-6 max-w-4xl`}>
            We build the system behind every reply a business sends.
          </h1>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1fr]">
            <p className={`${SITE.prose} text-[18px]`}>
              {COMPANY.name} is a revenue platform from <strong className="font-semibold text-[#0B1712]">{COMPANY.parent}</strong>. We help
              businesses capture every enquiry, answer it quickly and follow it through to a sale — without juggling a phone, a spreadsheet
              and four different apps.
            </p>
            <dl className={`grid grid-cols-1 divide-y ${SITE.rule} border-y ${SITE.rule} sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>
              {FACTS.map(([k, v]) => (
                <div key={k} className="py-5 sm:px-5 sm:first:pl-0">
                  <dt className={SITE.label}>{k}</dt>
                  <dd className="mt-2 text-[15px] leading-snug text-[#0B1712]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      {/* Mission & Vision — two statements divided by a rule */}
      <section className="py-20 lg:py-24">
        <div className={`${SITE.wrap} grid gap-12 md:grid-cols-2 md:gap-0`}>
          <div className="md:pr-12">
            <h2 className={SITE.label}>Mission</h2>
            <p className={`${SITE.serif} mt-5 text-[1.6rem] leading-[1.35] sm:text-[1.9rem]`}>
              No business should lose a lead because of slow follow-up, scattered tools or manual chaos.
            </p>
          </div>
          <div className={`border-t ${SITE.rule} pt-12 md:border-l md:border-t-0 md:pl-12 md:pt-0`}>
            <h2 className={SITE.label}>Vision</h2>
            <p className={`${SITE.serif} mt-5 text-[1.6rem] leading-[1.35] sm:text-[1.9rem]`}>
              One place where CRM, inbox, automation and AI work together — for businesses of every size.
            </p>
          </div>
        </div>
      </section>

      {/* About Our Company — the legal entity behind the product brand */}
      <section className={`border-y ${SITE.rule} ${SITE.paper} py-20`} aria-labelledby="about-company-heading">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <p className={SITE.label}>Company</p>
            <h2 id="about-company-heading" className={`${SITE.serifH2} mt-4`}>About Our Company</h2>
            <p className={`${SITE.prose} mt-6`}>
              LeadForGrow is a SaaS platform developed and operated by ScaleDesk Technology Private Limited.
              LeadForGrow helps businesses manage leads, customer conversations, sales pipelines, follow-ups, and
              business automation through an integrated platform.
            </p>
          </div>
          <dl className={`self-start border-t-2 border-[#0B1712]`}>
            {COMPANY_DETAILS.map(({ term, value, href }) => (
              <div key={term} className={`grid gap-1 border-b ${SITE.rule} py-4 sm:grid-cols-[220px_1fr]`}>
                <dt className="text-sm text-[#6B6B63]">{term}</dt>
                <dd className="min-w-0 break-words text-[15px] font-medium text-[#0B1712]">
                  {href ? <a href={href} className={SITE.link}>{value}</a> : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-24">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.serifH2} max-w-xl`}>Values that guide every decision</h2>
          <ol className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {VALUES.map((v, i) => (
              <li key={v.title} className={`grid grid-cols-[56px_1fr] border-t ${SITE.rule} pt-6`}>
                <span className={`${SITE.serif} text-2xl text-[#1D4B3E]`}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-lg font-semibold text-[#0B1712]">{v.title}</h3>
                  <p className={`${SITE.body} mt-2`}>{v.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Technology */}
      <section className="bg-[#0B1712] py-20 text-white">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Technology stack</p>
            <h2 className="mt-4 font-[family-name:var(--font-landing-serif)] text-[1.75rem] leading-[1.2] sm:text-[2.125rem]">How the platform is put together</h2>
          </div>
          <dl>
            {TECH.map((t) => (
              <div key={t.label} className="grid gap-1 border-b border-white/15 py-5 first:border-t sm:grid-cols-[220px_1fr]">
                <dt className="font-semibold">{t.label}</dt>
                <dd className="text-white/70">{t.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Close */}
      <section className="py-20">
        <div className={`${SITE.wrap} flex flex-col gap-8 md:flex-row md:items-end md:justify-between`}>
          <p className={`${SITE.serif} max-w-2xl text-[1.75rem] leading-snug`}>See how it works for your business — or just say hello.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className={SITE.btnGhost}>Contact us</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
