'use client';

import React from 'react';
import LandingNavbar from '@/app/components/landing/LandingNavbar';
import PremiumHero from '@/app/components/landing/PremiumHero';
import EcosystemSection from '@/app/components/landing/EcosystemSection';
import TrustedCompanies from '@/app/components/landing/TrustedCompanies';
import AutomationInActionSection from '@/app/components/landing/AutomationInActionSection';
import OnePlatformSection from '@/app/components/landing/OnePlatformSection';
import CustomerJourneySection from '@/app/components/landing/CustomerJourneySection';
import LeadForGrowComparisonSection from '@/app/components/landing/LeadForGrowComparisonSection';
import HomePricingSection from '@/app/components/landing/HomePricingSection';
import FAQSection from '@/app/components/landing/FAQSection';
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
    <div className="min-h-screen overflow-x-hidden bg-white">
      <LandingNavbar />
      <PremiumHero onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <EcosystemSection />
      <TrustedCompanies />
      <AutomationInActionSection />
      <OnePlatformSection onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <CustomerJourneySection onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <LeadForGrowComparisonSection />
      <HomePricingSection />
      <FAQSection onBookDemo={handleBookDemo} />
      <LandingCTA onGetStarted={handleGetStarted} onBookDemo={handleBookDemo} />
      <ScrollToTopButton />
    </div>
  );
}
