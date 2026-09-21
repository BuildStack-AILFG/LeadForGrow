'use client';

import { getStageConfig, getStageLabel, stageBadgeStyle } from '@/lib/crm/pipelineUtils';

export default function DealStageBadge({ stage, stages = [], size = 'sm' }) {
  const config = getStageConfig(stages, stage);
  const label = getStageLabel(stages, stage);
  const inlineStyle = stageBadgeStyle(config);
  const sizeCls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sizeCls} ${
        inlineStyle ? '' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
      }`}
      style={inlineStyle || undefined}
    >
      {label}
    </span>
  );
}
