'use client';

import { useEffect, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { MARKETING } from '@/lib/marketing/designTokens';
import { goToGetStarted, openBookDemo } from './homeActions';

const AI_POINTS = [
  { label: 'Write, Launch, and Optimize with AI Copilot', image: '/images/site/3d/ai-vr.webp' },
  { label: 'AI Chatbots That Drive Conversions', image: '/images/site/3d/smiling-robot.webp' },
  { label: 'Forms That Convert Conversations into Leads', image: '/images/site/3d/clipboard.webp' },
  { label: 'Go Beyond Keywords with Intent-Based Automation', image: '/images/site/3d/target.webp' },
  { label: 'Ready-to-Send Templates, Powered by AI', image: '/images/site/3d/chat-bubble.webp' },
];

export default function AICapabilitiesSection({ onGetStarted = goToGetStarted, onBookDemo = openBookDemo } = {}) {
  const [active, setActive] = useState(0);

  // Warm the other tabs' images once the page is idle so switching tabs shows them instantly.
  useEffect(() => {
    const warm = () => AI_POINTS.slice(1).forEach(({ image }) => { new Image().src = image; });
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="ai-suite" className={`${MARKETING.section} bg-[#FAFDFA]`}>
      <div className={MARKETING.container}>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className={MARKETING.overline}>AI Suite</p>
            <h2 className={`${MARKETING.h2} mt-3`}>
              Elevate your CX with an AI-Powered Platform
            </h2>

            <ul className="mt-6 space-y-4">
              {AI_POINTS.map((point, i) => (
                <li key={point.label}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      active === i ? 'bg-emerald-50' : 'hover:bg-emerald-50/50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        active === i ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] font-semibold text-[#111827]">{point.label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <p className={`${MARKETING.body} mt-6`}>
              A simple, transparent, and powerful full-stack platform.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" onClick={onGetStarted} className={MARKETING.btnPrimary}>
                Start Free Trial
              </button>
              <button type="button" onClick={onBookDemo} className={`group ${MARKETING.btnOutline}`}>
                Book a Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative isolate mx-auto flex aspect-square max-w-md items-center justify-center rounded-[2rem] border border-emerald-100 bg-white p-12 shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
              <div className="absolute inset-6 -z-10 rounded-full bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-violet-400/15 blur-3xl" />
              {AI_POINTS.map((point, i) => (
                <img
                  key={point.label}
                  src={point.image}
                  alt={i === active ? point.label : ''}
                  aria-hidden={i !== active}
                  className={`absolute inset-12 m-auto max-h-[calc(100%-6rem)] max-w-[calc(100%-6rem)] object-contain drop-shadow-[0_24px_36px_rgba(15,23,42,0.2)] transition-all duration-500 ${
                    i === active ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
                  }`}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
