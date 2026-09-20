'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createFieldFromType } from './constants';
import FieldLibrary from './FieldLibrary';
import FormCanvas from './FormCanvas';

export default function FormBuilder({ fields, setFields, selectedIndex, setSelectedIndex }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addField = (typeDef) => {
    const field = createFieldFromType(typeDef);
    setFields((prev) => [...prev, field]);
    setSelectedIndex(fields.length);
  };

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  const duplicateField = (index) => {
    setFields((prev) => {
      const copy = JSON.parse(JSON.stringify(prev[index]));
      copy.name = `${copy.name}_copy_${Date.now()}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      copy.label = `${copy.label} (copy)`;
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedIndex(index + 1);
  };

  const toggleRequired = (index) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, required: !f.required } : f)));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((items) => {
      const oldIndex = items.findIndex((f) => f.name === active.id);
      const newIndex = items.findIndex((f) => f.name === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* Field library */}
      <div className="w-full lg:w-56 flex-shrink-0">
        <FieldLibrary onAddField={addField} />
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Form canvas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Drag to reorder · click to edit</p>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.name)} strategy={verticalListSortingStrategy}>
            <FormCanvas
              fields={fields}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onRemove={removeField}
              onDuplicate={duplicateField}
              onToggleRequired={toggleRequired}
            />
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
