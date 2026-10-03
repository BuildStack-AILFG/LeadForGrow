import Link from 'next/link';
import { ArrowRight, Plug, Code2, MessagesSquare } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { INTEGRATIONS_COUNT } from '@/app/components/pricing/pricingData';
import { SITE } from '@/lib/marketing/designTokens';
import IntegrationDirectory from './IntegrationDirectory';

export const metadata = {
  title: 'Integrations',
  description: 'Connect LeadForGrow to WhatsApp, Instagram, Gmail, Meta Lead Ads, Google Calendar, Razorpay and more — or send leads in from any website with webhooks.',
  alternates: { canonical: 'https://www.leadforgrow.com/products/integrations' },
};

export default function IntegrationsProductPage() {
  return (
    <MarketingShell>
      {/* Directory-style header */}
      <section className="border-b border-[#E4E7E1] bg-[#F5F6F2] pt-16 sm:pt-20">
        <div className={`${SITE.wrap} grid gap-10 py-16 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:py-20`}>
          <div>
            <p className={SITE.eyebrow}>Integrations directory</p>
            <h1 className={`${SITE.display} mt-4`}>{INTEGRATIONS_COUNT} tools your business already uses.</h1>
            <p className={`${SITE.lead} mt-6 max-w-xl`}>
              Messages, ad leads, meetings and payments flow into one CRM — so nobody copies data between apps again.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/api-docs" className={SITE.btnGhost}>Developer docs</Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className={SITE.wrap}>
          <IntegrationDirectory />
        </div>
      </section>

      {/* Three ways to connect */}
      <section className="bg-[#0B1712] py-20 text-white">
        <div className={SITE.wrap}>
          <h2 className="max-w-xl font-[family-name:var(--font-plus-jakarta)] text-[1.75rem] font-bold leading-tight sm:text-[2.25rem]">Three ways to connect.</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {[
              [Plug, 'Built-in', 'Paste your credentials once in Settings → Integrations. Connection status and the last successful sync are shown on the page.'],
              [Code2, 'Webhooks', 'Point your website, form builder or another app at your webhook URL. Leads arrive with their source.', '/api-docs'],
              [MessagesSquare, 'Ask us', 'Need a tool that is not here, or a custom sync? Tell us what you use and we will scope it with you.', '/contact'],
            ].map(([Icon, t, d, href]) => (
              <div key={t}>
                <Icon className="h-6 w-6 text-[#34D399]" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{d}</p>
                {href && <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#34D399] hover:underline">Learn more <ArrowRight className="h-3.5 w-3.5" /></Link>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
