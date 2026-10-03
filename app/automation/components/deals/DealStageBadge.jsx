'use client';

import { getStageConfig, getStageLabel } from '@/lib/crm/pipelineUtils';
import Badge from '@/app/components/ui/Badge';

/** Deal stage chip — neutral chip + dot in the stage's configured colour (DESIGN_BRIEF §6). */
export default function DealStageBadge({ stage, stages = [], className }) {
  const config = getStageConfig(stages, stage);
  return (
    <Badge stageColor={config?.color || 'var(--stage-1)'} className={className}>
      {getStageLabel(stages, stage)}
    </Badge>
  );
}
