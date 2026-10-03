'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { LANDING } from './landingStyles';

const TABS = [
  {
    id: 'meaningful',
    label: 'Meaningful work',
    title: 'Work that matters',
    description:
      'Every feature we build solves a real problem — lost leads, slow follow-ups, and disconnected tools. Your work directly helps businesses grow revenue.',
    bullets: [
      'Ship features used by thousands of sales teams daily',
      'See direct impact on customer conversion rates',
      'Build for real businesses, not vanity metrics',
    ],
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'automation',
    label: 'Smart automation',
    title: 'Automation that converts',
    description:
      'LeadForGrow automates the repetitive work — routing, follow-ups, and reminders — so your team focuses on conversations that close deals.',
    bullets: [
      'Rule-based routing to the right agent instantly',
      'Timed WhatsApp sequences with human approval',
      'AI-drafted replies that match your brand voice',
    ],
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'collaboration',
    label: 'Team collaboration',
    title: 'Built for teams',
    description:
      'Assign leads, track performance, and coach your team from one dashboard. Everyone sees the same pipeline, the same context, the same history.',
    bullets: [
      'Role-based access and team permissions',
      'Real-time inbox with assignment tracking',
      'Performance reports by agent and source',
    ],
    image:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'growth',
    label: 'Scale with confidence',
    title: 'Grow without limits',
    description:
      'From 10 leads a day to 10,000 — LeadForGrow scales with your business. Multi-location support, agency white-label, and enterprise security included.',
    bullets: [
      'Agency mode for managing multiple clients',
      'API and webhook integrations on Pro plans',
      'Role-based access and workspace data isolation',
    ],
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'support',
    label: 'Dedicated support',
    title: 'Support when you need it',
    description:
      'Free onboarding, live chat support, and dedicated success managers on Growth plans. We help you go live in 15 minutes and stay productive.',
    bullets: [
      'Free onboarding on all paid plans',
      'Live chat and email support',
      'Dedicated success manager on Growth+',
    ],
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
  },
];

export default function JourneyTabsSection() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section className={`${LANDING.section} bg-white`} id="platform">
      <div className={LANDING.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-3xl"
        >
          <h2 className={LANDING.heading}>Your journey starts here</h2>
          <p className={`mt-4 ${LANDING.body}`}>
            LeadForGrow is the complete revenue operating system for businesses that take lead management seriously. Explore what makes our platform different.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Vertical tabs */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(i)}
                className={`shrink-0 rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 border-b-2 ${
                  active === i
                    ? 'border-[#FF5C35] bg-white text-[#33475B] shadow-sm'
                    : 'border-transparent bg-[#F5F8FA] text-[#516f90] hover:text-[#33475B]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <h3 className={LANDING.headingSm}>{tab.title}</h3>
                <p className={`mt-4 ${LANDING.body}`}>{tab.description}</p>
                <ul className="mt-6 space-y-3">
                  {tab.bullets.map((item) => (
                    <li key={item} className={LANDING.checkItem}>
                      <span className="enterprise-check">
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Image */}
          <div className="lg:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden rounded-2xl"
              >
                <Image
                  src={tab.image}
                  alt={tab.title}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
