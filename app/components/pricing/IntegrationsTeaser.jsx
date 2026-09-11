import Link from 'next/link';
import { ArrowRight, Webhook } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, GmailIcon } from '@/app/automation/components/chat/BrandIcons';
import {
  MetaIcon,
  GoogleCalendarIcon,
  RazorpayIcon,
  StripeIcon,
  TwilioIcon,
  ZapierIcon,
  GoogleSheetsIcon,
  ShopifyIcon,
  HubSpotIcon,
  SalesforceIcon,
  CalendlyIcon,
  SlackIcon,
  ZohoIcon,
} from './IntegrationBrandIcons';
import { INTEGRATIONS, INTEGRATIONS_COUNT } from './pricingData';

const ICONS = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  email: GmailIcon,
  meta: MetaIcon,
  googleCalendar: GoogleCalendarIcon,
  razorpay: RazorpayIcon,
  stripe: StripeIcon,
  twilio: TwilioIcon,
  zapier: ZapierIcon,
  googleSheets: GoogleSheetsIcon,
  webhooks: Webhook,
  shopify: ShopifyIcon,
  hubspot: HubSpotIcon,
  salesforce: SalesforceIcon,
  calendly: CalendlyIcon,
  slack: SlackIcon,
  zoho: ZohoIcon,
};

/**
 * Bottom-of-pricing-page integrations band — deliberate close copy of
 * Interakt's own "Unifying Your Processes with 60+ Plug & Play integrations"
 * section (light-grey band, bold black two-line heading, teal pill CTA,
 * row of real logo chips) at the user's "100% same to same UI" request.
 * Every chip here uses a real brand-icon component (see
 * IntegrationBrandIcons.jsx) rather than plain colored text.
 */
export default function IntegrationsTeaser() {
  return (
    <section style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] leading-tight">
            Unifying Your Workflow with{' '}
            <span style={{ color: '#05A68B' }}>{INTEGRATIONS_COUNT}</span> Plug &amp; Play Integrations
          </h2>
          <Link
            href="/automation/settings/integrations"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#05A68B' }}
          >
            Explore Integrations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6">
          {INTEGRATIONS.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <span key={item.name} className="inline-flex items-center gap-2 text-[#111827]">
                <Icon size={22} style={{ color: item.color }} />
                <span className="text-base font-bold">{item.name}</span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
