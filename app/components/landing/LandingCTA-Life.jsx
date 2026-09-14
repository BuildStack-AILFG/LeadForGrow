'use client';

import { ArrowRight } from 'lucide-react';

export default function LandingCTA({ onGetStarted, onBookDemo }) {
  return (
    <section className="relative overflow-hidden bg-[#064E3B] py-16 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute -left-[10%] top-[10%] h-[320px] w-[320px] rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-[8%] bottom-[5%] h-[280px] w-[280px] rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2
          className="text-[1.85rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem]"
          style={{ fontFamily: 'var(--font-plus-jakarta)' }}
        >
          Turn Conversations into Revenue
        </h2>
        <p className="mt-4 text-[15px] font-semibold text-emerald-200 sm:text-[17px]">
          Marketing. Sales. Support. Automation. AI.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-emerald-100/80">
          Everything you need to grow on WhatsApp, Instagram, and Email, in one powerful platform.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-semibold text-[#064E3B] transition-colors hover:bg-emerald-50"
          >
            Start Free Trial
          </button>
          <button
            type="button"
            onClick={onBookDemo}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            Book a Demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">
          Built on WhatsApp Business API · Instagram · Email
        </p>
      </div>
    </section>
  );
}
