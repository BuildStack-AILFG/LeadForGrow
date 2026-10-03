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
          ? 'text-accent-fg bg-accent-subtle'
          : 'text-danger bg-danger-subtle'
      }`}
    >
      {showIcon && <Icon className="w-3 h-3" strokeWidth={1.75} />}
      {isUp ? '+' : ''}{change}%
    </span>
  );
}
