'use client';

import { LEAD_STATUS_ACCENT_COLORS, normalizeLeadStatus } from '@/lib/crm/leadStages';
import Badge from '@/app/components/ui/Badge';
import { statusLabel } from './utils';

/**
 * Lead status chip — neutral chip + small dot in the stage's own colour
 * (DESIGN_BRIEF §6: stage colours appear as dots/chips only, never fills).
 */
export default function StatusBadge({ status, className }) {
  const key = normalizeLeadStatus(status);
  const color = LEAD_STATUS_ACCENT_COLORS[key] || LEAD_STATUS_ACCENT_COLORS[status] || 'var(--stage-1)';
  return (
    <Badge stageColor={color} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}
