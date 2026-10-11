import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';

const INDUSTRIES = [
  {
    title: 'Banking & Finance',
    description: 'Leverage powerful automation features and grow your business using LeadForGrow.',
    image: '/images/site/3d/bank.webp',
    href: '/contact',
  },
  {
    title: 'Travel & Tourism',
    description: 'Fast-track bookings, share details, and set up 24/7 automated FAQs using LeadForGrow.',
    image: '/images/site/3d/suitcase.webp',
    href: '/contact',
  },
  {
    title: 'Beauty & Cosmetics',
    description: 'See how top brands acquire, convert, and engage shoppers in a competitive market.',
    image: '/images/site/3d/mirror.webp',
    href: '/contact',
  },
  {
    title: 'Education',
    description: 'Get more enrollments for your courses and keep students informed automatically.',
    image: '/images/site/3d/graduated.webp',
    href: '/solutions/education',
  },
  {
    title: 'Spas & Salons',
    description: 'Grow your spa & salon business through scheduling, payments, and reminders.',
    image: '/images/site/3d/hair-dryer.webp',
    href: '/contact',
  },
  {
    title: 'E-commerce',
    description: 'Scale up your D2C brand with end-to-end commerce and catalog sharing.',
    image: '/images/site/3d/online-shopping.webp',
    href: '/contact',
  },
  {
    title: 'Restaurant & Food Businesses',
    description: 'Streamline orders, payments, menu sharing, and more for faster customer interactions.',
    image: '/images/site/3d/cheese-burger.webp',
    href: '/solutions/restaurants',
  },
  {
    title: 'Health & Wellness',
    description: 'Improve patient experiences with automated appointment bookings, updates, and offers.',
    image: '/images/site/3d/medical-kit.webp',
    href: '/solutions/healthcare',
  },
  {
    title: 'Home Decor & Furnishing',
    description: 'Boost your home decor and furnishing business through end-to-end commerce.',
    image: '/images/site/3d/home.webp',
    href: '/contact',
  },
  {
    title: 'Automotive Industry',
    description: 'From promotions to service bookings, make customer communication simple and seamless.',
    image: '/images/site/3d/car-repair.webp',
    href: '/contact',
  },
  {
    title: 'Real Estate',
    description: 'Acquire, engage, convert prospects, and retain customers effortlessly.',
    image: '/images/site/3d/apartment.webp',
    href: '/solutions/real-estate',
  },
  {
    title: 'Freelancers & Consultants',
    description: 'Create personalized customer journeys and manage every client effortlessly.',
    image: '/images/site/3d/working-desk.webp',
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
              <div
                className="flex w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_55%,rgba(16,185,129,0.16),transparent_62%)] p-6"
                style={{ aspectRatio: '800 / 396' }}
              >
                <img
                  src={image}
                  alt={title}
                  className="h-full w-auto max-w-full object-contain drop-shadow-[0_14px_22px_rgba(15,23,42,0.18)] transition-transform duration-300 group-hover:-translate-y-1"
                  loading="lazy"
                />
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
