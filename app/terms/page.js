import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of LeadForGrow, operated by ScaleDesk Technology Private Limited.',
  alternates: { canonical: 'https://www.leadforgrow.com/terms' },
};

/** "6. Payments…" -> ['6', 'Payments…'] so the number can hang in the margin. */
const split = (title) => {
  const m = /^(\d+)\.\s+(.*)$/.exec(title);
  return m ? [m[1], m[2]] : ['', title];
};

export default function TermsOfService() {
 const terms = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using the LeadForGrow platform, including its products and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree to these terms, you must not access or use the platform."
  },
  {
    title: "2. Description of Service",
    content:
      "LeadForGrow provides a CRM and business automation platform that includes lead capture, automation, task management, analytics, communication workflows, and related tools. Features may vary based on the subscription plan selected."
  },
  {
    title: "3. Account Registration & Responsibility",
    content:
      "To use the service, you must create an account and provide accurate, complete, and current information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
  },
  {
    title: "4. Subscription Plans, Billing & Usage Limits",
    content:
      "Certain features are subject to usage limits such as number of leads, users, clients, automations, or integrations, depending on your subscription plan. Fees are billed in advance on a monthly or annual basis. We reserve the right to modify pricing or plan limits with reasonable prior notice."
  },
  {
    title: "5. Free Trials",
    content:
      "Free trial access may be offered at our discretion. At the end of the trial period, continued use of the service requires an active paid subscription. We reserve the right to limit or revoke trial access in cases of abuse."
  },
  {
  title: "6. Payments, Cancellation & Refunds",
  content:
    <>
      Subscription fees, usage charges, and add-ons are billed in advance. You may cancel your subscription at any time from your
      billing settings; cancellation prevents future billing, and access continues until the end of the current billing period.
      Refunds, where available, are governed by our{' '}
      <Link href="/refund-policy" className="font-semibold text-[#1D4B3E] underline underline-offset-4">Refund Policy</Link>,
      which forms part of these Terms.
    </>
},

  {
    title: "7. Acceptable Use Policy",
    content:
      "You agree not to use the platform for unlawful activities, spamming, unsolicited messaging, data scraping, or any activity that violates applicable laws or third-party rights. We reserve the right to suspend or terminate accounts that violate this policy."
  },
  {
    title: "8. Customer Data & Ownership",
    content:
      "You retain full ownership of all data, leads, and content you submit to the platform. LeadForGrow acts solely as a data processor to provide the service and does not sell or claim ownership over your data."
  },
  {
    title: "9. Service Availability & Modifications",
    content:
      "We strive to maintain high availability but do not guarantee uninterrupted access. We may update, modify, or discontinue features at any time to improve performance, security, or compliance."
  },
  {
    title: "10. Third-Party Integrations",
    content:
      "The platform may integrate with third-party services such as WhatsApp, email providers, payment gateways, or analytics tools. LeadForGrow is not responsible for outages, data loss, or policy changes caused by third-party providers."
  },
  {
    title: "11. Intellectual Property",
    content:
      "All software, branding, trademarks, designs, and platform components are the exclusive property of LeadForGrow. You may not copy, reverse engineer, or resell any part of the service without written permission."
  },
  {
    title: "12. Limitation of Liability",
    content:
      "To the maximum extent permitted by law, LeadForGrow shall not be liable for any indirect, incidental, special, or consequential damages, including loss of revenue, data, or business opportunities arising from your use of the service."
  },
  {
    title: "13. Indemnification",
    content:
      "You agree to indemnify and hold harmless LeadForGrow from any claims, damages, or expenses arising from your use of the platform, violation of these terms, or misuse of customer data."
  },
  {
    title: "14. Termination",
    content:
      "We reserve the right to suspend or terminate your account if you violate these terms, misuse the platform, or engage in prohibited activities. Upon termination, access to the service will be revoked."
  },
  {
    title: "15. Governing Law",
    content:
      "These Terms of Service shall be governed by and interpreted in accordance with the laws of India, without regard to conflict of law principles."
  },
  {
    title: "16. Changes to Terms",
    content:
      "We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms."
  }
];


  return (
    <MarketingShell>
      <header className={`${SITE.top} ${SITE.paper} border-b ${SITE.rule} pb-14`}>
        <div className={`${SITE.wrap} max-w-4xl`}>
          <p className={SITE.label}>Legal · Terms of Service</p>
          <h1 className={`${SITE.serifXL} mt-6`}>Terms of Service</h1>
          <p className={`${SITE.prose} mt-5`}>Please read these terms carefully before using the LeadForGrow platform.</p>
          <p className="mt-6 font-mono text-xs text-[#6B6B63]">Last Updated: September 22, 2026</p>
        </div>
      </header>

      <div className={`${SITE.wrap} max-w-4xl py-14`}>
        {/* Contents */}
        <nav aria-label="Contents" className="border-t-2 border-[#0B1712] pt-4">
          <p className={SITE.label}>Contents</p>
          <ol className="mt-4 gap-x-10 text-[15px] sm:columns-2 [&>li]:mb-2 [&>li]:break-inside-avoid">
            {terms.map((t) => {
              const [n, name] = split(t.title);
              return (
                <li key={t.title}>
                  <a href={`#clause-${n}`} className="grid grid-cols-[32px_1fr] text-[#33352F] hover:text-[#1D4B3E]"><span className="font-mono text-[#A3A199]">{n}.</span>{name}</a>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Parties */}
        <section className={`mt-14 grid gap-6 border-t ${SITE.rule} pt-10 sm:grid-cols-[48px_1fr]`}>
          <span className={`${SITE.serif} text-2xl text-[#1D4B3E]`}>§</span>
          <div>
            <h2 className={`${SITE.serif} text-[1.6rem]`}>Who These Terms Are With</h2>
            <p className={`${SITE.prose} mt-4`}>
              {PRODUCT_STATEMENT} These Terms of Service are an agreement between you and {LEGAL_NAME}. In these Terms, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean {LEGAL_NAME}; &ldquo;LeadForGrow&rdquo; is the name of the platform and product we operate and is not a separate legal entity.
            </p>
            <div className="mt-6 bg-[#FAF9F6] p-5 text-sm leading-relaxed text-[#4B4D46]">
              <CompanyAddress variant="full" />
            </div>
          </div>
        </section>

        {/* Clauses with hanging numbers */}
        {terms.map((term) => {
          const [n, name] = split(term.title);
          return (
            <section key={term.title} id={`clause-${n}`} className={`mt-10 grid scroll-mt-28 gap-3 border-t ${SITE.rule} pt-8 sm:grid-cols-[48px_1fr] sm:gap-6`}>
              <h2 className="contents">
                <span className={`${SITE.serif} text-2xl text-[#1D4B3E]`}>{n}.</span>{' '}
                <span className={`${SITE.serif} text-[1.4rem] sm:col-start-2 sm:row-start-1`}>{name}</span>
              </h2>
              <p className={`${SITE.prose} sm:col-start-2`}>{term.content}</p>
            </section>
          );
        })}

        <footer className="mt-16 border-t-2 border-[#0B1712] pt-6 text-[15px] text-[#4B4D46]">
          Need clarification on our terms? Write to{' '}
          <a href="mailto:legal@leadforgrow.com" className="font-medium text-[#1D4B3E] underline underline-offset-4">legal@leadforgrow.com</a>.
        </footer>
      </div>
    </MarketingShell>
  );
}
