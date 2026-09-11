'use client';

import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';

const TRUST_POINTS = ['No credit card required', 'Setup in under 5 minutes', 'Cancel anytime'];

export default function PricingFinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857] text-white">
      {/* Curved divider — softens the hard edge into the white FAQ section above */}
      <svg
        className="absolute top-0 left-0 w-full text-white"
        style={{ height: 48 }}
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,0 C360,48 1080,48 1440,0 L1440,0 L0,0 Z" fill="currentColor" />
      </svg>

      {/* Dot-grid texture — subtle, low-opacity SVG pattern for depth */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="cta-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cta-dot-grid)" />
      </svg>

      {/* Soft glow blobs */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #34D399 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6EE7B7 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className={`${MARKETING.section} relative`}>
        <div className={`${MARKETING.containerNarrow} text-center`}>
          {/* Connected-nodes badge — a small line-art motif echoing the
              "unified inbox / automation" product story, not just plain text. */}
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <svg viewBox="0 0 32 32" className="h-7 w-7 text-emerald-200" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="3" fill="currentColor" />
              <circle cx="24" cy="8" r="3" fill="currentColor" />
              <circle cx="16" cy="24" r="3" fill="currentColor" />
              <path d="M10.5 9.5L21.5 9.5M9.5 10.5L15 21.5M22.5 10.5L17 21.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            Your leads are already expensive. Losing them costs even more.
          </h2>
          <p className="mt-4 text-base text-emerald-100/90 leading-relaxed">
            LeadForGrow helps your team respond faster, follow up automatically, and convert more revenue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Book Demo
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {TRUST_POINTS.map((point) => (
              <span key={point} className="inline-flex items-center gap-1.5 text-sm text-emerald-100/80">
                <Check className="h-4 w-4 text-emerald-300" strokeWidth={2.5} />
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
