'use client';

import { STATUS_CONFIG, getRuleStatus } from './constants';

export default function AutomationStatusBadge({ rule, size = 'sm' }) {
  const status = getRuleStatus(rule);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.paused;
  const sizeClass = size === 'xs' ? 'text-meta px-1.5 py-0.5' : 'text-meta px-2 py-0.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-md ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
