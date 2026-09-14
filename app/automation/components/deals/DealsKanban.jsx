'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DealKanbanColumn from './DealKanbanColumn';
import { formatValue } from './utils';
import DealStageBadge from './DealStageBadge';

export default function DealsKanban({
  stages,
  deals,
  dealsByStage,
  onStageChange,
  onOpenDeal,
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeDeal = useMemo(
    () => (activeId ? deals.find((d) => d._id === activeId) : null),
    [activeId, deals]
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const dealId = active.id;
    let newStage = over.id;

    if (!stages.some((s) => s.key === newStage)) {
      const overDeal = deals.find((d) => d._id === over.id);
      if (overDeal) newStage = overDeal.stage;
      else return;
    }

    const deal = deals.find((d) => d._id === dealId);
    if (deal && deal.stage !== newStage) {
      onStageChange(dealId, newStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[480px] -mx-1 px-1">
        {stages.map((stage) => (
          <DealKanbanColumn
            key={stage.key}
            stage={stage}
            stages={stages}
            deals={dealsByStage[stage.key] || []}
            formatValue={formatValue}
            onOpenDeal={onOpenDeal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl shadow-lg w-72 rotate-1">
            <p className="text-[13px] font-semibold text-[#101828] truncate">{activeDeal.title}</p>
            <p className="text-[13px] font-semibold text-[#101828] mt-1 tabular-nums">
              {formatValue(activeDeal.amount, activeDeal.currency)}
            </p>
            <div className="mt-2">
              <DealStageBadge stage={activeDeal.stage} stages={stages} size="xs" />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
