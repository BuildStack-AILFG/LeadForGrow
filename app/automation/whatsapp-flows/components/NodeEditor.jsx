'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Bold, Italic, Link2, Smile, Plus } from 'lucide-react';
import { DEFAULT_SYSTEM_VARIABLES } from '@/lib/whatsappFlows/constants';

function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition';

// Helper to count total rows across all sections
function getTotalRows(sections) {
  return (sections || []).reduce((total, section) => total + (section.rows || []).length, 0);
}

/** WhatsApp-style rich-text toolbar: wraps selection in bold/italic markers, or inserts a variable */
function RichTextToolbar({ textareaRef, value, onChange, onInsertVariable }) {
  function wrap(marker) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || 'text';
    const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  return (
    <div className="flex items-center gap-1 mb-1.5">
      <button
        type="button"
        onClick={onInsertVariable}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-ink hover:underline px-1"
      >
        <Plus className="w-3 h-3" /> Add variable
      </button>
      <span className="flex-1" />
      <button type="button" onClick={() => {}} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
        <Smile className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => wrap('*')} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => wrap('_')} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => {}} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
        <Link2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Interakt-style "Select the way to trigger automation" panel */
function TriggerKeywordFields({ data, set }) {
  const [draft, setDraft] = useState('');
  const keywords = data.keywords || [];
  const saveResponseAs = data.saveResponseAs || { enabled: false, type: 'variable', key: '' };

  function addKeyword() {
    const v = draft.trim();
    if (!v || keywords.includes(v)) return;
    set('keywords', [...keywords, v]);
    setDraft('');
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Select the way to trigger automation</p>
      <div className="flex items-center gap-4 mb-3">
        {['exact', 'contains', 'any'].map((mode) => (
          <label key={mode} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 capitalize cursor-pointer">
            <input
              type="radio"
              checked={(data.matchMode || 'contains') === mode}
              onChange={() => set('matchMode', mode)}
              className="text-brand-ink focus:ring-brand/30"
            />
            {mode === 'exact' ? 'Exact Match' : mode}
          </label>
        ))}
      </div>

      {data.matchMode !== 'any' && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 mb-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">Enter the keywords that trigger this flow</p>
          <div className="flex items-center gap-1.5">
            <input
              className={`${inputClass} text-xs`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="Enter Keywords you want to include"
            />
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {keywords.join(',').length}/100
            </span>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-tint text-brand-ink border border-brand-tint-strong"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => set('keywords', keywords.filter((x) => x !== k))}
                    className="hover:text-rose-600 dark:hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(saveResponseAs.enabled)}
            onChange={(e) => set('saveResponseAs', { ...saveResponseAs, enabled: e.target.checked })}
            className="rounded border-slate-300 dark:border-slate-600 text-brand-ink focus:ring-brand/30"
          />
          Select where you want to save trigger response
        </label>
        {saveResponseAs.enabled && (
          <div className="pl-1 space-y-2">
            <div className="flex items-center gap-4">
              {['variable', 'trait'].map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    checked={saveResponseAs.type === t}
                    onChange={() => set('saveResponseAs', { ...saveResponseAs, type: t })}
                    className="text-brand-ink focus:ring-brand/30"
                  />
                  {t === 'variable' ? 'Workflow Variable' : 'User Trait'}
                </label>
              ))}
            </div>
            <input
              className={`${inputClass} text-xs`}
              value={saveResponseAs.key || ''}
              onChange={(e) => set('saveResponseAs', { ...saveResponseAs, key: e.target.value })}
              placeholder={saveResponseAs.type === 'trait' ? 'Select a trait' : 'Variable name'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Simple key/value list editor backing a `{ [field]: value }` data object. */
function FieldValueListEditor({ label, fields, onChange }) {
  const rows = Object.entries(fields || {});

  function updateRow(index, key, value) {
    const next = [...rows];
    next[index] = [key, value];
    onChange(Object.fromEntries(next.filter(([k]) => k)));
  }

  function removeRow(index) {
    const next = rows.filter((_, i) => i !== index);
    onChange(Object.fromEntries(next));
  }

  function addRow() {
    onChange(Object.fromEntries([...rows, ['', '']]));
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        {rows.map(([key, value], i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              className={`${inputClass} flex-1`}
              value={key}
              onChange={(e) => updateRow(i, e.target.value, value)}
              placeholder="field"
            />
            <input
              className={`${inputClass} flex-1`}
              value={value}
              onChange={(e) => updateRow(i, key, e.target.value)}
              placeholder="value or {{variable}}"
            />
            <button type="button" onClick={() => removeRow(i)} className="p-2 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-500 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1D4B3E] hover:underline"
        >
          <Plus className="w-3 h-3" /> Add field
        </button>
      </div>
    </Field>
  );
}

/** Variable + value→branch case list backing a logic_switch node's `variable`/`cases`. */
function SwitchCasesEditor({ variable, cases, onChange }) {
  function updateCase(index, patch) {
    const next = [...cases];
    next[index] = { ...next[index], ...patch };
    onChange({ cases: next });
  }

  function removeCase(index) {
    onChange({ cases: cases.filter((_, i) => i !== index) });
  }

  function addCase() {
    onChange({ cases: [...cases, { value: '', handle: '' }] });
  }

  return (
    <>
      <Field label="Variable to switch on">
        <input className={inputClass} value={variable} onChange={(e) => onChange({ variable: e.target.value })} placeholder="service" />
      </Field>
      <Field label="Cases (value → branch handle)">
        <div className="space-y-2">
          {cases.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                className={`${inputClass} flex-1`}
                value={c.value || ''}
                onChange={(e) => updateCase(i, { value: e.target.value })}
                placeholder="value"
              />
              <input
                className={`${inputClass} flex-1`}
                value={c.handle || ''}
                onChange={(e) => updateCase(i, { handle: e.target.value })}
                placeholder="branch name"
              />
              <button type="button" onClick={() => removeCase(i)} className="p-2 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-500 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCase}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1D4B3E] hover:underline"
          >
            <Plus className="w-3 h-3" /> Add case
          </button>
        </div>
      </Field>
    </>
  );
}

export default function NodeEditor({ node, onChange, onClose, variables = [] }) {
  const vars = variables.length ? variables : DEFAULT_SYSTEM_VARIABLES;
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  // Fetch available templates on mount
  useEffect(() => {
    if (node?.type === 'action_send_template') {
      fetchTemplates();
    }
  }, [node?.type]);

  useEffect(() => {
    if (node?.type !== 'action_assign') return;
    fetch('/api/automation/team')
      .then((r) => r.json())
      .then((res) => { if (res.success) setTeamMembers(res.data || []); })
      .catch(() => {});
  }, [node?.type]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch('/api/automation/templates');
      const data = await response.json();
      if (data.success && data.manual) {
        setTemplates(data.manual);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const syncTemplatesFromMeta = async () => {
    setSyncingTemplates(true);
    setSyncMessage('Syncing...');
    try {
      const response = await fetch('/api/automation/templates/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setSyncMessage('✓ ' + data.message);
        await fetchTemplates(); // Refresh the list
        setTimeout(() => setSyncMessage(''), 3000);
      } else {
        setSyncMessage('❌ ' + (data.error || 'Sync failed'));
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error syncing templates:', error);
      setSyncMessage('❌ Failed to sync templates');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setSyncingTemplates(false);
    }
  };

  const textareaRef = useRef(null);

  if (!node) {
    return (
      <div className="w-full flex flex-col rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node settings</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Select a node on the canvas</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {vars.map((v) => (
              <code
                key={v.key}
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700"
              >
                {`{{${v.key}}}`}
              </code>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const data = node.data || {};

  function set(key, value) {
    onChange({ ...data, [key]: value });
  }

  // Explicit per-node-type mapping — the field a message actually renders into
  // varies by node type (send_text uses `text`, buttons/list use `body`, media
  // uses `caption`, etc.), so guessing from which field happens to be non-empty
  // silently wrote into an unrendered field for node types not covered by that
  // heuristic (e.g. media nodes), making "Insert variable" look like a no-op.
  const INSERT_VAR_FIELD_BY_TYPE = {
    action_send_text: 'text',
    action_ai_response: 'prompt',
    action_send_buttons: 'body',
    action_send_list: 'body',
    action_send_image: 'caption',
    action_send_video: 'caption',
    action_send_document: 'caption',
    action_send_audio: 'caption',
    action_http: 'body',
    action_webhook: 'body',
    logic_save_variable: 'value',
  };

  function insertVar(key) {
    const field = INSERT_VAR_FIELD_BY_TYPE[node.type] || 'text';
    set(field, `${data[field] || ''}{{${key}}}`);
  }

  return (
    <div className="w-full flex flex-col rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden h-full border-l-4" style={{ borderLeftColor: '#1D4B3E' }}>
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
            {data.label || node.type}
          </p>
          <p className="text-[11px] text-slate-400 truncate">{node.type}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Field label="Node Name">
          <input className={inputClass} value={data.label || ''} onChange={(e) => set('label', e.target.value)} />
        </Field>

        {(node.type === 'action_send_text' || node.type === 'action_ai_response') && (
          <Field label={node.type === 'action_ai_response' ? 'Prompt' : 'Message'}>
            {node.type === 'action_send_text' && (
              <RichTextToolbar
                textareaRef={textareaRef}
                value={data.text || ''}
                onChange={(v) => set('text', v)}
                onInsertVariable={() => insertVar('customer_name')}
              />
            )}
            <textarea
              ref={node.type === 'action_send_text' ? textareaRef : undefined}
              rows={4}
              className={inputClass}
              value={data.text || data.prompt || ''}
              onChange={(e) => set(node.type === 'action_ai_response' ? 'prompt' : 'text', e.target.value)}
              placeholder="Hi {{customer_name}}…"
            />
          </Field>
        )}

        {node.type === 'action_send_template' && (
          <>
            <Field label="Template">
              <div className="space-y-2">
                <select
                  className={`${inputClass} cursor-pointer bg-white dark:bg-slate-900`}
                  value={data.templateName || ''}
                  onChange={(e) => {
                    const templateName = e.target.value;
                    console.log('[NodeEditor] Template selected:', templateName);
                    if (templateName && templateName.trim()) {
                      const selected = templates.find((t) => t.name === templateName);
                      console.log('[NodeEditor] Found template:', selected);
                      if (selected) {
                        const newData = {
                          ...data,
                          templateName: selected.name,
                          language: selected.language || 'en',
                        };
                        console.log('[NodeEditor] Updating data:', newData);
                        onChange(newData);
                      }
                    } else if (!templateName) {
                      // Clear selection
                      onChange({
                        ...data,
                        templateName: '',
                      });
                    }
                  }}
                  disabled={loadingTemplates || syncingTemplates}
                >
                  <option value="">
                    {syncingTemplates ? 'Syncing templates...' : loadingTemplates ? 'Loading templates...' : 'Select a template'}
                  </option>
                  {templates && templates.length > 0 ? (
                    templates.map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} {t.isMetaTemplate ? '⭐ (Meta)' : ''}
                      </option>
                    ))
                  ) : (
                    <option disabled>No templates available</option>
                  )}
                </select>
              </div>

              {templates.length === 0 && !loadingTemplates && !syncingTemplates && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">No templates found</p>
                  <button
                    type="button"
                    onClick={syncTemplatesFromMeta}
                    disabled={syncingTemplates}
                    className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline disabled:opacity-50"
                  >
                    ↻ Sync templates from WhatsApp
                  </button>
                </div>
              )}

              {data.templateName && templates.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">✓ {data.templateName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Language: {data.language || 'en'}</p>
                </div>
              )}

              {syncMessage && (
                <p className={`text-[11px] font-medium mt-1.5 ${syncMessage.startsWith('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {syncMessage}
                </p>
              )}
            </Field>

            <Field label="Language">
              <input
                className={inputClass}
                value={data.language || 'en'}
                onChange={(e) => set('language', e.target.value)}
                placeholder="en"
                disabled={!data.templateName}
              />
            </Field>
          </>
        )}

        {node.type === 'action_send_buttons' && (
          <>
            <Field label="Body">
              <textarea rows={3} className={inputClass} value={data.body || ''} onChange={(e) => set('body', e.target.value)} />
            </Field>
            <Field label="Buttons (max 3)">
              {(data.buttons || []).slice(0, 3).map((btn, i) => (
                <input
                  key={i}
                  className={`${inputClass} mb-1.5`}
                  value={btn.title || ''}
                  onChange={(e) => {
                    const buttons = [...(data.buttons || [])];
                    buttons[i] = { ...buttons[i], id: buttons[i]?.id || `btn_${i + 1}`, title: e.target.value };
                    set('buttons', buttons);
                  }}
                  placeholder={`Button ${i + 1}`}
                />
              ))}
              {(data.buttons || []).length < 3 && (
                <button
                  type="button"
                  className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                  onClick={() =>
                    set('buttons', [
                      ...(data.buttons || []),
                      { id: `btn_${(data.buttons || []).length + 1}`, title: 'Option' },
                    ])
                  }
                >
                  + Add button
                </button>
              )}
            </Field>
          </>
        )}

        {node.type === 'action_send_list' && (
          <>
            {/* Header */}
            <Field label="Header (Optional)">
              <input 
                className={inputClass} 
                value={data.header || ''} 
                onChange={(e) => set('header', e.target.value)}
                placeholder="e.g., Select a service"
              />
            </Field>

            {/* Body */}
            <Field label="Body">
              <textarea 
                rows={3} 
                className={inputClass} 
                value={data.body || ''} 
                onChange={(e) => set('body', e.target.value)}
                placeholder="Pick from the list:"
              />
              {(!data.body || !data.body.trim()) && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">Required</p>
              )}
            </Field>

            {/* Footer */}
            <Field label="Footer (Optional)">
              <input 
                className={inputClass} 
                value={data.footer || ''} 
                onChange={(e) => set('footer', e.target.value)}
                placeholder="e.g., Reply with selection"
              />
            </Field>

            {/* Button Text */}
            <Field label="Button Text">
              <input 
                className={inputClass} 
                value={data.buttonText || ''} 
                onChange={(e) => set('buttonText', e.target.value)}
                placeholder="View options"
              />
              {(!data.buttonText || !data.buttonText.trim()) && (
                <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">Required</p>
              )}
            </Field>

            {/* Sections Builder */}
            <Field label="Sections">
              <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50">
                {(data.sections || []).map((section, sIdx) => (
                  <div key={sIdx} className="border-l-2 border-teal-400 pl-3 py-2 bg-white dark:bg-slate-900 rounded px-2">
                    {/* Section Title */}
                    <div className="mb-2">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Section Title</label>
                      <input
                        className={`${inputClass} text-xs`}
                        value={section.title || ''}
                        onChange={(e) => {
                          const newSections = [...(data.sections || [])];
                          newSections[sIdx].title = e.target.value;
                          set('sections', newSections);
                        }}
                        placeholder="e.g., Services"
                      />
                    </div>

                    {/* Rows */}
                    <div className="space-y-1.5 mb-2">
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Rows</div>
                      {(section.rows || []).map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5 items-start bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-200 dark:border-slate-700">
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              className={`${inputClass} text-xs`}
                              value={row.id || ''}
                              onChange={(e) => {
                                const newSections = [...(data.sections || [])];
                                newSections[sIdx].rows[rIdx].id = e.target.value;
                                set('sections', newSections);
                              }}
                              placeholder="Value/ID (e.g., complete_service)"
                            />
                            <input
                              className={`${inputClass} text-xs`}
                              value={row.title || ''}
                              onChange={(e) => {
                                const newSections = [...(data.sections || [])];
                                newSections[sIdx].rows[rIdx].title = e.target.value;
                                set('sections', newSections);
                              }}
                              placeholder="Title (e.g., Complete Service)"
                            />
                            <input
                              className={`${inputClass} text-xs`}
                              value={row.description || ''}
                              onChange={(e) => {
                                const newSections = [...(data.sections || [])];
                                newSections[sIdx].rows[rIdx].description = e.target.value;
                                set('sections', newSections);
                              }}
                              placeholder="Description (optional)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSections = [...(data.sections || [])];
                              newSections[sIdx].rows.splice(rIdx, 1);
                              set('sections', newSections);
                            }}
                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 px-1.5 py-1 rounded whitespace-nowrap mt-6"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Row */}
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = [...(data.sections || [])];
                        if (!newSections[sIdx].rows) newSections[sIdx].rows = [];
                        newSections[sIdx].rows.push({
                          id: `row_${Date.now()}`,
                          title: 'New Row',
                          description: '',
                        });
                        set('sections', newSections);
                      }}
                      disabled={(section.rows || []).length >= 10}
                      className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-50"
                    >
                      + Add Row
                    </button>

                    {/* Delete Section */}
                    <button
                      type="button"
                      onClick={() => {
                        const newSections = (data.sections || []).filter((_, i) => i !== sIdx);
                        set('sections', newSections);
                      }}
                      disabled={(data.sections || []).length === 1}
                      className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2 disabled:opacity-50"
                    >
                      Delete Section
                    </button>
                  </div>
                ))}

                {/* Add Section */}
                <button
                  type="button"
                  onClick={() => {
                    const newSections = [...(data.sections || [])];
                    newSections.push({
                      title: `Section ${newSections.length + 1}`,
                      rows: [{ id: 'row_1', title: 'Option 1', description: '' }],
                    });
                    set('sections', newSections);
                  }}
                  className="text-[11px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 w-full py-1"
                >
                  + Add Section
                </button>

                {/* Validation */}
                {getTotalRows(data.sections) > 10 && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">⚠ Maximum 10 rows total. Current: {getTotalRows(data.sections)}</p>
                )}
              </div>
            </Field>

            {/* Store Response */}
            <Field label="Store selected value as">
              <input
                className={inputClass}
                value={data.saveAs || 'selected_option'}
                onChange={(e) => set('saveAs', e.target.value)}
                placeholder="Variable name (e.g., service)"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">e.g., service = complete_service</p>
            </Field>

            {/* WhatsApp Preview */}
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-200 mb-2">📱 WhatsApp Preview</p>
              <div className="text-[11px] space-y-2">
                {data.header && <div className="font-medium text-slate-900 dark:text-slate-50">{data.header}</div>}
                <div className="text-slate-700 dark:text-slate-200">{data.body || '(Empty body)'}</div>
                {data.footer && <div className="text-slate-600 dark:text-slate-300 text-[10px]">{data.footer}</div>}
                <div className="bg-white dark:bg-slate-900 rounded p-2 border border-emerald-200 dark:border-emerald-800 space-y-1 mt-1">
                  {(data.sections || []).map((section, sIdx) => (
                    <div key={sIdx}>
                      <div className="font-medium text-slate-800 dark:text-slate-100 text-[10px]">{section.title}</div>
                      {(section.rows || []).map((row, rIdx) => (
                        <div key={rIdx} className="text-slate-600 dark:text-slate-300 pl-2 text-[10px]">
                          • {row.title} {row.description ? `- ${row.description}` : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="text-center text-slate-600 dark:text-slate-300 font-medium text-[10px] bg-teal-100 dark:bg-teal-900/30 py-1 rounded">
                  {data.buttonText || 'View options'}
                </div>
              </div>
            </div>
          </>
        )}

        {['action_send_image', 'action_send_video', 'action_send_document', 'action_send_audio'].includes(node.type) && (
          <>
            <Field label="Media URL">
              <input className={inputClass} value={data.mediaUrl || ''} onChange={(e) => set('mediaUrl', e.target.value)} />
            </Field>
            <Field label="Caption">
              <input className={inputClass} value={data.caption || ''} onChange={(e) => set('caption', e.target.value)} />
            </Field>
          </>
        )}

        {node.type === 'action_delay' && (
          <Field label="Delay (seconds)">
            <input
              type="number"
              className={inputClass}
              value={data.delaySeconds || 60}
              onChange={(e) => set('delaySeconds', Number(e.target.value))}
            />
          </Field>
        )}

        {node.type === 'trigger_keyword' && (
          <TriggerKeywordFields data={data} set={set} />
        )}

        {node.type === 'logic_wait_reply' && (
          <Field label="Save reply as">
            <input className={inputClass} value={data.saveAs || 'last_reply'} onChange={(e) => set('saveAs', e.target.value)} />
          </Field>
        )}

        {node.type === 'logic_save_variable' && (
          <>
            <Field label="Variable key">
              <input className={inputClass} value={data.key || ''} onChange={(e) => set('key', e.target.value)} />
            </Field>
            <Field label="Value">
              <input className={inputClass} value={data.value || ''} onChange={(e) => set('value', e.target.value)} placeholder="{{last_reply}}" />
            </Field>
          </>
        )}

        {node.type === 'logic_if_else' && (
          <>
            <Field label="Variable">
              <input className={inputClass} value={data.variable || ''} onChange={(e) => set('variable', e.target.value)} />
            </Field>
            <Field label="Operator">
              <select className={inputClass} value={data.operator || 'contains'} onChange={(e) => set('operator', e.target.value)}>
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="not_equals">not equals</option>
                <option value="exists">exists</option>
              </select>
            </Field>
            <Field label="Value">
              <input className={inputClass} value={data.value || ''} onChange={(e) => set('value', e.target.value)} />
            </Field>
          </>
        )}

        {node.type === 'logic_goto' && (
          <Field label="Target node id">
            <input className={inputClass} value={data.targetNodeKey || ''} onChange={(e) => set('targetNodeKey', e.target.value)} />
          </Field>
        )}

        {['action_add_tag', 'action_remove_tag'].includes(node.type) && (
          <Field label="Tag">
            <input className={inputClass} value={data.tag || ''} onChange={(e) => set('tag', e.target.value)} />
          </Field>
        )}

        {['action_http', 'action_webhook'].includes(node.type) && (
          <>
            <Field label="URL">
              <input className={inputClass} value={data.url || ''} onChange={(e) => set('url', e.target.value)} />
            </Field>
            <Field label="Method">
              <select className={inputClass} value={data.method || 'POST'} onChange={(e) => set('method', e.target.value)}>
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
              </select>
            </Field>
            <Field label="Body JSON">
              <textarea rows={3} className={inputClass} value={data.body || '{}'} onChange={(e) => set('body', e.target.value)} />
            </Field>
          </>
        )}

        {node.type === 'action_assign' && (
          <Field label="Assign to">
            <select className={inputClass} value={data.userId || ''} onChange={(e) => set('userId', e.target.value)}>
              <option value="">— Choose a team member —</option>
              {teamMembers.map((m) => {
                const id = m.userId?._id || m.userId || m._id;
                const label = [m.userId?.firstName || m.firstName, m.userId?.lastName || m.lastName].filter(Boolean).join(' ') || m.userId?.email || m.email;
                return <option key={id} value={id}>{label}</option>;
              })}
            </select>
          </Field>
        )}

        {(node.type === 'action_update_contact' || node.type === 'action_update_lead') && (
          <FieldValueListEditor
            label={node.type === 'action_update_contact' ? 'Contact fields to update' : 'Lead fields to update'}
            fields={data.fields || {}}
            onChange={(fields) => set('fields', fields)}
          />
        )}

        {node.type === 'action_create_lead' && (
          <>
            <Field label="Lead name">
              <input className={inputClass} value={data.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="{{customer_name}}" />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={data.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="{{phone}}" />
            </Field>
            <Field label="Source">
              <input className={inputClass} value={data.source || ''} onChange={(e) => set('source', e.target.value)} placeholder="whatsapp_flow" />
            </Field>
          </>
        )}

        {node.type === 'logic_switch' && (
          <SwitchCasesEditor
            variable={data.variable || ''}
            cases={data.cases || []}
            onChange={(patch) => onChange({ ...data, ...patch })}
          />
        )}

        {['trigger_incoming_message', 'trigger_contact_created', 'trigger_lead_created', 'trigger_manual', 'trigger_webhook'].includes(node.type) && (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
            {node.type === 'trigger_incoming_message' && 'Starts this flow whenever a WhatsApp message arrives — no configuration needed.'}
            {node.type === 'trigger_contact_created' && 'Starts this flow whenever a new contact is created — no configuration needed.'}
            {node.type === 'trigger_lead_created' && 'Starts this flow whenever a new lead is created — no configuration needed.'}
            {node.type === 'trigger_manual' && 'This flow only starts when triggered manually from the inbox or via the API — no configuration needed.'}
            {node.type === 'trigger_webhook' && 'This flow starts when its webhook URL receives a POST request — no configuration needed.'}
          </p>
        )}

        {node.type === 'action_end' && (
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-teal-600 dark:text-teal-400 focus:ring-teal-500"
              checked={Boolean(data.markConverted)}
              onChange={(e) => set('markConverted', e.target.checked)}
            />
            Mark as conversion
          </label>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Insert variable</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_SYSTEM_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                onClick={() => insertVar(v.key)}
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
