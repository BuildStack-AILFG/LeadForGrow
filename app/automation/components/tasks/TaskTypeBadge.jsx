'use client';

import { TASK_TYPES, TASK_TYPE_ACCENTS } from './constants';

export default function TaskTypeBadge({ type, showLabel = true, size = 'sm' }) {
  const config = TASK_TYPES[type] || { label: type, accent: 'slate', icon: null };
  const Icon = config.icon;
  const sizeClass = size === 'xs' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${sizeClass} rounded flex items-center justify-center flex-shrink-0 ${TASK_TYPE_ACCENTS[config.accent] || TASK_TYPE_ACCENTS.slate}`}>
        {Icon && <Icon className={iconSize} />}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{config.label}</span>
      )}
    </span>
  );
}
