'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';

const HUBS = [
  {
    tag: 'Marketing Hub',
    title: 'Scale Marketing',
    description:
      'Automate customer engagement on WhatsApp & Instagram to drive leads and conversions.',
    href: '/products/automation',
    image: '/images/interakt-clone/Marketing-CRM_Image-1.webp',
    alt: 'Marketing Hub campaign dashboard',
  },
  {
    tag: 'Support Hub',
    title: 'Delight Customers',
    description:
      'Stay on top of every customer query with a unified team inbox built for WhatsApp, Instagram, and Email.',
    href: '/products/unified-inbox',
    image: '/images/interakt-clone/Support_Image.webp',
    alt: 'Support Hub unified inbox',
  },
  {
    tag: 'Sales CRM',
    title: 'Win Deals',
    description:
      'Capture leads, engage prospects, and close deals faster with a WhatsApp-first Sales CRM.',
    href: '/products/crm',
    image: '/images/interakt-clone/Sales-CRM_Image-1.webp',
    alt: 'Sales CRM pipeline dashboard',
  },
];

export default function ProductHubsSection() {
  return (
    <section id="hubs" className={MARKETING.section}>
      <div className={MARKETING.container}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={MARKETING.overline}>Everything You Need</p>
          <h2 className={`${MARKETING.h2} mt-3`}>
            Everything You Need to Win on WhatsApp, Instagram &amp; Email
          </h2>
          <p className={`${MARKETING.body} mt-4`}>
            LeadForGrow is a full-stack growth engine for marketing, sales, and support.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HUBS.map((hub) => (
            <div
              key={hub.tag}
              className={`${MARKETING.card} ${MARKETING.cardHover} overflow-hidden flex flex-col`}
            >
              <div className="h-44 w-full overflow-hidden bg-emerald-50">
                <img
                  src={hub.image}
                  alt={hub.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                  {hub.tag}
                </p>
                <h3 className={`${MARKETING.h3} mt-2`}>{hub.title}</h3>
                <p className={`${MARKETING.body} mt-2 flex-1`}>{hub.description}</p>
                <Link
                  href={hub.href}
                  className="group mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
