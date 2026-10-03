'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Route,
  Users,
  Kanban,
  TrendingUp,
  ChevronRight} from 'lucide-react';
import { LANDING } from './landingStyles';
import LandingSectionBg from './LandingSectionBg';

const STAGES = [
  {
    id: 'sources',
    icon: Layers,
    label: 'Lead Sources',
    detail: 'Meta ads, website forms, WhatsApp & portals sync in real time.',
    metric: '12 sources',
  },
  {
    id: 'routing',
    icon: Route,
    label: 'Smart routing',
    detail: 'Intent scoring assigns leads to the right rep in seconds.',
    metric: '<5s assign',
  },
  {
    id: 'whatsapp',
    icon: WhatsAppIcon,
    label: 'WhatsApp Automation',
    detail: 'Instant welcome, templates, and nurture sequences fire automatically.',
    metric: '60s reply',
  },
  {
    id: 'team',
    icon: Users,
    label: 'Sales Team',
    detail: 'Shared inbox, tasks, and accountability for every rep.',
    metric: '4 online',
  },
  {
    id: 'pipeline',
    icon: Kanban,
    label: 'Pipeline',
    detail: 'Deals move through enforced stages with full activity history.',
    metric: '₹42L pipeline',
  },
  {
    id: 'revenue',
    icon: TrendingUp,
    label: 'Revenue',
    detail: 'Closed-won tracking, forecasts, and ROI dashboards.',
    metric: '+18% MoM',
  },
];

export default function RevenueEngineWorkflow() {
  const [active, setActive] = useState(0);

  return (
    <LandingSectionBg variant="aurora" sectionClass={`${LANDING.section} border-y border-slate-200/60 dark:border-slate-800/60`}>
      <div className={LANDING.container}>
        <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-12">
          <p className={LANDING.overline}>Revenue engine</p>
          <h2 className={`${LANDING.heading} mt-2`}>Your operating system from lead to revenue</h2>
          <p className={`${LANDING.subheading} mt-3`}>
            One connected workflow — not disconnected tools. Every enquiry flows through automation, team, and pipeline to closed deals.
          </p>
        </div>

        {/* Desktop horizontal flow */}
        <div className="hidden lg:block">
          <div className="relative flex items-stretch gap-0">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const isActive = active === i;
              return (
                <div key={stage.id} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`flex-1 min-w-0 p-4 rounded-xl border text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 shadow-[0_4px_20px_rgba(37,99,235,0.12)]'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{stage.label}</p>
                    <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">{stage.metric}</p>
                  </button>
                  {i < STAGES.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>

          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`mt-6 ${LANDING.card} p-5 lg:p-6`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = STAGES[active].icon;
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{STAGES[active].label}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{STAGES[active].detail}</p>
              </div>
              <div className="ml-auto hidden sm:block text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Live metric</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{STAGES[active].metric}</p>
              </div>
            </div>

            {/* Mini dashboard strip */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-6 gap-2">
              {STAGES.map((s, i) => (
                <div key={s.id} className="text-center">
                  <div className={`h-1 rounded-full mb-1.5 ${i <= active ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <span className="text-[9px] font-medium text-slate-400 truncate block">{s.label.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile stacked flow */}
        <div className="lg:hidden space-y-2">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className={`${LANDING.card} p-4 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{stage.label}</p>
                  <p className="text-xs text-slate-500 truncate">{stage.detail}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 shrink-0">{stage.metric}</span>
                {i < STAGES.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 hidden" />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          From first enquiry to final conversion — everything happens in one platform.
        </p>
      </div>
    </LandingSectionBg>
  );
}
