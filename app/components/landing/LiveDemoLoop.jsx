'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, BarChart3, CheckCircle2 } from 'lucide-react';

const WhatsAppColored = (props) => <WhatsAppIcon colored {...props} />;
const STEPS = [
  { icon: UserPlus, label: 'New lead from Meta Ads', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
  { icon: WhatsAppColored, label: 'WhatsApp auto-reply sent', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
  { icon: UserCheck, label: 'Assigned to top agent', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' },
  { icon: BarChart3, label: 'Pipeline analytics updated', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  { icon: CheckCircle2, label: 'Follow-up scheduled', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
];

export default function LiveDemoLoop() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 3200);
    return () => clearInterval(id);
  }, []);

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="absolute left-1/2 bottom-[2%] z-[6] -translate-x-1/2 w-[85%] max-w-[280px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${current.color}`}>
            <Icon className="w-4 h-4" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Live simulation</p>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{current.label}</p>
          </div>
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-blue-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
