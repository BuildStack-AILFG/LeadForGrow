'use client';

import { MARKETING } from '@/lib/marketing/designTokens';

const STATS = [
  { value: 'Instant', label: 'Automated first replies' },
  { value: 'One inbox', label: 'WhatsApp, Instagram, Facebook & email' },
  { value: 'Every lead', label: 'Tracked from enquiry to close' },
  { value: 'Follow-ups', label: 'Automated reminders & sequences' },
];

export default function StatsSection() {
  return (
    <section id="why-us" className={MARKETING.section}>
      <div className={MARKETING.container}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={MARKETING.overline}>What Sets Us Apart?</p>
          <h2 className={`${MARKETING.h2} mt-3`}>
            Built to Help You Respond Faster and Follow Up Better
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="break-words text-[1.5rem] font-extrabold tracking-[-0.03em] text-emerald-700 md:text-[2rem] lg:text-[2.25rem]"
                style={{ fontFamily: 'var(--font-plus-jakarta)' }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-[#64748B] sm:text-[14px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className={`${MARKETING.body} mx-auto mt-6 max-w-2xl text-center`}>
          A simple, transparent, and powerful platform, built to scale with your business!
        </p>
      </div>
    </section>
  );
}
