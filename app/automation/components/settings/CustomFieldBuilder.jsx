'use client';

import { useState } from 'react';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { SettingsCard, SettingsField, SettingsInput, SettingsSelect } from './SettingsCard';

const FIELD_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Number' },
  { id: 'dropdown', label: 'Dropdown' },
  { id: 'date', label: 'Date' },
  { id: 'tags', label: 'Tags' },
  { id: 'boolean', label: 'Yes / No' }
];

export default function CustomFieldBuilder({ fields: initialFields, onChange }) {
  const [fields, setFields] = useState(initialFields);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', type: 'text', required: false, entity: 'lead' });

  const addField = () => {
    if (!draft.name.trim()) return;
    const next = [...fields, { ...draft, id: String(Date.now()), options: draft.type === 'dropdown' ? ['Option 1'] : undefined }];
    setFields(next);
    onChange?.(next);
    setDraft({ name: '', type: 'text', required: false, entity: 'lead' });
    setShowAdd(false);
  };

  const removeField = (id) => {
    const next = fields.filter((f) => f.id !== id);
    setFields(next);
    onChange?.(next);
  };

  return (
    <SettingsCard title="Custom fields" description="Define additional properties for leads and deals">
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 group">
            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{field.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{field.type} · {field.entity}{field.required ? ' · Required' : ''}</p>
            </div>
            <button type="button" onClick={() => removeField(field.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="mt-4 p-4 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SettingsField label="Field name">
              <SettingsInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Budget" />
            </SettingsField>
            <SettingsField label="Type">
              <SettingsSelect value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                {FIELD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </SettingsSelect>
            </SettingsField>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addField} className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded-lg">Add field</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
          <Plus className="w-3.5 h-3.5" /> Add custom field
        </button>
      )}
    </SettingsCard>
  );
}
