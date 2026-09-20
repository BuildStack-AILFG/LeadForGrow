'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function TrendBadge({ change, positiveIsGood = true, showIcon = true }) {
  if (change === 0 || change == null) return null;
  const isUp = change > 0;
  const isGood = positiveIsGood ? isUp : !isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-normal px-1.5 py-0.5 rounded-full leading-none ${
        isGood
          ? 'text-[#047857] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-slate-900'
          : 'text-[#C0353A] dark:text-red-400 bg-[#FEF3F2] dark:bg-slate-900'
      }`}
    >
      {showIcon && <Icon className="w-3 h-3" strokeWidth={1.75} />}
      {isUp ? '+' : ''}{change}%
    </span>
  );
}
