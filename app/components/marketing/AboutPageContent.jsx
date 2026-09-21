'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Globe, Heart, Lightbulb, Rocket, Shield, Sparkles, Target, Users, Zap } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { COMPANY } from '@/lib/founders/data';
import { MARKETING } from '@/lib/marketing/designTokens';

const TIMELINE = [
  { year: '2022', title: 'The problem became personal', body: 'Watching Indian SMBs lose leads in WhatsApp threads and spreadsheets — we started building a better way.' },
  { year: '2023', title: 'LeadForGrow launches', body: 'First CRM + WhatsApp automation platform for agencies and growth teams across India.' },
  { year: '2024', title: 'AI & unified inbox', body: 'Shipped AI reply assistant, Meta integrations, and a true multi-channel inbox.' },
  { year: '2025', title: 'Platform maturity', body: 'Full automation engine, enterprise security, and 1,100+ businesses on the platform.' },
  { year: '2026', title: 'Global expansion', body: 'Scaling infrastructure, compliance, and partnerships for teams worldwide.' },
];

const VALUES = [
  { icon: Zap, title: 'Speed to lead', body: 'Every enquiry deserves a response in seconds — not hours. Automation should feel instant, not robotic.' },
  { icon: Sparkles, title: 'AI that assists', body: 'Smart suggestions and workflows that amplify your team — never replace the human relationship.' },
  { icon: Shield, title: 'Trust by design', body: 'Your customer data is sacred. Security, privacy, and reliability are non-negotiable.' },
  { icon: Heart, title: 'Built with operators', body: 'We sell to sales teams — so we build like one. Every feature must earn its place in a real workflow.' },
];

const TECH = [
  { label: 'Cloud-native infrastructure', detail: 'Auto-scaling on modern cloud with 99.9% uptime target' },
  { label: 'End-to-end encryption', detail: 'TLS in transit, encrypted at rest, role-based access' },
  { label: 'Real-time messaging', detail: 'WhatsApp, Instagram, email, and web chat in one pipeline' },
  { label: 'AI inference layer', detail: 'Context-aware replies trained on your business knowledge' },
];

// Registered-company details shown in "About Our Company". Only facts the business has confirmed; do not add
// registration numbers, addresses or claims here without the owner's sign-off.
const COMPANY_DETAILS = [
  { term: 'Legal Company Name', value: 'ScaleDesk Technology Private Limited' },
  { term: 'Product Brand', value: 'LeadForGrow' },
  { term: 'Official Website', value: 'https://www.leadforgrow.com', href: 'https://www.leadforgrow.com' },
  { term: 'Country of Operation', value: 'India' },
];

