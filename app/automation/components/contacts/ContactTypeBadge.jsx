'use client';

import { typeConfig } from './utils';

export default function ContactTypeBadge({ type, size = 'sm' }) {
  const config = typeConfig(type);
  const sizeCls = size === 'xs' ? 'text-meta px-1.5 py-0.5' : 'text-meta px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sizeCls} ${config.badge}`}>
      {config.label}
    </span>
  );
}
