'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';

const INDUSTRIES = [
  {
    title: 'Banking & Finance',
    description: 'Leverage powerful automation features and grow your business using LeadForGrow.',
    image: '/images/interakt-clone/industries/banking-finance.webp',
    href: '/contact',
  },
  {
    title: 'Travel & Tourism',
    description: 'Fast-track bookings, share details, and set up 24/7 automated FAQs using LeadForGrow.',
    image: '/images/interakt-clone/industries/travel-tourism.webp',
    href: '/contact',
  },
  {
    title: 'Beauty & Cosmetics',
    description: 'See how top brands acquire, convert, and engage shoppers in a competitive market.',
    image: '/images/interakt-clone/industries/beauty-cosmetics.webp',
    href: '/contact',
  },
  {
    title: 'Education',
    description: 'Get more enrollments for your courses and keep students informed automatically.',
    image: '/images/interakt-clone/industries/education.webp',
    href: '/solutions/education',
  },
  {
    title: 'Spas & Salons',
    description: 'Grow your spa & salon business through scheduling, payments, and reminders.',
    image: '/images/interakt-clone/industries/spas-salons.webp',
    href: '/contact',
  },
  {
    title: 'E-commerce',
    description: 'Scale up your D2C brand with end-to-end commerce and catalog sharing.',
    image: '/images/interakt-clone/industries/ecommerce.webp',
    href: '/contact',
  },
  {
    title: 'Restaurant & Food Businesses',
    description: 'Streamline orders, payments, menu sharing, and more for faster customer interactions.',
    image: '/images/interakt-clone/industries/restaurant-food.webp',
    href: '/solutions/restaurants',
  },
  {
    title: 'Health & Wellness',
    description: 'Improve patient experiences with automated appointment bookings, updates, and offers.',
    image: '/images/interakt-clone/industries/health-wellness.webp',
    href: '/solutions/healthcare',
  },
  {
    title: 'Home Decor & Furnishing',
    description: 'Boost your home decor and furnishing business through end-to-end commerce.',
    image: '/images/interakt-clone/industries/home-decor.webp',
    href: '/contact',
  },
  {
    title: 'Marketing Agencies',
    description: 'Help your clients stand out and manage every account from one platform.',
    image: '/images/interakt-clone/industries/marketing-agencies.webp',
    href: '/solutions/agencies',
  },
  {
    title: 'Automotive Industry',
    description: 'From promotions to service bookings, make customer communication simple and seamless.',
    image: '/images/interakt-clone/industries/automotive.webp',
    href: '/contact',
  },
  {
    title: 'Real Estate',
    description: 'Acquire, engage, convert prospects, and retain customers effortlessly.',
    image: '/images/interakt-clone/industries/real-estate.webp',
    href: '/solutions/real-estate',
  },
  {
    title: 'Freelancers & Consultants',
    description: 'Create personalized customer journeys and manage every client effortlessly.',
    image: '/images/interakt-clone/industries/freelancer-consultants.webp',
    href: '/solutions/startups',
  },
];

export default function IndustriesGridSection() {
  return (
    <section id="industries" className={`${MARKETING.section} bg-[#FAFDFA]`}>
      <div className={MARKETING.container}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={MARKETING.overline}>Industries</p>
          <h2 className={`${MARKETING.h2} mt-3`}>Built for Any Industry</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map(({ title, description, image, href }) => (
            <Link
              key={title}
              href={href}
              className={`group ${MARKETING.card} ${MARKETING.cardHover} overflow-hidden flex flex-col`}
            >
              <div className="w-full overflow-hidden bg-[#FAFDFA]" style={{ aspectRatio: '1024 / 507' }}>
                <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1 p-5">
                <h3 className="text-[15px] font-bold text-[#111827]">{title}</h3>
                <p className="mt-1 text-[13px] leading-snug text-[#64748B]">{description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-700">
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
