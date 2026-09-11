import MarketingShell from '@/app/components/marketing/MarketingShell';
import PricingHero from '@/app/components/pricing/PricingHero';
import PricingTable from '@/app/components/pricing/PricingTable';
import PricingAddOns from '@/app/components/pricing/PricingAddOns';
import IntegrationsTeaser from '@/app/components/pricing/IntegrationsTeaser';
import PricingFAQ from '@/app/components/pricing/PricingFAQ';
import PricingFinalCTA from '@/app/components/pricing/PricingFinalCTA';

export const metadata = {
  title: 'Pricing — LeadForGrow',
  description: 'WhatsApp, Instagram & Email automation with affordable plans. Every plan includes Email — even your free trial.',
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className="bg-white">
        <PricingHero />
        <PricingTable />
        <PricingAddOns />
        <IntegrationsTeaser />
        <PricingFAQ />
        <PricingFinalCTA />
      </main>
    </MarketingShell>
  );
}
