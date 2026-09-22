'use client';

import React from 'react';
import UserNavbar from '../user/Header';
import { useTheme } from './ThemeContext';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Heading from '@/app/components/ui/Heading';

export default function MarketingLayout({
  title,
  subtitle,
  heroImage,
  benefits = [],
  whoIsThisFor,
  whyItMatters,
  faq = [],
  ctaText = "Start Free Trial",
  children,
  maxWidth = '7xl'
}) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-500 overflow-hidden flex flex-col">
      <UserNavbar />

      {/* Hero Section */}
      <div className="relative pt-48 pb-24 px-8 border-b border-slate-50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <Heading level={1} className="text-5xl md:text-7xl leading-tight tracking-tight">
              {title}
            </Heading>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="/user/register"
                className="bg-indigo-600 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-indigo-700 transition shadow-2xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3"
              >
                {ctaText} <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </div>

          {heroImage && (
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                <img
                  src={heroImage}
                  alt={title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl z-0"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl z-0"></div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-8 py-24 space-y-24 flex-grow`}>
        {benefits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all h-full">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <Heading level={3} className="text-xl mb-4">{benefit.title}</Heading>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">{benefit.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Audience & Importance */}
        {(whoIsThisFor || whyItMatters) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {whoIsThisFor && (
              <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden h-full">
                <Heading level={3} className="text-3xl mb-8 text-white">Who Is This For?</Heading>
                <div className="space-y-6 relative z-10">
                  {whoIsThisFor.map((target, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-lg opacity-90">{target}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            )}

            {whyItMatters && (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800 shadow-xl h-full">
                <Heading level={3} className="text-3xl mb-8">Why This Matters?</Heading>
                <div className="space-y-6">
                  {whyItMatters.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-indigo-600 dark:text-indigo-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Deep SEO Content Area */}
        {children && (
          <div className={`mx-auto max-w-${maxWidth} prose prose-slate dark:prose-invert prose-2xl prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-3xl prose-blockquote:border-indigo-600`}>
            {children}
          </div>
        )}

        {/* FAQ Section */}
        {faq.length > 0 && (
          <div className="py-24 border-t border-slate-50 dark:border-slate-800/50">
            <Heading level={2} className="text-4xl mb-16 text-center">Frequently Asked Questions</Heading>
            <div className="max-w-4xl mx-auto space-y-8">
              {faq.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-xl">
                  <Heading level={3} className="text-2xl mb-4">{item.q}</Heading>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light text-xl italic">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing CTA */}
        <div className="py-24 text-center border-t border-slate-50 dark:border-slate-800/50">
          <Heading level={2} className="text-5xl mb-8">Ready to transform your business?</Heading>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">Start capturing and following up on leads with LeadForGrow.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <a
              href="/user/register"
              className="bg-indigo-600 text-white px-12 py-6 rounded-3xl text-2xl font-bold hover:bg-indigo-700 transition shadow-2xl shadow-indigo-500/20 active:scale-95"
            >
              Get Started for Free
            </a>
            <a
              href="/contact"
              className="bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white px-12 py-6 rounded-3xl text-2xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </div>


    </div>
  );
}
