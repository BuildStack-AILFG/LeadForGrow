'use client';

import { CreditCard, Zap, Users, HardDrive, ArrowUpRight } from 'lucide-react';

const USAGE_ICONS = { leads: Users, whatsapp: Zap, team: Users, storage: HardDrive };

export default function BillingCard({ billing }) {
  const { plan, price, renewsAt, usage } = billing;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-slate-500">Current plan</span>
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{plan}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{price}</p>
            <p className="text-xs text-slate-400 mt-1">Renews {renewsAt}</p>
          </div>
          <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-950/40 rounded-lg hover:bg-teal-100">
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(usage).map(([key, data]) => {
          const Icon = USAGE_ICONS[key] || Zap;
          const pct = Math.min(100, Math.round((data.used / data.limit) * 100));
          return (
            <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">{key}</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                {typeof data.used === 'number' && data.used % 1 !== 0 ? data.used.toFixed(1) : data.used}
                <span className="text-xs font-normal text-slate-400"> / {data.limit}{key === 'storage' ? ' GB' : ''}</span>
              </p>
              <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct > 80 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
