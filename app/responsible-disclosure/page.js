import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Responsible Disclosure',
  description: 'How to report a security vulnerability in LeadForGrow: scope, what to include, how we respond, and our safe-harbour commitment.',
  alternates: { canonical: 'https://www.leadforgrow.com/responsible-disclosure' },
};

const IN_SCOPE = ['www.leadforgrow.com and leadforgrow.com', 'The LeadForGrow app (/automation) and its API routes', 'Public forms, booking pages and the website chat widget'];
const OUT_SCOPE = ['Social engineering or phishing of our team or customers', 'Physical attacks', 'Denial-of-service or load testing', 'Third-party services we use (report those to the vendor)'];

const PROCESS = [
  ['Report privately', 'Email security@leadforgrow.com with a description, steps to reproduce and the impact you observed.'],
  ['We acknowledge', 'We aim to respond within 72 hours to confirm we have it.'],
  ['We investigate', 'We reproduce the issue, assess severity and work on a fix, keeping you updated.'],
  ['We fix and credit', 'Once fixed we let you know and, with your permission, thank you publicly.'],
];

export default function ResponsibleDisclosurePage() {
  const H2 = `${SITE.serif} mt-16 text-[1.75rem]`;
  return (
    <MarketingShell>
      <header className={`${SITE.top} border-b ${SITE.rule} pb-12`}>
        <div className={SITE.wrap}>
          <p className={SITE.label}>Security policy</p>
          <h1 className={`${SITE.serifXL} mt-6`}>Responsible disclosure</h1>
          {/* Policy memo header */}
          <dl className={`mt-10 grid border-t-2 border-[#0B1712] sm:grid-cols-4`}>
            {[
              ['Report to', <a key="m" href="mailto:security@leadforgrow.com" className={SITE.link}>security@leadforgrow.com</a>],
              ['First response', 'Aim: within 72 hours'],
              ['Bug bounty', 'None at present'],
              ['Applies to', 'LeadForGrow website and app'],
            ].map(([k, v]) => (
              <div key={k} className={`border-b ${SITE.rule} py-4 sm:border-b-0 sm:pr-6`}>
                <dt className={SITE.label}>{k}</dt>
                <dd className="mt-1.5 break-words text-[15px] text-[#0B1712]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <article className={`${SITE.narrow} pb-24 pt-4`}>
        <p className={`${SITE.prose} mt-10 text-[18px]`}>
          If you believe you’ve found a security vulnerability in LeadForGrow, please tell us privately first so we can protect our customers.
          We welcome reports from researchers acting in good faith.
        </p>

        <h2 className={H2}>1. Scope</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <p className={`${SITE.label} text-[#1D4B3E]`}>In scope</p>
            <ul className={`${SITE.prose} mt-3 list-disc space-y-1.5 pl-5`}>{IN_SCOPE.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          <div>
            <p className={`${SITE.label} text-rose-700`}>Out of scope</p>
            <ul className={`${SITE.prose} mt-3 list-disc space-y-1.5 pl-5`}>{OUT_SCOPE.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </div>

        <h2 className={H2}>2. What happens after you report</h2>
        <ol className="mt-6">
          {PROCESS.map(([t, d], i) => (
            <li key={t} className={`grid grid-cols-[48px_1fr] border-t ${SITE.rule} py-5`}>
              <span className={`${SITE.serif} text-2xl text-[#1D4B3E]`}>{i + 1}</span>
              <div><h3 className="font-semibold text-[#0B1712]">{t}</h3><p className={`${SITE.body} mt-1`}>{d}</p></div>
            </li>
          ))}
        </ol>

        <h2 className={H2}>3. Safe harbour</h2>
        <p className={`${SITE.prose} mt-4`}>If you follow this policy, we will not pursue legal action against you for your research. In return, please:</p>
        <ul className={`${SITE.prose} mt-3 list-disc space-y-2 pl-5`}>
          <li>Act in good faith and avoid privacy violations, data destruction and service disruption.</li>
          <li>Access only your own accounts and data, and stop as soon as you reach someone else’s.</li>
          <li>Give us reasonable time to fix the issue before you disclose it publicly.</li>
          <li>Don’t include customer data in your report beyond what is needed to show the issue.</li>
        </ul>

        <p className={`mt-16 border-t ${SITE.rule} pt-6 text-sm text-[#6B6B63]`}>
          For a summary of our safeguards see the <Link href="/security" className={SITE.link}>Security overview</Link>.
        </p>
      </article>
    </MarketingShell>
  );
}
