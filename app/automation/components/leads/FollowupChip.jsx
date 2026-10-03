'use client';

import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { getFollowUpMeta } from './utils';

const TONE_STYLES = {
  muted: {
    pill: 'bg-subtle dark:bg-slate-900 text-fg-tertiary dark:text-fg-tertiary border-[#EAECF0] dark:border-slate-700',
    sub: 'text-fg-tertiary dark:text-fg-tertiary',
    icon: Calendar,
  },
  overdue: {
    pill: 'bg-danger-subtle dark:bg-slate-900 text-danger border-danger/30',
    sub: 'text-danger',
    icon: AlertCircle,
  },
  today: {
    pill: 'bg-[#FFFAEB] dark:bg-slate-900 text-warning dark:text-amber-400 border-[#FEDF89]',
    sub: 'text-warning dark:text-amber-400',
    icon: Clock,
  },
  upcoming: {
    pill: 'bg-info-subtle dark:bg-slate-900 text-info dark:text-blue-400 border-[#B2DDFF]',
    sub: 'text-info dark:text-blue-400',
    icon: Calendar,
  },
};

export default function FollowupChip({ date }) {
  const meta = getFollowUpMeta(date);
  const style = TONE_STYLES[meta.tone] || TONE_STYLES.muted;
  const Icon = style.icon;

  if (meta.key === 'none') {
    return (
      <div className="flex flex-col items-center justify-center gap-1 min-w-[96px]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted dark:bg-slate-900 text-fg-tertiary dark:text-fg-tertiary">
          <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
        <span className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary leading-none">Not set</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1 min-w-[96px]">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-meta font-semibold leading-none ${style.pill}`}
      >
        <Icon className="w-3 h-3 shrink-0" strokeWidth={2.25} />
        {meta.dateLabel}
      </span>
      <span className={`text-meta font-medium leading-none ${style.sub}`}>{meta.subLabel}</span>
    </div>
  );
}
