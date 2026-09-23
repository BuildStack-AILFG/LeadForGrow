import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { MARKETING } from '@/lib/marketing/designTokens';

export const metadata = { title: 'Compliance | LeadForGrow' };

export default function CompliancePage() {
  return (
    <MarketingShell>
      <section className={`${MARKETING.section} bg-slate-50`}>
        <div className={MARKETING.container}>
          <p className={MARKETING.overline}>Compliance</p>
          <h1 className={`${MARKETING.h1} mt-3 mb-5 max-w-2xl`}>Built for businesses that take data seriously.</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'GDPR', href: '/gdpr', desc: 'How we handle personal data' },
              { title: 'DPA', href: '/dpa', desc: 'Data processing agreement' },
              { title: 'Security', href: '/security', desc: 'Technical safeguards' },
              { title: 'Privacy', href: '/privacy', desc: 'Privacy policy' },
              { title: 'Accessibility', href: '/accessibility', desc: 'WCAG commitment' },
              { title: 'Cookie Policy', href: '/cookie-policy', desc: 'Cookie usage' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className={`${MARKETING.card} ${MARKETING.cardHover} p-6 block`}>
                <h2 className={MARKETING.h3}>{item.title}</h2>
                <p className="text-sm text-[#64748B] mt-2">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
