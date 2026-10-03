'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { Users, UserCheck, Inbox, Bell, TrendingUp } from 'lucide-react';
import { useMouseParallax } from './useMouseParallax';
import LiveDemoLoop from './LiveDemoLoop';

function FloatingCard({ children, depth = 1, className = '', mouse, delay = 0 }) {
  const x = useSpring(mouse.x * depth * 14, { stiffness: 80, damping: 20 });
  const y = useSpring(mouse.y * depth * 14, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function CrmCommandCenter() {
  const ref = useRef(null);
  const mouse = useMouseParallax(0.6);

  return (
    <div ref={ref} className="relative mx-auto aspect-square max-w-[540px] w-full" style={{ perspective: '1200px' }}>
      {/* CRM hub */}
      <motion.div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-sky-500/20 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_0_60px_rgba(37,99,235,0.22)]">
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-600 to-sky-600 flex items-center justify-center shadow-inner">
            <Inbox className="w-8 h-8 text-white/95" strokeWidth={1.75} />
          </div>
          <motion.div
            className="absolute -inset-4 rounded-full border border-blue-400/25"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>

      {/* Connection rings */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-30 dark:opacity-20" viewBox="0 0 400 400">
        <motion.circle cx="200" cy="200" r="120" fill="none" stroke="url(#ringGrad)" strokeWidth="0.5" strokeDasharray="4 8"
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        />
        <defs>
          <linearGradient id="ringGrad"><stop stopColor="#2563eb" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
        </defs>
      </svg>

      {/* Main dashboard — back layer */}
      <FloatingCard depth={0.3} mouse={mouse} delay={0.1} className="absolute left-[8%] top-[18%] w-[72%] z-[1]">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Live CRM</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Leads', 'Pipeline', 'Revenue'].map((l, i) => (
              <div key={l} className="rounded-lg bg-slate-50 dark:bg-slate-800/80 p-2">
                <p className="text-[9px] text-slate-400">{l}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{['842', '₹12.4L', '94%'][i]}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-end gap-1 h-12">
            {[35, 55, 40, 70, 50, 85, 65].map((h, i) => (
              <motion.div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-blue-600 to-blue-400/60"
                initial={{ height: 0 }} animate={{ height: `${h}%` }}
                transition={{ delay: 0.8 + i * 0.06, duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </div>
        </div>
      </FloatingCard>

      {/* WhatsApp chat — front left */}
      <FloatingCard depth={1.2} mouse={mouse} delay={0.25} className="absolute left-0 top-[52%] w-[48%] z-[3]">
        <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <WhatsAppIcon colored className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">WhatsApp Inbox</span>
          </div>
          <div className="space-y-1.5">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 px-2 py-1.5 text-[10px] text-slate-700 dark:text-slate-300">Hi, I need pricing for your CRM</div>
            <div className="rounded-lg bg-blue-600 px-2 py-1.5 text-[10px] text-white ml-4">Sure! Sending details now ✓</div>
          </div>
        </div>
      </FloatingCard>

      {/* Lead card — front right */}
      <FloatingCard depth={1.4} mouse={mouse} delay={0.35} className="absolute right-0 top-[8%] w-[44%] z-[4]">
        <div className="rounded-xl border border-sky-200/60 dark:border-sky-800/40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">New Lead</span>
            </div>
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">Hot</span>
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">Priya Sharma</p>
          <p className="text-[10px] text-slate-500">Meta Ads · Mumbai</p>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-sky-600">
            <UserCheck className="w-3 h-3" /> Auto-assigned to Rahul
          </div>
        </div>
      </FloatingCard>

      {/* Performance — bottom right */}
      <FloatingCard depth={0.8} mouse={mouse} delay={0.45} className="absolute right-[5%] bottom-[12%] w-[40%] z-[2]">
        <div className="rounded-xl border border-sky-200/50 dark:border-sky-800/30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-md p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-sky-600" />
            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400">This week</span>
          </div>
          <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-snug">Response time improved 42%</p>
        </div>
      </FloatingCard>

      <LiveDemoLoop />

      <motion.div
        className="absolute right-[18%] top-[38%] z-[5] flex items-center gap-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 shadow-md"
        animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Bell className="w-3 h-3 text-amber-500" />
        <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300">3 new leads</span>
      </motion.div>
    </div>
  );
}
