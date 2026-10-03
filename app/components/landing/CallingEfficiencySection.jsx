'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Clock, User, ChevronRight } from 'lucide-react';
import { LANDING } from './landingStyles';
import LandingSectionBg from './LandingSectionBg';

const QUEUE = [
  { name: 'Ananya Mehta', tag: 'Hot', stage: 'Qualified', wait: 'Now' },
  { name: 'Vikram Singh', tag: 'Warm', stage: 'New', wait: 'Next' },
  { name: 'Sneha Patel', tag: 'Follow-up', stage: 'Contacted', wait: '+2' },
];

export default function CallingEfficiencySection() {
  return (
    <LandingSectionBg variant="photo-support" sectionClass={LANDING.section}>
      <div className={LANDING.container}>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <p className={LANDING.overline}>Sales command center</p>
            <h2 className={`${LANDING.heading} mt-2`}>High-performance calling infrastructure</h2>
            <p className={`${LANDING.subheading} mt-3 mb-6`}>
              One-click dialer, auto next-lead queue, and instant WhatsApp recovery when calls go unanswered.
            </p>
            <ul className="space-y-3">
              {[
                'Smart call queue prioritizes hot leads first',
                'Auto-sync call notes to CRM in real time',
                'Missed call → WhatsApp follow-up in 30 seconds',
                'Team leaderboard for calls & conversions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`${LANDING.card} p-5 overflow-hidden`}
          >
            {/* Active call bar */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-600 text-white mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <Phone className="w-4 h-4" />
                </motion.div>
                <div>
                  <p className="text-xs font-semibold">Calling Rahul Sharma</p>
                  <p className="text-[10px] opacity-80">+91 98••••7821 · 01:24</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-1 rounded">Live</span>
            </div>

            {/* Missed call recovery */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 mb-4">
              <PhoneOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Missed — Priya Nair</p>
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1.5 mt-1.5"
                >
                  <WhatsAppIcon colored className="w-3 h-3" />
                  <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">WhatsApp recovery sent</span>
                </motion.div>
              </div>
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Queue */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Call queue</p>
            <div className="space-y-2">
              {QUEUE.map((lead, i) => (
                <div
                  key={lead.name}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                    i === 0
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{lead.name}</p>
                    <p className="text-[10px] text-slate-400">{lead.stage}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {lead.tag}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 w-8 text-right">{lead.wait}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </LandingSectionBg>
  );
}
