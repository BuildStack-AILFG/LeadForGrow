'use client';

import React from 'react';
import SmoothScroll from '@/app/components/landing/SmoothScroll';
import LandingNavbar from '@/app/components/landing/LandingNavbar';
import PremiumHero from '@/app/components/landing/PremiumHero';
import TrustedCompanies from '@/app/components/landing/TrustedCompanies';
import ProductHubsSection from '@/app/components/landing/ProductHubsSection';
import AutomationInActionSection from '@/app/components/landing/AutomationInActionSection';
import CapabilitiesGridSection from '@/app/components/landing/CapabilitiesGridSection';
import AICapabilitiesSection from '@/app/components/landing/AICapabilitiesSection';
import StatsSection from '@/app/components/landing/StatsSection';
import IntegrationsTeaser from '@/app/components/pricing/IntegrationsTeaser';
import IndustriesGridSection from '@/app/components/landing/IndustriesGridSection';
import HomePricingSection from '@/app/components/landing/HomePricingSection';
import SuccessStoriesSection from '@/app/components/landing/SuccessStoriesSection';
import LandingCTA from '@/app/components/landing/LandingCTA';
import ScrollToTopButton from '@/app/components/landing/ScrollToTopButton';
import BookDemoModal, { openBookDemoPopup } from '@/app/components/landing/BookDemoModal';

export default function LeadForGrowHeroPage() {
  const handleGetStarted = () => {
    const userId = localStorage.getItem('userid');
    window.location.href = userId ? '/automation' : '/user/register';
  };

  const handleBookDemo = () => {
    const popup = openBookDemoPopup();
    if (popup) {
      popup.focus();
    }
  };

  return (
    <SmoothScroll>
    <div className="min-h-screen overflow-x-hidden bg-white">
      <LandingNavbar />
      <PremiumHero onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <TrustedCompanies />
      <ProductHubsSection />
      <AutomationInActionSection />
      <CapabilitiesGridSection />
      <AICapabilitiesSection onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <StatsSection />
      <div id="integrations">
        <IntegrationsTeaser />
      </div>
      <IndustriesGridSection />
      <HomePricingSection />
      <SuccessStoriesSection />
      <LandingCTA onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <ScrollToTopButton />
    </div>
    </SmoothScroll>
  );
}
