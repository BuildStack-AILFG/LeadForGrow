'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  MessageSquare,
  GitBranch,
  Kanban,
  Workflow,
  BarChart3,
  PhoneCall,
  ArrowRight,
  Check,
} from 'lucide-react';
import { LANDING } from './landingStyles';
import LandingSectionBg from './LandingSectionBg';

const FEATURES = [
  {
    id: 'inbox',
    icon: WhatsAppIcon,
    label: 'WhatsApp Inbox',
    badge: 'Inbox',
    headline: 'Every conversation in one operational inbox',
    bullets: ['Team-wide chat sync with CRM context', 'Instant lead capture from Meta ads', 'Stage updates without leaving chat'],
    kpi: { label: 'Avg. first reply', value: '12s' },
    preview: 'inbox',
  },
  {
    id: 'routing',
    icon: GitBranch,
    label: 'Smart Routing',
    badge: 'Routing',
    headline: 'Route high-intent leads to the right rep',
    bullets: ['Round-robin & territory rules', 'Intent-based assignment', 'SLA alerts when leads wait'],
    kpi: { label: 'Routing accuracy', value: '98%' },
    preview: 'routing',
  },
  {
    id: 'pipeline',
    icon: Kanban,
    label: 'Team Pipeline',
    badge: 'Pipeline',
    headline: 'Visual deal flow your team actually uses',
    bullets: ['Kanban with enforced stages', 'Deal value & forecast view', 'Activity timeline per lead'],
    kpi: { label: 'Active deals', value: '24' },
    preview: 'pipeline',
  },
  {
    id: 'automation',
    icon: Workflow,
    label: 'Follow-up automation',
    badge: 'Automation',
    headline: 'Follow-ups that run while you sell',
    bullets: ['Welcome sequences on new leads', 'Template-based WhatsApp replies', 'Re-engagement on cold leads'],
    kpi: { label: 'Rules live', value: '6' },
    preview: 'automation',
  },
  {
    id: 'reports',
    icon: BarChart3,
    label: 'Reports',
    badge: 'Analytics',
    headline: 'Revenue visibility without spreadsheet chaos',
    bullets: ['Funnel & conversion metrics', 'Agent performance leaderboard', 'Lead source ROI tracking'],
    kpi: { label: 'Conversion lift', value: '+18%' },
    preview: 'reports',
  },
  {
    id: 'calls',
    icon: PhoneCall,
    label: 'Call Recovery',
    badge: 'Dialer',
    headline: 'Recover missed calls before competitors do',
    bullets: ['Auto WhatsApp after missed calls', 'Smart call queue & notes', 'Next-lead dialer for reps'],
    kpi: { label: 'Recovery rate', value: '73%' },
    preview: 'calls',
  },
];

