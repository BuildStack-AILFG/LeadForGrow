'use client';

const SOURCES = [
  { value: 'lead.name', label: 'Lead name' },
  { value: 'lead.email', label: 'Lead email' },
  { value: 'lead.phone', label: 'Lead phone' },
  { value: 'lead.company', label: 'Lead company' },
  { value: 'lead.city', label: 'Lead city' },
  { value: 'literal', label: 'Fixed text (same for all)' },
];

export default function VariableMapping({ template, mapping, onChange }) {
  const body = template?.components?.find((c) => c.type === 'BODY');
  const varCount = (body?.text?.match(/\{\{(\d+)\}\}/g) || []).length;

  if (varCount === 0) return null;

  const rows = Array.from({ length: varCount }, (_, i) => {
    const idx = i + 1;
    const found = (mapping || []).find((m) => m.index === idx);
    return found || { index: idx, source: 'lead.name', literalValue: '' };
  });

  const updateRow = (index, patch) => {
    const next = rows.map((r) => (r.index === index ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        Personalise template variables
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
        Each <code>{'{{n}}'}</code> in the template body gets replaced per recipient.
      </p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.index} className="grid grid-cols-[60px_1fr_1fr] gap-2 items-center">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{`{{${row.index}}}`}</span>
            <select value={row.source} onChange={(e) => updateRow(row.index, { source: e.target.value })}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {row.source === 'literal' ? (
              <input value={row.literalValue || ''}
                onChange={(e) => updateRow(row.index, { literalValue: e.target.value })}
                placeholder="Same value for everyone"
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
            ) : (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Preview: {previewValue(row.source)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function previewValue(source) {
  return {
    'lead.name': 'Rahul Sharma',
    'lead.email': 'rahul@example.com',
    'lead.phone': '+91 98765 43210',
    'lead.company': 'Acme Motors',
    'lead.city': 'Mumbai',
  }[source] || '—';
}
