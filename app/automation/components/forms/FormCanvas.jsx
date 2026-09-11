'use client';

import FormField from './FormField';

export default function FormCanvas({ fields, selectedIndex, onSelect, onRemove, onDuplicate, onToggleRequired }) {
  return (
    <div className="space-y-2 min-h-[280px]">
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Your form is empty</p>
          <p className="text-xs text-slate-400 mt-1">Add fields from the library on the left</p>
        </div>
      ) : (
        fields.map((field, index) => (
          <FormField
            key={field.name}
            field={field}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={onSelect}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
            onToggleRequired={onToggleRequired}
          />
        ))
      )}
    </div>
  );
}
