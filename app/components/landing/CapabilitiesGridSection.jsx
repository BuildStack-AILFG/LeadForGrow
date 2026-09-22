'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';

const SUB_NAV = [
  { label: 'Features', href: '#features' },
  { label: 'AI Suite', href: '#ai-suite' },
  { label: 'Why us?', href: '#why-us' },
  { label: 'Industries', href: '#industries' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Success Stories', href: '#success-stories' },
];

const CAPABILITIES = [
  {
    tag: 'AI Agent',
    title: 'Turn Conversations into Sales with AI Agents',
    description:
      'Deploy AI agents that answer queries, qualify leads, and recommend products like a human assistant.',
    href: '/products/ai',
    bg: '#FCE7F3',
    tagColor: '#DB2777',
    image: '/images/interakt-clone/Group-1430106369.webp',
  },
  {
    tag: 'Support',
    title: 'Launch WhatsApp Chatbots in Minutes',
    description:
      "Automate common customer queries with LeadForGrow's easy-to-use, drag-and-drop, no-code chatbot builder.",
    href: '/products/automation',
    bg: '#D1FAE5',
    tagColor: '#059669',
    image: '/images/interakt-clone/chatbot-builder.gif',
  },
  {
    tag: 'Marketing',
    title: 'Maximize Leads, Optimize Sales',
    description:
      'Capture leads instantly from ads, forms, and website chat, then route them straight into your CRM.',
    href: '/products/crm',
    bg: '#FEF3C7',
    tagColor: '#D97706',
    image: '/images/interakt-clone/Maximize-Leads-Optimize-Sales3x_-1.webp',
  },
  {
    tag: 'Marketing',
    title: 'Automate Instagram, Win Customers',
    description:
      'Reply to Instagram DMs and comments automatically, and follow up with every new conversation.',
    href: '/products/unified-inbox',
    bg: '#EDE9FE',
    tagColor: '#7C3AED',
    image: '/images/interakt-clone/Group-1430106237.webp',
  },
  {
    tag: 'Support',
    title: 'Streamline Queries, Boost Efficiency',
    description:
      'Manage WhatsApp, Instagram, and Email queries with an Omnichannel Inbox for zero missed messages.',
    href: '/products/unified-inbox',
    bg: '#DBEAFE',
    tagColor: '#2563EB',
    image: '/images/interakt-clone/Manage-Customer-Interactions-with-Ease-2.webp',
  },
  {
    tag: 'Sales CRM',
    title: 'Organize Leads, Track Success',
    description:
      'Centralize leads from WhatsApp, workflows, forms, or manual entry with auto-assigned owners and statuses.',
    href: '/products/crm',
    bg: '#CCFBF1',
    tagColor: '#0D9488',
    image: '/images/interakt-clone/Organize-Leads-Track-Success-1-1024x693.webp',
  },
  {
    tag: 'Marketing',
    title: 'Broadcast Messages to Thousands in a Single Click',
    description:
      'Scale your business communication effortlessly and reach thousands of customers in one click.',
    href: '/products/automation',
    bg: '#FEF9C3',
    tagColor: '#CA8A04',
    image: '/images/interakt-clone/Broadcast-WhatsApp-Messages-to-1000s-in-a-single-click3x_-1.webp',
  },
  {
    tag: 'Commerce',
    title: 'Bills, Payments & Meetings in One Place',
    description:
      'Share bills, collect payments, and schedule meetings — all without leaving the conversation.',
    href: '/pricing',
    bg: '#FFE4E6',
    tagColor: '#E11D48',
    image: '/images/interakt-clone/Launch-WhatsApp-Store-Payments-1.webp',
  },
  {
    tag: 'Analytics',
    title: 'Campaign & Team Analytics',
    description:
      'Track team performance, measure impact, and optimize your campaigns with real-time insights.',
    href: '/products/automation',
    bg: '#E0E7FF',
    tagColor: '#4338CA',
    image: '/images/interakt-clone/Campaign-Team-Analytics-3.webp',
  },
];

export default function CapabilitiesGridSection() {
  return (
    <section id="features" className={MARKETING.section}>
      <div className={MARKETING.container}>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 border-b border-[#E2E8F0] pb-6">
          {SUB_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold text-[#64748B] transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className={MARKETING.overline}>Power-Packed Suite</p>
          <h2 className={`${MARKETING.h2} mt-3`}>
            Powerful Capabilities That Maximize Your Reach
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ tag, title, description, href, bg, tagColor, image }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: bg }}
            >
              <div className="p-6 pb-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: tagColor }}>
                  {tag}
                </p>
                <h3 className="mt-2 text-[16px] font-bold leading-snug text-[#111827]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{description}</p>
                <span
                  className="mt-3 inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2"
                  style={{ color: tagColor }}
                >
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <div className="mt-4 flex h-44 w-full items-end justify-center overflow-hidden px-5 pb-5">
                <img src={image} alt={title} className="max-h-full max-w-full object-contain" loading="lazy" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
