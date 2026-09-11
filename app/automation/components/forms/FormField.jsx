'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy, Asterisk } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FormField({ field, index, isSelected, onSelect, onRemove, onDuplicate, onToggleRequired }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      animate={{ opacity: isDragging ? 0.85 : 1, scale: isDragging ? 1.02 : 1 }}
      onClick={() => onSelect(index)}
      className={`group relative flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-shadow duration-200 ${
        isSelected
          ? 'bg-white dark:bg-slate-900 shadow-lg shadow-teal-500/10 ring-2 ring-teal-500/40'
          : 'bg-white/80 dark:bg-slate-900/80 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-900'
      }`}
    >
      <button
        type="button"
        className="mt-0.5 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {field.label}
          </p>
          {field.required && (
            <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">Required</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 capitalize">{field.type}</p>
        {field.placeholder && (
          <p className="text-[11px] text-slate-400 mt-1.5 italic truncate">"{field.placeholder}"</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          title={field.required ? 'Make optional' : 'Make required'}
          onClick={(e) => { e.stopPropagation(); onToggleRequired(index); }}
          className={`p-1.5 rounded-lg transition-colors ${field.required ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Asterisk className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Duplicate"
          onClick={(e) => { e.stopPropagation(); onDuplicate(index); }}
          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
