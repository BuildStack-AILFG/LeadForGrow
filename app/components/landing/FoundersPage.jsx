'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import HeroStepDivider from './HeroStepDivider';
import FounderCard from './FounderCard';
import { COMPANY, FOUNDERS, FOUNDER_STATS } from '@/lib/founders/data';

export default function FoundersPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <LandingNavbar />

      <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-[#D2EDD0]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div className="absolute -left-[10%] top-[10%] h-[400px] w-[50%] rounded-[100%] bg-[#c5e4c2]/60" />
          <div className="absolute -right-[5%] top-[5%] h-[360px] w-[45%] rounded-[100%] bg-[#e8f5e6]/80" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800/80">
              Our Team · Leadership
            </p>
            <h1 className="landing-headline mt-4">
              Meet the co-founders behind LeadForGrow
            </h1>
            <p className="landing-subhead mx-auto mt-6 max-w-2xl">
              <strong className="font-semibold text-[#111827]">S.Singh</strong>,{' '}
              <strong className="font-semibold text-[#111827]">Honey Singh</strong>, and{' '}
              <strong className="font-semibold text-[#111827]">S.S Chauhan</strong> founded{' '}
              {COMPANY.name} under {COMPANY.parent} to help businesses capture leads from Meta,
              WhatsApp, and the web — then convert them with AI-powered CRM and automation.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {FOUNDER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/60 bg-white/70 px-4 py-6 text-center backdrop-blur-sm sm:px-5"
              >
                <p className="text-2xl font-bold text-[#111827] sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-[#64748B] sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroStepDivider />
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Co-Founders
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#111827] sm:text-4xl">
              The team building your growth stack
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#4B5563]">
              Three operators with deep experience in product, growth, and customer delivery —
              united by one mission: make every business respond to leads faster and close more
              deals.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FOUNDERS.map((founder) => (
              <FounderCard key={founder.name} founder={founder} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAFDFA] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                Our story
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                From lost leads to a platform 1100+ businesses trust
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-[#4B5563]">
                LeadForGrow started when our founders saw the same pattern everywhere: businesses
                investing in ads and forms, but losing deals because follow-ups were too slow or
                scattered across WhatsApp, email, and spreadsheets.
              </p>
              <p className="mt-4 text-[16px] leading-relaxed text-[#4B5563]">
                Today, {COMPANY.name} powers unified inbox, CRM pipeline, Meta Lead Ads sync,
                WhatsApp automation, and AI-assisted replies — built in India, used by growth teams
                across industries.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#111827] transition-colors hover:text-emerald-700"
              >
                Read the full About Us story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white p-8 shadow-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                A product of
              </p>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src="/scaledesk_technology_logo.jpg"
                  alt="Scaledesk Technology"
                  className="h-16 w-16 rounded-xl object-cover shadow-md"
                />
                <div>
                  <p className="text-xl font-bold text-[#111827]">{COMPANY.parent}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{COMPANY.tagline}</p>
                </div>
              </div>
              <p className="mt-6 text-[15px] leading-relaxed text-[#4B5563]">
                S.Singh leads technology as Co-Founder &amp; CTO across LeadForGrow and the
                broader Scaledesk product ecosystem — from CRM to automation to custom enterprise
                software.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#111827] px-8 py-14 text-center md:px-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Work with our team</h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] text-slate-300">
              See how LeadForGrow can help your business capture and convert more leads — or get in
              touch with our founders directly.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/user/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-[15px] font-semibold text-[#111827] transition-colors hover:bg-slate-100"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:border-slate-400"
              >
                Contact us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
