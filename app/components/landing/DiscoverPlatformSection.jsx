'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, LayoutGrid, Users, Compass, UserCircle } from 'lucide-react';
import { LANDING } from './landingStyles';

const CARDS = [
  {
    icon: UserCircle,
    title: 'Our founders',
    description:
      'Meet S.Singh, Honey Singh, and S.S Chauhan — the co-founders building LeadForGrow.',
    href: '/founders',
    linkText: 'Meet the team',
  },
  {
    icon: Users,
    title: 'About us',
    description:
      'Learn how LeadForGrow helps businesses across India capture, qualify, and convert leads with AI-powered automation.',
    href: '/about',
    linkText: 'Learn more about LeadForGrow',
  },
  {
    icon: LayoutGrid,
    title: 'Platform overview',
    description:
      'Explore our unified CRM — WhatsApp inbox, lead pipeline, automation rules, and analytics in one operating system.',
    href: '/product/crm',
    linkText: 'Explore the platform',
  },
  {
    icon: Compass,
    title: 'Why LeadForGrow?',
    description:
      'See why high-growth teams choose LeadForGrow over spreadsheets, generic CRMs, and disconnected tools.',
    href: '/resources/how-it-works',
    linkText: 'See how it works',
  },
];

export default function DiscoverPlatformSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] bg-cover bg-right"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=60)',
        }}
        aria-hidden
      />

      <div className={`relative ${LANDING.container}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 max-w-2xl"
        >
          <h2 className={LANDING.heading}>Discover LeadForGrow</h2>
          <p className={`mt-4 ${LANDING.subheading}`}>
            Everything you need to know about our platform, team, and approach to lead automation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`${LANDING.card} ${LANDING.cardHover} p-6 md:p-7 flex flex-col`}
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center text-[#FF5C35]">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-[#111827]">{card.title}</h3>
                <p className={`mt-3 flex-1 text-[15px] leading-relaxed text-[#4B5563]`}>
                  {card.description}
                </p>
                <Link href={card.href} className={`mt-6 ${LANDING.linkArrow}`}>
                  {card.linkText}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
