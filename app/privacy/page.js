import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { LEGAL_NAME, PRODUCT_STATEMENT } from '@/lib/company';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How ScaleDesk Technology Private Limited collects, uses and protects personal data on the LeadForGrow platform.',
  alternates: { canonical: 'https://www.leadforgrow.com/privacy' },
};

const anchor = (title) => title.replace(/^\d+\.\s*/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function PrivacyPolicy() {
 const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly, including name, email address, phone number, business details, billing information, and data you submit through forms, websites, and automations created on the platform."
  },
  {
    title: "2. Lead & Business Data",
    content:
      "All leads, contacts, and business data captured through LeadForGrow remain your property. We process this data solely to provide the services and do not sell or share lead data with third parties."
  },
  {
    title: "3. How We Use Information",
    content:
      "We use collected information to operate, maintain, and improve the platform, provide support, send service-related communications, process payments, and ensure platform security."
  },
  {
    title: "4. Communication & Notifications",
    content:
      "We may contact you regarding account activity, billing, security updates, product changes, or support inquiries. Marketing communications can be opted out at any time."
  },
  {
    title: "5. Cookies & Tracking Technologies",
    content:
      "We use cookies and similar technologies to analyze usage patterns, improve performance, and personalize user experience. You can control cookie behavior through your browser settings."
  },
  {
    title: "6. Third-Party Services",
    content:
      "We may share limited data with trusted third-party providers such as hosting services, email delivery providers, WhatsApp APIs, analytics platforms, and payment processors strictly for service operation."
  },
  {
    title: "7. Data Security",
    content:
      "We implement industry-standard security practices including access controls, encryption, and monitoring. However, no system is completely secure, and we cannot guarantee absolute protection."
  },
  {
    title: "8. Data Retention",
    content:
      "We retain personal and business data only for as long as necessary to provide services or comply with legal obligations. Upon account termination, data may be deleted after a reasonable retention period."
  },
  {
    title: "9. User Rights",
    content:
      "You have the right to access, update, or delete your personal information. Requests can be made by contacting our support or privacy team."
  },
  {
    title: "10. International Data Transfers",
    content:
      "Your data may be processed or stored on servers located outside your country. We take reasonable steps to ensure appropriate data protection safeguards are in place."
  },
  {
    title: "11. Children’s Privacy",
    content:
      "LeadForGrow is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors."
  },
  {
    title: "12. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Updates will be reflected on this page, and continued use of the service indicates acceptance of the revised policy."
  },
  {
    title: "13. Contact Information",
    content:
      "If you have questions or concerns about this Privacy Policy, you may contact us at privacy@leadforgrow.com."
  }
];

  return (
    <MarketingShell>
      <header className={`${SITE.top} border-b-2 border-[#0B1712] pb-12`}>
        <div className={`${SITE.wrap} grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end`}>
          <div>
            <p className={SITE.label}>Legal</p>
            <h1 className={`${SITE.serifXL} mt-6`}>Privacy Policy</h1>
            <p className={`${SITE.prose} mt-5 max-w-2xl`}>Your data security and privacy are our top priorities. Learn how we handle your information.</p>
          </div>
          <dl className="text-sm">
            <div className={`flex justify-between border-b ${SITE.rule} py-2`}><dt className="text-[#6B6B63]">Last updated</dt><dd className="text-[#0B1712]">September 21, 2026</dd></div>
            <div className={`flex justify-between border-b ${SITE.rule} py-2`}><dt className="text-[#6B6B63]">Contact</dt><dd><a href="mailto:privacy@leadforgrow.com" className={SITE.link}>privacy@leadforgrow.com</a></dd></div>
          </dl>
        </div>
      </header>

      <div className={`${SITE.wrap} grid gap-14 py-14 lg:grid-cols-[240px_1fr]`}>
        <nav aria-label="Contents" className="lg:sticky lg:top-28 lg:self-start">
          <p className={SITE.label}>On this page</p>
          <ol className="mt-4 space-y-1.5 text-sm">
            <li><a href="#who-we-are" className="text-[#4B4D46] hover:text-[#1D4B3E]">Who We Are</a></li>
            {sections.map((sec) => (
              <li key={sec.title}><a href={`#${anchor(sec.title)}`} className="text-[#4B4D46] hover:text-[#1D4B3E]">{sec.title}</a></li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-[720px]">
          <section id="who-we-are" className="scroll-mt-28 bg-[#FAF9F6] p-6 sm:p-8">
            <h2 className={`${SITE.serif} text-[1.6rem]`}>Who We Are</h2>
            <p className={`${SITE.prose} mt-4`}>
              {PRODUCT_STATEMENT} In this Privacy Policy, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean {LEGAL_NAME}. We are the data controller for account and platform data; for customer data you process through LeadForGrow, we act as a data processor.
            </p>
            <div className={`mt-6 border-t ${SITE.rule} pt-5 text-sm leading-relaxed text-[#4B4D46]`}>
              <CompanyAddress variant="full" />
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.title} id={anchor(section.title)} className={`mt-12 scroll-mt-28 border-t ${SITE.rule} pt-8`}>
              <h2 className={`${SITE.serif} text-[1.45rem]`}>{section.title}</h2>
              <p className={`${SITE.prose} mt-4`}>{section.content}</p>
            </section>
          ))}

          <footer className="mt-16 border-t-2 border-[#0B1712] pt-6 text-[15px] text-[#4B4D46]">
            Questions about our privacy policy? Write to{' '}
            <a href="mailto:privacy@leadforgrow.com" className="font-medium text-[#1D4B3E] underline underline-offset-4">privacy@leadforgrow.com</a>.
            {' '}See also our <Link href="/cookie-policy" className="font-medium text-[#1D4B3E] underline underline-offset-4">Cookie Policy</Link> and{' '}
            <Link href="/gdpr" className="font-medium text-[#1D4B3E] underline underline-offset-4">GDPR &amp; Data Protection</Link>.
          </footer>
        </article>
      </div>
    </MarketingShell>
  );
}
