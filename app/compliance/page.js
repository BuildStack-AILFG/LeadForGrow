import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Compliance',
  description: 'The policies that govern LeadForGrow, and how the product helps you follow WhatsApp, Meta and email rules when you message customers.',
  alternates: { canonical: 'https://www.leadforgrow.com/compliance' },
};

const REGISTER = [
  ['01', 'Privacy Policy', 'What we collect, why, and your rights', '/privacy'],
  ['02', 'Terms of Service', 'The agreement for using LeadForGrow', '/terms'],
  ['03', 'Refund Policy', 'Trials, refunds and cancellation', '/refund-policy'],
  ['04', 'Data Processing Agreement', 'Our obligations when we process data for you', '/dpa'],
  ['05', 'GDPR & Data Protection', 'Controller and processor roles, your rights', '/gdpr'],
  ['06', 'Cookie Policy', 'Cookies and browser storage we use', '/cookie-policy'],
  ['07', 'Security overview', 'Technical and organisational safeguards', '/security'],
  ['08', 'Responsible disclosure', 'Reporting vulnerabilities', '/responsible-disclosure'],
  ['09', 'Accessibility statement', 'Our approach and known limitations', '/accessibility'],
];

const RULES = [
  ['Opt-out', 'A customer who replies STOP is not messaged again by automations, sequences, flows or broadcasts. START opts them back in.', 'Collect permission before you message people.'],
  ['WhatsApp 24-hour window', 'Free-text replies are offered only within 24 hours of the customer’s last message; outside it, only approved templates.', 'Choose templates that suit the conversation.'],
  ['Template approval', 'Templates are submitted to Meta from inside LeadForGrow, and only approved ones can be sent.', 'Write templates that follow Meta’s policies.'],
  ['Email unsubscribe', 'Every broadcast email carries a per-recipient unsubscribe link.', 'Send only to people who expect to hear from you.'],
  ['Consent on forms', 'The visitor’s cookie-consent choice is stored with leads from LeadForGrow web forms.', 'Explain on your own site how you use enquiries.'],
];

export default function CompliancePage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} pb-14`}>
        <div className={`${SITE.wrap} grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end`}>
          <div>
            <p className={SITE.label}>Compliance</p>
            <h1 className={`${SITE.serifXL} mt-6`}>Policies in one register. Messaging rules in the product.</h1>
          </div>
          <p className={SITE.prose}>Everything that governs how LeadForGrow handles data, and the safeguards that help you message customers within the rules.</p>
        </div>
      </header>

      <section className="pb-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.serif} text-2xl`}>Document register</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-t-2 border-[#0B1712] text-left">
              <thead>
                <tr className={`border-b ${SITE.rule}`}>
                  {['No.', 'Document', 'Covers', ''].map((h) => <th key={h} className={`${SITE.label} py-3 pr-4 font-semibold`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {REGISTER.map(([ref, t, d, href]) => (
                  <tr key={href} className={`group border-b ${SITE.rule} hover:bg-[#FAF9F6]`}>
                    <td className="py-4 pr-4 font-mono text-xs text-[#A3A199]">{ref}</td>
                    <td className="py-4 pr-4"><Link href={href} className="font-semibold text-[#0B1712] group-hover:text-[#1D4B3E]">{t}</Link></td>
                    <td className="py-4 pr-4 text-[15px] text-[#4B4D46]">{d}</td>
                    <td className="py-4 text-right"><Link href={href} className="text-sm font-medium text-[#1D4B3E]" aria-label={`Open ${t}`}>Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`border-t ${SITE.rule} ${SITE.paper} py-20`}>
        <div className={SITE.wrap}>
          <h2 className={SITE.serifH2}>Messaging rules, and who does what</h2>
          <p className={`${SITE.body} mt-3 max-w-2xl`}>LeadForGrow enforces what it can. Some obligations stay with you as the business sending the messages.</p>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[760px] border-t-2 border-[#0B1712] text-left">
              <thead>
                <tr className={`border-b ${SITE.rule}`}>
                  <th className={`${SITE.label} w-48 py-3 pr-6 font-semibold`}>Rule</th>
                  <th className={`${SITE.label} py-3 pr-6 font-semibold`}>What LeadForGrow does</th>
                  <th className={`${SITE.label} py-3 font-semibold`}>What stays with you</th>
                </tr>
              </thead>
              <tbody>
                {RULES.map(([rule, ours, yours]) => (
                  <tr key={rule} className={`border-b ${SITE.rule} align-top`}>
                    <th scope="row" className="py-5 pr-6 font-semibold text-[#0B1712]">{rule}</th>
                    <td className="py-5 pr-6 text-[15px] leading-relaxed text-[#33352F]">{ours}</td>
                    <td className="py-5 text-[15px] leading-relaxed text-[#6B6B63]">{yours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`${SITE.small} mt-8 max-w-3xl`}>
            LeadForGrow’s safeguards help, but do not replace, your own obligations under WhatsApp and Meta policies and applicable law.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
