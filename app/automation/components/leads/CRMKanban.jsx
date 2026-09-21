'use client';

import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { PIPELINE_STAGES, LEAD_STATUS_ACCENT_COLORS } from './constants';
import { formatSource, getLeadRowBackgroundStyle, getStatusAccentColor } from './utils';
import { getLeadKanbanStage } from '@/lib/crm/leadStages';
import KanbanCard from './KanbanCard';
import KanbanColumn from './KanbanColumn';

export default function CRMKanban({ leads, onStatusChange, onOpenDrawer }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach((s) => { map[s.key] = []; });
    leads.forEach((lead) => {
      const key = getLeadKanbanStage(lead);
      if (map[key]) map[key].push(lead);
      else map.new.push(lead);
    });
    return map;
  }, [leads]);

  const activeLead = activeId ? leads.find((l) => l._id === activeId) : null;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const leadId = active.id;
    let newStatus = over.id;

    if (!PIPELINE_STAGES.some((s) => s.key === newStatus)) {
      const overLead = leads.find((l) => l._id === over.id);
      if (overLead) newStatus = overLead.status;
      else return;
    }

    const lead = leads.find((l) => l._id === leadId);
    if (lead && lead.status !== newStatus) {
      onStatusChange(leadId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[480px]">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.key}
            id={stage.key}
            title={stage.label}
            count={columns[stage.key]?.length || 0}
            color={LEAD_STATUS_ACCENT_COLORS[stage.key] || '#94a3b8'}
          >
            <SortableContext items={columns[stage.key]?.map((l) => l._id) || []} strategy={verticalListSortingStrategy}>
              {(columns[stage.key] || []).map((lead) => (
                <KanbanCard
                  key={lead._id}
                  lead={lead}
                  onOpen={() => onOpenDrawer(lead._id)}
                />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 border-l-[3px] rounded-lg shadow-lg w-64 rotate-2"
            style={{
              borderLeftColor: activeLead.rowColor || getStatusAccentColor(activeLead.status),
              ...getLeadRowBackgroundStyle(activeLead),
            }}
          >
            <p className="font-medium text-sm">{activeLead.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formatSource(activeLead.source)}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
