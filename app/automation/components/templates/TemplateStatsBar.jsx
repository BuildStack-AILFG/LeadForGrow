'use client';

import { LayoutTemplate, MessageCircle, Mail, Zap, ShieldCheck } from 'lucide-react';

export default function TemplateStatsBar({ stats }) {
  const cards = [
    { label: 'Total templates', value: stats.total, icon: LayoutTemplate },
    { label: 'WhatsApp', value: stats.whatsapp, icon: MessageCircle },
    { label: 'Email', value: stats.email, icon: Mail },
    { label: 'Meta verified', value: stats.meta, icon: ShieldCheck },
    { label: 'Auto flows', value: stats.autoActive, icon: Zap },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm">
            <Icon className="w-4 h-4 text-teal-600 mb-2" />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}
