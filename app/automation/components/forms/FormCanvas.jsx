'use client';

import FormField from './FormField';

export default function FormCanvas({ fields, selectedIndex, onSelect, onRemove, onDuplicate, onToggleRequired }) {
  return (
    <div className="space-y-2 min-h-[280px]">
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-line/80 dark:border-slate-700/80 bg-subtle dark:bg-slate-800/20">
          <div className="w-12 h-12 rounded-lg bg-accent-subtle dark:bg-teal-950/50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-accent-fg dark:text-accent-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-fg-secondary dark:text-fg-tertiary">Your form is empty</p>
          <p className="text-xs text-fg-tertiary mt-1">Add fields from the library on the left</p>
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
