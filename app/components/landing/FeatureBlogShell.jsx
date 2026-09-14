'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import LandingNavbar from '@/app/components/landing/LandingNavbar';
import BookDemoModal, { openBookDemoPopup } from '@/app/components/landing/BookDemoModal';

export default function FeatureBlogShell({ children, backHref = '/blog', backLabel = 'Back to features' }) {
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);

  const handleGetStarted = () => {
    const userId = localStorage.getItem('userid');
    window.location.href = userId ? '/automation' : '/register';
  };

  const handleBookDemo = () => {
    const popup = openBookDemoPopup();
    if (popup) {
      popup.focus();
      return;
    }
    setIsBookDemoOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <LandingNavbar />

      <div className="mx-auto max-w-3xl px-4 pt-28 pb-8 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 text-sm font-medium text-[#64748B] transition-colors hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>
      </div>

      {children}

      <section className="border-t border-[#E2E8F0] bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Get started</p>
          <h2
            className="mt-3 text-2xl font-extrabold tracking-tight text-[#111827] sm:text-[1.75rem]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Ready to try LeadForGrow?
          </h2>
          <p className="mt-3 text-[15px] text-[#64748B]">
            Start your free trial or book a demo to see how it works for your business.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleBookDemo}
              className="group inline-flex items-center gap-2 rounded-xl bg-[#111827] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-black"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={handleGetStarted}
              className="rounded-xl border border-[#D4D4D4] bg-white px-6 py-3 text-[14px] font-semibold text-[#111827] transition-colors hover:border-emerald-300 hover:bg-[#ECFDF5]"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      <BookDemoModal open={isBookDemoOpen} onClose={() => setIsBookDemoOpen(false)} />
    </div>
  );
}

export function FeatureHighlights({ items }) {
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#FAFDFA] px-4 py-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
            <Check className="h-3 w-3 text-emerald-700" strokeWidth={2.5} />
          </span>
          <span className="text-[14px] text-[#374151]">{item}</span>
        </li>
      ))}
    </ul>
  );
}
