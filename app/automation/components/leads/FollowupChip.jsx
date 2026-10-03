'use client';

import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { getFollowUpMeta } from './utils';

const TONE_STYLES = {
  muted: {
    pill: 'bg-subtle text-fg-tertiary border-line',
    sub: 'text-fg-tertiary',
    icon: Calendar,
  },
  overdue: {
    pill: 'bg-danger-subtle text-danger border-danger/30',
    sub: 'text-danger',
    icon: AlertCircle,
  },
  today: {
    pill: 'bg-warning-subtle text-warning border-warning/30',
    sub: 'text-warning',
    icon: Clock,
  },
  upcoming: {
    pill: 'bg-info-subtle text-info border-info/30',
    sub: 'text-info',
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
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-fg-tertiary">
          <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
        <span className="text-meta font-medium text-fg-tertiary leading-none">Not set</span>
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