function PreviewPanel({ type }) {
  const panels = {
    inbox: (
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Team inbox</span>
          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">3 unread</span>
        </div>
        {[
          { name: 'Kavya Kumari', msg: 'Interested in 3BHK — send brochure', time: '2m', hot: true },
          { name: 'Rahul Sharma', msg: 'What is the price range?', time: '8m', hot: false },
          { name: 'Priya Nair', msg: 'Schedule site visit tomorrow', time: '14m', hot: true },
        ].map((l) => (
          <motion.div
            key={l.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${l.hot ? 'border-blue-200/80 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'}`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{l.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{l.time}</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{l.msg}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ),
    routing: (
      <div className="space-y-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Live routing</div>
        {[
          { from: 'Meta Ad — Real Estate', to: 'Agent: Amit K.', status: 'Assigned', color: 'text-blue-600' },
          { from: 'Website Form', to: 'Team: Inside Sales', status: 'Queued', color: 'text-amber-600' },
          { from: 'WhatsApp Direct', to: 'Agent: Priya S.', status: 'Assigned', color: 'text-blue-600' },
        ].map((r) => (
          <div key={r.from} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <p className="text-[10px] text-slate-500">{r.from}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <GitBranch className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{r.to}</span>
            </div>
            <span className={`text-[10px] font-semibold mt-1 inline-block ${r.color}`}>{r.status}</span>
          </div>
        ))}
      </div>
    ),
    pipeline: (
      <div className="grid grid-cols-3 gap-2">
        {[
          { stage: 'New', count: 8, color: 'bg-slate-400' },
          { stage: 'Qualified', count: 12, color: 'bg-blue-500' },
          { stage: 'Won', count: 4, color: 'bg-blue-500' },
        ].map((col) => (
          <div key={col.stage} className="rounded-lg border border-slate-100 dark:border-slate-800 p-2 bg-slate-50/80 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{col.stage}</span>
            </div>
            {[...Array(Math.min(col.count, 3))].map((_, i) => (
              <div key={i} className="h-6 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-1.5" />
            ))}
            <span className="text-[10px] text-slate-400">{col.count} leads</span>
          </div>
        ))}
      </div>
    ),
    automation: (
      <div className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Active workflow</div>
        {[
          { step: '1', label: 'Meta lead received', done: true },
          { step: '2', label: 'WhatsApp welcome sent', done: true },
          { step: '3', label: 'Assigned to sales rep', done: true },
          { step: '4', label: 'Follow-up in 24h', done: false, active: true },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${s.done ? 'bg-blue-600 text-white' : s.active ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500/30' : 'bg-slate-100 text-slate-400'}`}>
              {s.done ? '✓' : s.step}
            </div>
            <span className={`text-xs ${s.active ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>
    ),
    reports: (
      <div>
        <div className="flex items-end gap-1.5 h-24 mb-3">
          {[35, 55, 42, 70, 58, 85, 72].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="flex-1 rounded-t bg-blue-500/80 dark:bg-blue-500"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400">Leads this week</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">847</p>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400">Win rate</p>
            <p className="text-lg font-bold text-blue-600">24.3%</p>
          </div>
        </div>
      </div>
    ),
    calls: (
      <div className="space-y-2">
        <div className="p-2.5 rounded-lg border border-rose-200/80 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-[10px] font-semibold text-rose-600 uppercase">Missed call</p>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">+91 98••••4521 · 2 min ago</p>
        </div>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-2.5 rounded-lg border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20"
        >
          <p className="text-[10px] font-semibold text-blue-600 uppercase">Auto WhatsApp sent</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">"Sorry we missed your call! How can we help you today?"</p>
        </motion.div>
        <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <p className="text-[10px] text-slate-400">Next in queue</p>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">Ananya Mehta · Hot lead</p>
        </div>
      </div>
    ),
  };

  return (
    <div className="h-full min-h-[280px] lg:min-h-[340px] p-5 lg:p-6">
      {panels[type] || panels.inbox}
    </div>
  );
}

export default function ProductTourSection() {
  const [active, setActive] = useState(0);
  const feature = FEATURES[active];
  const Icon = feature.icon;

  return (
    <LandingSectionBg id="product-tour" variant="photo-analytics" sectionClass={LANDING.section}>
      <div className={LANDING.container}>
        <div className="max-w-2xl mb-10 lg:mb-12">
          <p className={LANDING.overline}>Product tour</p>
          <h2 className={`${LANDING.heading} mt-2`}>See how teams convert faster</h2>
          <p className={`${LANDING.subheading} mt-3`}>
            Explore WhatsApp capture, smart routing, and analytics — built for high-performance sales teams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Sticky nav */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-1">
            {FEATURES.map((f, i) => {
              const FIcon = f.icon;
              const isActive = active === i;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 border ${
                    isActive
                      ? 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <FIcon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                      {f.label}
                    </p>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[11px] text-slate-500 mt-0.5 truncate"
                      >
                        {f.kpi.label}: {f.kpi.value}
                      </motion.p>
                    )}
                  </div>
                  {isActive && <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-8">
            <div className={`${LANDING.card} overflow-hidden`}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <span className="text-[10px] font-medium text-slate-400 ml-2">LeadForGrow — {feature.label}</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{feature.kpi.value}</span>
                  <span className="text-[10px] text-slate-400">{feature.kpi.label}</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 md:grid-cols-2"
                >
                  <PreviewPanel type={feature.preview} />
                  <div className="p-5 lg:p-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{feature.badge}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 leading-snug">{feature.headline}</h3>
                    <ul className="space-y-2.5 mb-6">
                      {feature.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 w-fit px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Request a demo
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </LandingSectionBg>
  );
}