export default function AboutPageContent() {
  return (
    <MarketingShell>
      {/* Hero — asymmetric split */}
      <section className={`${MARKETING.section} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#D2EDD0] via-[#EEF8ED] to-white" />
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className={`${MARKETING.container} relative grid lg:grid-cols-2 gap-12 lg:gap-20 items-center`}>
          <div>
            <p className={MARKETING.overline}>About {COMPANY.name}</p>
            <h1 className={`${MARKETING.h1} mt-3 mb-6`}>
              Turning leads into customers — with AI and heart
            </h1>
            <p className={MARKETING.bodyLarge}>
              {COMPANY.name} is the intelligent revenue platform from{' '}
              <strong className="font-semibold text-[#111827]">{COMPANY.parent}</strong>.
              We help businesses capture every enquiry, respond instantly, and close more deals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={MARKETING.btnPrimary}>
                Start free trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className={MARKETING.btnOutline}>Talk to us</Link>
            </div>
          </div>
          <div className="relative">
            <div className={`${MARKETING.glass} rounded-3xl p-8 lg:p-10`}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, value: '1,100+', label: 'Businesses' },
                  { icon: Globe, value: '1M+', label: 'Leads managed' },
                  { icon: Zap, value: '<60s', label: 'Speed-to-lead' },
                  { icon: Building2, value: 'India & beyond', label: 'Global reach' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl bg-white/80 border border-emerald-100/60 p-5 text-center">
                    <stat.icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-[#111827]">{stat.value}</p>
                    <p className="text-xs text-[#64748B] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision — offset cards */}
      <section className={MARKETING.sectionTight}>
        <div className={`${MARKETING.container} grid md:grid-cols-2 gap-8`}>
          <div className={`${MARKETING.card} p-8 lg:p-10 border-l-4 border-l-emerald-500`}>
            <Target className="w-7 h-7 text-emerald-600 mb-4" />
            <h2 className={MARKETING.h3}>Mission</h2>
            <p className={`${MARKETING.body} mt-3`}>
              Ensure no business ever loses a lead because of slow follow-up, scattered tools, or manual chaos.
              Every enquiry deserves an instant, professional response.
            </p>
          </div>
          <div className={`${MARKETING.card} p-8 lg:p-10 border-l-4 border-l-[#111827]`}>
            <Lightbulb className="w-7 h-7 text-emerald-600 mb-4" />
            <h2 className={MARKETING.h3}>Vision</h2>
            <p className={`${MARKETING.body} mt-3`}>
              Become the operating system for revenue teams — where CRM, inbox, automation, and AI work as one
              seamless experience for businesses of every size.
            </p>
          </div>
        </div>
      </section>

      {/* About Our Company — the legal entity behind the product brand */}
      <section className={MARKETING.sectionTight} aria-labelledby="about-company-heading">
        <div className={`${MARKETING.container} grid lg:grid-cols-2 gap-8 lg:gap-12 items-start`}>
          <div>
            <p className={MARKETING.overline}>Company</p>
            <h2 id="about-company-heading" className={`${MARKETING.h2} mt-3 mb-5`}>About Our Company</h2>
            <p className={MARKETING.body}>
              LeadForGrow is a SaaS platform developed and operated by ScaleDesk Technology Private Limited.
              LeadForGrow helps businesses manage leads, customer conversations, sales pipelines, follow-ups, and
              business automation through an integrated platform.
            </p>
          </div>
          <div className={`${MARKETING.card} p-6 lg:p-8`}>
            <Building2 className="w-6 h-6 text-emerald-600 mb-4" aria-hidden="true" />
            <dl className="divide-y divide-emerald-100/80">
              {COMPANY_DETAILS.map((item) => (
                <div key={item.term} className="py-3 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
                  <dt className="text-sm font-semibold text-[#111827]">{item.term}</dt>
                  <dd className={`${MARKETING.body} mt-1 sm:mt-0 break-words`}>
                    {item.href ? (
                      <a href={item.href} className={MARKETING.link}>{item.value}</a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Values — horizontal scroll on mobile */}
      <section className={`${MARKETING.sectionTight} bg-[#FAFDFA]`}>
        <div className={MARKETING.container}>
          <p className={MARKETING.overline}>What we believe</p>
          <h2 className={`${MARKETING.h2} mt-3 mb-10`}>Values that guide every decision</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className={`${MARKETING.card} p-6 ${MARKETING.cardHover}`}>
                <v.icon className="w-6 h-6 text-emerald-600 mb-4" />
                <h3 className="font-semibold text-[#111827]">{v.title}</h3>
                <p className={`${MARKETING.body} mt-2 text-sm`}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section className={MARKETING.section}>
        <div className={`${MARKETING.containerNarrow}`}>
          <p className={MARKETING.overline}>Our journey</p>
          <h2 className={`${MARKETING.h2} mt-3 mb-12`}>From idea to platform</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-200 hidden sm:block" />
            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className="relative sm:pl-12">
                  <div className="hidden sm:flex absolute left-0 top-1.5 w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold items-center justify-center">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-emerald-700">{item.year}</span>
                  <h3 className="text-lg font-semibold text-[#111827] mt-1">{item.title}</h3>
                  <p className={`${MARKETING.body} mt-2 text-sm`}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Culture */}
      <section className={MARKETING.section}>
        <div className={`${MARKETING.container} grid lg:grid-cols-2 gap-16`}>
          <div>
            <Rocket className="w-7 h-7 text-emerald-600 mb-4" />
            <h2 className={MARKETING.h2}>Technology stack</h2>
            <p className={`${MARKETING.body} mt-4 mb-8`}>
              We build on modern, battle-tested infrastructure so your team can focus on selling — not managing servers.
            </p>
            <ul className="space-y-4">
              {TECH.map((t) => (
                <li key={t.label} className="flex gap-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div>
                    <p className="font-medium text-[#111827]">{t.label}</p>
                    <p className="text-sm text-[#64748B]">{t.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${MARKETING.gradientDark} rounded-3xl p-8 lg:p-10 text-white`}>
            <Heart className="w-7 h-7 text-emerald-300 mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Office culture</h2>
            <p className="mt-4 text-emerald-100/90 leading-relaxed">
              Remote-first, craft-obsessed, and customer-driven. We ship fast but never compromise on quality.
              Every team member owns outcomes — not tasks.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-emerald-100/80">
              <li>• Async-first communication with deep focus time</li>
              <li>• Weekly customer feedback loops</li>
              <li>• Learning budget and conference support</li>
              <li>• Annual team offsite</li>
            </ul>
            <Link href="/careers" className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-white hover:text-emerald-200 transition-colors">
              View open roles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`${MARKETING.sectionTight} border-t border-emerald-100`}>
        <div className={`${MARKETING.containerNarrow} text-center`}>
          <h2 className={MARKETING.h2}>Ready to grow with us?</h2>
          <p className={`${MARKETING.body} mt-4 mb-8`}>Join 1,100+ businesses using LeadForGrow to capture and convert more leads.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className={MARKETING.btnGreen}>Start free trial</Link>
            <Link href="/contact" className={MARKETING.btnOutline}>Contact sales</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
