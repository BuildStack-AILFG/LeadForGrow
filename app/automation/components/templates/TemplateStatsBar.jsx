'use client';

import { LayoutTemplate, Zap, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon, GmailIcon } from '../chat/BrandIcons';

export default function TemplateStatsBar({ stats }) {
  const cards = [
    { label: 'Total templates', value: stats.total, icon: LayoutTemplate, color: '#1D4B3E' },
    { label: 'WhatsApp', value: stats.whatsapp, icon: WhatsAppIcon, color: '#25D366' },
    { label: 'Email', value: stats.email, icon: GmailIcon, color: null },
    { label: 'Meta verified', value: stats.meta, icon: ShieldCheck, color: '#1D4B3E' },
    { label: 'Auto flows', value: stats.autoActive, icon: Zap, color: '#1D4B3E' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-white dark:bg-slate-900 rounded p-4 shadow-sm">
            <Icon size={16} className="mb-2" style={c.color ? { color: c.color } : undefined} />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}
