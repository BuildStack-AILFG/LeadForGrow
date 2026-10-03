import { Download } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Press & Brand',
  description: 'Company facts, a ready-to-use description of LeadForGrow, brand assets and media contact.',
  alternates: { canonical: 'https://www.leadforgrow.com/press' },
};

const FACTS = [
  ['Product', 'LeadForGrow'],
  ['Company', LEGAL_NAME],
  ['Headquarters', 'Uttar Pradesh, India'],
  ['Category', 'CRM, team inbox and automation for businesses that sell over WhatsApp, Instagram, Messenger and email'],
  ['Website', 'www.leadforgrow.com'],
  ['Media contact', 'press@leadforgrow.com'],
];

const COLORS = [
  ['Forest', '#1D4B3E', 'text-white'],
  ['Ink', '#0B1712', 'text-white'],
  ['Mint', '#34D399', 'text-[#0B1712]'],
  ['Paper', '#F5F6F2', 'text-[#0B1712]'],
];

const BOILERPLATE = `LeadForGrow is a CRM and business automation platform for companies that sell over chat. It brings WhatsApp, Instagram, Facebook Messenger and email into one team inbox, turns every enquiry into a tracked lead, and automates follow-up with visual workflows, broadcasts and AI reply suggestions grounded in the business’s own knowledge. ${PRODUCT_STATEMENT}`;

export default function PressPage() {
  return (
    <MarketingShell>
      {/* Newsroom masthead */}
      <header className={`${SITE.top} border-b-2 border-[#0B1712]`}>
        <div className={`${SITE.wrap} flex flex-col gap-6 pb-10 md:flex-row md:items-end md:justify-between`}>
          <div>
            <p className={SITE.label}>Newsroom</p>
            <h1 className={`${SITE.serifXL} mt-6`}>Press &amp; brand</h1>
          </div>
          <p className="max-w-sm text-[15px] text-[#4B4D46]">
            For interviews, comments or product information write to{' '}
            <a href="mailto:press@leadforgrow.com" className={SITE.link}>press@leadforgrow.com</a> — Mon–Fri, 9:00 AM – 6:00 PM IST.
          </p>
        </div>
      </header>

      <section className="py-16">
        <div className={`${SITE.wrap} grid gap-14 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <h2 className={SITE.label}>Fact sheet</h2>
            <dl className="mt-4">
              {FACTS.map(([k, v]) => (
                <div key={k} className={`grid grid-cols-[130px_1fr] gap-4 border-b ${SITE.rule} py-3.5`}>
                  <dt className="text-sm text-[#6B6B63]">{k}</dt>
                  <dd className="text-[15px] text-[#0B1712]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className={SITE.label}>Boilerplate — free to copy as written</h2>
            <blockquote className={`${SITE.serif} mt-4 border-l-2 border-[#1D4B3E] pl-6 text-[1.2rem] leading-[1.7]`}>{BOILERPLATE}</blockquote>
            <h3 className="mt-10 text-sm font-semibold text-[#0B1712]">Writing the name</h3>
            <p className={`${SITE.body} mt-2`}>
              One word with capital L, F and G: <strong className="text-[#0B1712]">LeadForGrow</strong>. Not “Lead For Grow”, “Leadforgrow” or “LFG”.
            </p>
          </div>
        </div>
      </section>

      <section id="brand-assets" className={`scroll-mt-24 border-t ${SITE.rule} ${SITE.paper} py-16`}>
        <div className={SITE.wrap}>
          <h2 className={SITE.serifH2}>Brand assets</h2>
          <div className="mt-10 grid gap-px bg-[#E2E0D8] md:grid-cols-2">
            <figure className="bg-white">
              <div className="flex h-60 items-center justify-center"><img src="/logo.png" alt="LeadForGrow logo mark in colour" className="h-28 w-auto" /></div>
              <figcaption className={`flex items-center justify-between border-t ${SITE.rule} px-6 py-4 text-sm`}>
                <span className="text-[#0B1712]">Logo mark · colour · PNG</span>
                <a href="/logo.png" download="leadforgrow-logo.png" className="inline-flex items-center gap-1.5 font-semibold text-[#1D4B3E] hover:underline"><Download className="h-4 w-4" /> Download</a>
              </figcaption>
            </figure>
            <figure className="bg-white">
              <div className="flex h-60 items-center justify-center bg-[#1D4B3E]"><img src="/logo.png" alt="LeadForGrow logo mark in white" className="h-28 w-auto brightness-0 invert" /></div>
              <figcaption className={`border-t ${SITE.rule} px-6 py-4 text-sm text-[#0B1712]`}>On dark backgrounds, use the mark in solid white.</figcaption>
            </figure>
          </div>

          <h3 className={`${SITE.label} mt-14`}>Colours</h3>
          <ul className="mt-4 grid grid-cols-2 gap-px bg-[#E2E0D8] sm:grid-cols-4">
            {COLORS.map(([name, hex, text]) => (
              <li key={hex} className={`flex h-32 flex-col justify-end p-4 ${text}`} style={{ background: hex }}>
                <span className="font-semibold">{name}</span><span className="font-mono text-xs opacity-80">{hex}</span>
              </li>
            ))}
          </ul>
          <p className={`${SITE.small} mt-6`}>Please don’t recolour, stretch or add effects to the logo, and leave clear space around it.</p>
        </div>
      </section>
    </MarketingShell>
  );
}
