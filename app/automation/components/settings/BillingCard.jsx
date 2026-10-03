'use client';

import { CreditCard, Zap, Users, HardDrive, ArrowUpRight } from 'lucide-react';

const USAGE_ICONS = { leads: Users, whatsapp: Zap, team: Users, storage: HardDrive };

export default function BillingCard({ billing }) {
  const { plan, price, renewsAt, usage } = billing;

  return (
    <div className="space-y-4">
      <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-accent-fg dark:text-accent-fg" />
              <span className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Current plan</span>
            </div>
            <p className="text-xl font-semibold text-fg dark:text-slate-50">{plan}</p>
            <p className="text-sm text-fg-secondary dark:text-fg-tertiary mt-0.5">{price}</p>
            <p className="text-xs text-fg-tertiary mt-1">Renews {renewsAt}</p>
          </div>
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-accent-fg dark:text-accent-fg bg-accent-subtle dark:bg-teal-950/40 rounded-lg hover:bg-accent-subtle dark:hover:bg-accent-pressed/30">
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(usage).map(([key, data]) => {
          const Icon = USAGE_ICONS[key] || Zap;
          const pct = Math.min(100, Math.round((data.used / data.limit) * 100));
          return (
            <div key={key} className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-fg-tertiary" />
                <span className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary capitalize">{key}</span>
              </div>
              <p className="text-lg font-semibold text-fg dark:text-slate-50 tabular-nums">
                {typeof data.used === 'number' && data.used % 1 !== 0 ? data.used.toFixed(1) : data.used}
                <span className="text-xs font-normal text-fg-tertiary"> / {data.limit}{key === 'storage' ? ' GB' : ''}</span>
              </p>
              <div className="mt-2 h-1.5 bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct > 80 ? 'bg-warning' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
