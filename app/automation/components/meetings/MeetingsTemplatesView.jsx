'use client';

import Link from 'next/link';
import { ArrowLeft, Video, Phone, Rocket, Headphones } from 'lucide-react';
import DashboardCard from '../dashboard/primitives/DashboardCard';

const TEMPLATES = [
  {
    id: 'demo',
    title: 'Product Demo',
    category: 'demo_call',
    duration: 30,
    description: 'WhatsApp confirmation + 30min reminder. Routes to sales round-robin.',
    icon: Video,
  },
  {
    id: 'sales',
    title: 'Discovery Call',
    category: 'sales_call',
    duration: 45,
    description: 'Pipeline sync to Interested. No-show recovery enabled.',
    icon: Phone,
  },
  {
    id: 'onboard',
    title: 'Client Onboarding',
    category: 'onboarding',
    duration: 60,
    description: 'Fixed host, email + WhatsApp reminders, follow-up sequence hook.',
    icon: Rocket,
  },
  {
    id: 'consult',
    title: 'Strategy Consultation',
    category: 'consultation',
    duration: 30,
    description: 'Priority rep routing for high-intent leads.',
    icon: Headphones,
  },
];

export default function MeetingsTemplatesView() {
  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto space-y-6">
      <Link href="/automation/meetings" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100">
        <ArrowLeft className="w-4 h-4" /> Revenue Scheduling
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Meeting templates</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pre-configured revenue scheduling types — start from a template in Create flow.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <DashboardCard key={t.id} padding="p-5" hover>
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{t.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.duration} min · {t.category.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{t.description}</p>
                  <Link
                    href="/automation/meetings/create"
                    className="inline-block mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Use template →
                  </Link>
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </div>
  );
}
