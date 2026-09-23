'use client';

import Link from 'next/link';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';

/**
 * Illustrative use cases - NOT customer testimonials. No attributed customer quotes or photos appear here until real,
 * permissioned LeadForGrow customer testimonials exist; add those as a separate, clearly attributed block.
 */
const STORIES = [
  { quote: 'Automated replies can send every new lead a first response, even after hours.', role: 'Use case: D2C retail brand' },
  { quote: 'WhatsApp and Instagram enquiries arrive in one shared inbox, so nothing gets lost between channels.', role: 'Use case: growing agency' },
  { quote: 'Bookings and reminders can run automatically, so your team spends more time with customers than on spreadsheets.', role: 'Use case: restaurants' },
  { quote: 'Lead scores and pipeline stages help brokers see which property enquiries to follow up first.', role: 'Use case: real estate teams' },
];

export default function SuccessStoriesSection() {
  return (
    <section id="success-stories" className={MARKETING.section}>
      <div className={MARKETING.container}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={MARKETING.overline}>Use Cases</p>
          <h2 className={`${MARKETING.h2} mt-3`}>Built for Businesses Like Yours</h2>
          <p className={`${MARKETING.body} mt-4`}>
            Illustrative examples of how teams across industries can use LeadForGrow. These are not customer testimonials.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {STORIES.map((story) => (
            <div key={story.role} className={`${MARKETING.card} p-6 flex gap-4`}>
              <Lightbulb className="h-6 w-6 shrink-0 text-emerald-300" />
              <div className="min-w-0">
                <p className="text-[15px] leading-relaxed text-[#111827]">{story.quote}</p>
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-[13px] font-semibold text-[#64748B]">{story.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Share your own success story
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
