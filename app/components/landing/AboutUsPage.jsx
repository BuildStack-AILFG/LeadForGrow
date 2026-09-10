'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Clock,
  Handshake,
  Target,
  Users,
  Globe,
  BarChart3,
} from 'lucide-react';
import LandingNavbar from './LandingNavbar';
import HeroStepDivider from './HeroStepDivider';
import FounderCard from './FounderCard';
import { FOUNDERS } from '@/lib/founders/data';

const STATS = [
  { icon: Users, value: '1100+', label: 'Businesses trust LeadForGrow' },
  { icon: BarChart3, value: '1M+', label: 'Leads captured & managed' },
  { icon: Clock, value: '<60s', label: 'Average speed-to-lead with automation' },
  { icon: Globe, value: 'India & beyond', label: 'Serving growth teams globally' },
];

const VALUES = [
  {
    icon: Target,
    title: 'Speed to lead wins',
    text: 'Every enquiry deserves an instant, professional response — across WhatsApp, Meta, email, and web.',
  },
  {
    icon: Handshake,
    title: 'Automation that assists, not replaces',
    text: 'Smart workflows and reply assistants help your team close more deals without losing the human touch.',
  },
  {
    icon: Building2,
    title: 'Built for real operators',
    text: 'From solo founders to agencies — one platform for CRM, pipeline, inbox, and follow-ups.',
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-[#D2EDD0]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden">
          <div className="absolute -left-[10%] top-[10%] h-[400px] w-[50%] rounded-[100%] bg-[#c5e4c2]/60" />
          <div className="absolute -right-[5%] top-[5%] h-[360px] w-[45%] rounded-[100%] bg-[#e8f5e6]/80" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800/80">
              About LeadForGrow
            </p>
            <h1 className="landing-headline mt-4">
              Turning leads into customers — with AI and heart
            </h1>
            <p className="landing-subhead mx-auto mt-6 max-w-2xl">
              LeadForGrow is the intelligent sales platform built by{' '}
              <strong className="font-semibold text-[#111827]">Scaledesk Technology</strong>.
              We help businesses capture leads from Meta, WhatsApp, forms, and web — then automate
              follow-ups so nothing slips through the cracks.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/60 bg-white/70 px-4 py-6 text-center backdrop-blur-sm sm:px-5"
              >
                <stat.icon className="mx-auto h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-2xl font-bold text-[#111827] sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-[#64748B] sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroStepDivider />
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                Our mission
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                The missing layer between enquiry and revenue
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-[#4B5563]">
                We started LeadForGrow because great businesses were losing deals simply by being
                too slow to respond. Today, our platform powers CRM, unified inbox, Meta Lead Ads
                sync, WhatsApp automation, and AI-assisted replies — all in one place.
              </p>
              <p className="mt-4 text-[16px] leading-relaxed text-[#4B5563]">
                From agencies managing dozens of clients to SMBs running their first ad campaign,
                LeadForGrow gives every team enterprise-grade lead infrastructure without the
                enterprise complexity.
              </p>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-emerald-100 shadow-xl">
                <img
                  src="/edited-photo.png"
                  alt="LeadForGrow platform dashboard"
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-lg sm:-bottom-6 sm:-left-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/scaledesk_technology_logo.jpg"
                    alt="Scaledesk Technology"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#64748B]">A product of</p>
                    <p className="text-sm font-bold text-[#111827]">Scaledesk Technology</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#FAFDFA] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              What we stand for
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#111827] sm:text-4xl">Built for growth teams</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {VALUES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-emerald-100/80 bg-white p-8 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D2EDD0] text-emerald-800">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#4B5563]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-16 md:py-24" id="team">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Leadership
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#111827] sm:text-4xl">Meet the founders</h2>
            <p className="mt-4 text-[16px] text-[#4B5563]">
              Three operators building the future of lead management and sales automation for India
              and beyond.
            </p>
            <Link
              href="/founders"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View full founders page
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FOUNDERS.map((founder) => (
              <FounderCard key={founder.name} founder={founder} />
            ))}
          </div>
        </div>
      </section>

      {/* Scaledesk */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-[#D2EDD0] via-[#ECFDF5] to-[#D2EDD0] p-8 md:p-12 lg:p-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-900/70">
                  Parent company
                </p>
                <h2 className="mt-3 text-3xl font-bold text-[#111827] sm:text-4xl">
                  Scaledesk Technology
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-[#374151]">
                  LeadForGrow is engineered and operated by Scaledesk Technology — a product studio
                  focused on revenue infrastructure for modern businesses. From CRM to automation to
                  AI, we build tools that help teams scale without chaos.
                </p>
                <p className="mt-4 text-[15px] text-[#4B5563]">
                  <strong className="font-semibold text-[#111827]">S.Singh</strong>, Co-Founder
                  &amp; CTO, leads technology across LeadForGrow and the Scaledesk product ecosystem.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-white/60 bg-white/80 p-8 backdrop-blur-sm">
                <img
                  src="/scaledesk_technology_logo.jpg"
                  alt="Scaledesk Technology logo"
                  className="h-24 w-24 rounded-2xl object-cover shadow-md"
                />
                <p className="text-center text-lg font-bold text-[#111827]">Scaledesk Technology</p>
                <p className="text-center text-sm text-[#64748B]">Building LeadForGrow &amp; beyond</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#111827] px-8 py-14 text-center md:px-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to grow with us?</h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] text-slate-300">
              Join 1100+ businesses using LeadForGrow to capture, nurture, and convert leads faster.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/user/register"
                className="inline-flex items-center justify-center bg-white px-7 py-3.5 text-[15px] font-semibold text-[#111827] transition-colors hover:bg-slate-100"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-slate-600 px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:border-slate-400"
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
