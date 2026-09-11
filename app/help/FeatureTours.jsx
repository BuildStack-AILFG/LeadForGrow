'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import { getTourList } from '@/app/automation/components/shared/tour/registry';

/**
 * "Restart a tour" surface for the Guide (spec section 3: "ability to
 * restart a tour"). Full spotlight tours only live on their own page (they
 * need real DOM targets to spotlight), so this links there — the compass
 * icon in the app is what actually replays it.
 */
export default function FeatureTours() {
  const tours = getTourList();

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Guided product tours</h2>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
        {tours.map((tour) => (
          <Link
            key={tour.id}
            href={tour.path}
            className="group flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{tour.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{tour.steps.length} steps · Walks you through the page live</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 shrink-0">
              Open & restart <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5" /> Every page also has a quick "Need help?" button (bottom right) to replay its intro any time.
      </p>
    </section>
  );
}
