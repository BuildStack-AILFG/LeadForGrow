import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'GDPR & Data Protection',
  description: 'How ScaleDesk Technology Private Limited handles personal data for the LeadForGrow platform.',
  alternates: { canonical: 'https://www.leadforgrow.com/gdpr' },
};

const RIGHTS = [
  ['Access', 'Ask for a copy of the personal data we hold about you.'],
  ['Rectification', 'Ask us to correct data that is wrong or incomplete.'],
  ['Erasure', 'Ask us to delete your data where there is no reason to keep it.'],
  ['Restriction', 'Ask us to limit how we use your data while a question is resolved.'],
  ['Portability', 'Receive your data in a common, machine-readable format.'],
  ['Objection', 'Object to processing based on our legitimate interests.'],
];

export default function GDPRPage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} pb-12`}>
        <div className={`${SITE.wrap} max-w-5xl`}>
          <p className={SITE.label}>Legal · Data protection</p>
          <h1 className={`${SITE.serifXL} mt-6`}>GDPR &amp; Data Protection</h1>
          <p className="mt-6 font-mono text-xs text-[#6B6B63]">Last updated: September 2026</p>
        </div>
      </header>

      <div className={`${SITE.wrap} max-w-5xl pb-24`}>
        {/* Data controller */}
        <section className="grid gap-8 border-y-2 border-[#0B1712] py-10 md:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h2 className={`${SITE.serif} text-[1.6rem]`}>Data controller</h2>
            <p className={`${SITE.prose} mt-4`}>
              {LEGAL_NAME}, which operates LeadForGrow, is the data controller for account and platform data. Customer data processed on behalf of
              users is handled as a data processor.
            </p>
            <p className={`${SITE.prose} mt-3`}>{PRODUCT_STATEMENT}</p>
          </div>
          <div className="text-sm leading-relaxed text-[#4B4D46] md:border-l md:border-[#E2E0D8] md:pl-8">
            <CompanyAddress variant="full" />
          </div>
        </section>

        {/* Rights */}
        <section className="mt-16">
          <h2 className={`${SITE.serif} text-[1.6rem]`}>Your rights</h2>
          <p className={`${SITE.prose} mt-4 max-w-3xl`}>
            Under GDPR you have the right to access, rectify, erase, restrict processing, data portability, and object to processing. Contact
            privacy@leadforgrow.com to exercise these rights.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[520px] border-t-2 border-[#0B1712] text-left">
              <thead>
                <tr className={`border-b ${SITE.rule}`}>
                  <th className={`${SITE.label} w-48 py-3 font-semibold`}>Right</th>
                  <th className={`${SITE.label} py-3 font-semibold`}>In short</th>
                </tr>
              </thead>
              <tbody>
                {RIGHTS.map(([r, d]) => (
                  <tr key={r} className={`border-b ${SITE.rule}`}>
                    <th scope="row" className="py-4 pr-4 font-semibold text-[#0B1712]">{r}</th>
                    <td className="py-4 text-[15px] text-[#33352F]">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 border-l-2 border-[#1D4B3E] pl-5 text-[15px] text-[#0B1712]">
            To make a request, email <a href="mailto:privacy@leadforgrow.com" className={SITE.link}>privacy@leadforgrow.com</a> from the address on
            your account and tell us which right you want to use.
          </p>
        </section>

        {/* Processing + transfers side by side */}
        <section className="mt-16 grid gap-12 md:grid-cols-2">
          <div className={`border-t ${SITE.rule} pt-8`}>
            <h2 className={`${SITE.serif} text-[1.4rem]`}>Data processing</h2>
            <p className={`${SITE.prose} mt-4`}>
              We aim to process personal data responsibly and in accordance with applicable data protection laws. We process data only for
              providing the service, improving the platform, and legal compliance. Sub-processors are listed in our DPA.
            </p>
            <Link href="/dpa" className={`${SITE.link} mt-4 inline-block text-sm`}>Read the Data Processing Agreement</Link>
          </div>
          <div className={`border-t ${SITE.rule} pt-8`}>
            <h2 className={`${SITE.serif} text-[1.4rem]`}>International transfers</h2>
            <p className={`${SITE.prose} mt-4`}>
              Data may be processed in India and other regions where our infrastructure providers operate, with appropriate safeguards in place.
            </p>
            <Link href="/privacy" className={`${SITE.link} mt-4 inline-block text-sm`}>Read the Privacy Policy</Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
