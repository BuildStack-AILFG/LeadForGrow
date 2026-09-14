'use client';

import {
  ArrowRight,
  BarChart3,
  Repeat,
  LayoutGrid,
  MessagesSquare,
  Users,
  Workflow,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Repeat,
    title: 'Automated Follow-ups',
    description: 'Automate replies, follow-ups, and repetitive tasks.',
  },
  {
    icon: MessagesSquare,
    title: 'Unified Inbox',
    description: 'Manage Email, WhatsApp, Instagram, and more from one place.',
  },
  {
    icon: LayoutGrid,
    title: 'Smart CRM',
    description: 'Track leads, pipelines, and customer relationships effortlessly.',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Create powerful automations without writing code.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Monitor performance with real-time insights.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Assign leads, manage tasks, and work together seamlessly.',
  },
];

export default function OnePlatformSection({ onGetStarted, onBookDemo }) {
  return (
    <section className="relative flex min-h-[51vh] items-center overflow-hidden bg-white py-6 sm:py-8 lg:py-9">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#EEF8ED] via-white to-[#FAFAFA]" />
      <div className="pointer-events-none absolute -left-[8%] top-[20%] h-[240px] w-[240px] rounded-full bg-[#D2EDD0]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-[6%] bottom-[10%] h-[200px] w-[200px] rounded-full bg-[#c5e4c2]/25 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 xl:gap-12 lg:px-8">
        <div className="relative order-2 flex justify-center lg:order-1 lg:justify-start">
          <div className="relative w-full max-w-[440px] lg:max-w-[480px]">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-400/10 via-violet-400/8 to-emerald-400/12 blur-2xl" />
            <div className="absolute -inset-2 -z-10 rounded-[1.5rem] bg-gradient-to-tr from-[#D2EDD0]/40 to-transparent" />
            <img
              src="/tio.png"
              alt="LeadForGrow CRM dashboard — unified inbox, pipeline, and analytics"
              className="relative w-full h-auto object-contain drop-shadow-[0_20px_48px_rgba(15,23,42,0.1)]"
            />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2
            className="text-[1.65rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#111827] sm:text-[2rem] lg:text-[2.15rem]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Everything Your Business Needs.
            <br />
            <span className="text-[#166534]">One Intelligent Platform.</span>
          </h2>

          <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#64748B] sm:text-[15px]">
            LeadForGrow combines AI automation, customer communication, CRM, analytics, workflows,
            and sales management into one platform—so your team spends less time switching tools and
            more time closing deals.
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 sm:gap-y-3.5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C5E4C2] bg-[#EEF8ED] text-emerald-700">
                  <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-[#111827] sm:text-[14px]">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#64748B] sm:text-[13px]">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-6">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center rounded-xl bg-[#1a1a1a] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-colors hover:bg-black"
            >
              Start Free Trial
            </button>
            <button
              type="button"
              onClick={onBookDemo}
              className="group inline-flex items-center gap-2 rounded-xl border border-[#D4D4D4] bg-white px-5 py-3 text-[14px] font-medium text-[#1a1a1a] shadow-sm transition-colors hover:border-[#BDBDBD]"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
