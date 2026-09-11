'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_SYSTEM_VARIABLES } from '@/lib/whatsappFlows/constants';

function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 transition';

// Helper to count total rows across all sections
function getTotalRows(sections) {
  return (sections || []).reduce((total, section) => total + (section.rows || []).length, 0);
}

export default function NodeEditor({ node, onChange, onDelete, variables = [] }) {
  const vars = variables.length ? variables : DEFAULT_SYSTEM_VARIABLES;
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Fetch available templates on mount
  useEffect(() => {
    if (node?.type === 'action_send_template') {
      fetchTemplates();
    }
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

  if (!node) {
    return (
      <aside className="w-72 shrink-0 flex flex-col rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm overflow-hidden hidden lg:flex">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node settings</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Select a node on the canvas</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {vars.map((v) => (
              <code
                key={v.key}
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 text-emerald-700 border border-slate-200"
              >
                {`{{${v.key}}}`}
              </code>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  const data = node.data || {};

  function set(key, value) {
    onChange({ ...data, [key]: value });
  }

  function insertVar(key) {
    const field =
      data.text != null ? 'text' : data.body != null ? 'body' : data.prompt != null ? 'prompt' : 'text';
    set(field, `${data[field] || ''}{{${key}}}`);
  }

  return (
    <aside className="w-72 shrink-0 flex flex-col rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm overflow-hidden hidden lg:flex">
      <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node settings</h3>
          <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
            {data.label || node.type}
          </p>
          <p className="text-[11px] text-slate-400 truncate">{node.type}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors shrink-0"
        >
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Field label="Node Name">
          <input className={inputClass} value={data.label || ''} onChange={(e) => set('label', e.target.value)} />
        </Field>

        {(node.type === 'action_send_text' || node.type === 'action_ai_response') && (
          <Field label={node.type === 'action_ai_response' ? 'Prompt' : 'Message'}>
            <textarea
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
                  className={`${inputClass} cursor-pointer bg-white`}
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
                  <p className="text-[11px] text-amber-600 font-medium">No templates found</p>
                  <button
                    type="button"
                    onClick={syncTemplatesFromMeta}
                    disabled={syncingTemplates}
                    className="text-[11px] font-medium text-teal-600 hover:text-teal-700 hover:underline disabled:opacity-50"
                  >
                    ↻ Sync templates from WhatsApp
                  </button>
                </div>
              )}

              {data.templateName && templates.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-emerald-600 font-medium">✓ {data.templateName}</p>
                  <p className="text-[10px] text-slate-500">Language: {data.language || 'en'}</p>
                </div>
              )}

              {syncMessage && (
                <p className={`text-[11px] font-medium mt-1.5 ${syncMessage.startsWith('✓') ? 'text-emerald-600' : 'text-amber-600'}`}>
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
                  className="text-xs font-medium text-teal-600 hover:text-teal-700"
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
                <p className="text-[11px] text-red-600 mt-1">Required</p>
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
                <p className="text-[11px] text-red-600 mt-1">Required</p>
              )}
            </Field>

            {/* Sections Builder */}
            <Field label="Sections">
              <div className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
                {(data.sections || []).map((section, sIdx) => (
                  <div key={sIdx} className="border-l-2 border-teal-400 pl-3 py-2 bg-white rounded px-2">
                    {/* Section Title */}
                    <div className="mb-2">
                      <label className="text-[11px] font-medium text-slate-600">Section Title</label>
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
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Rows</div>
                      {(section.rows || []).map((row, rIdx) => (
                        <div key={rIdx} className="flex gap-1.5 items-start bg-slate-50 p-1.5 rounded border border-slate-200">
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
                            className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-1.5 py-1 rounded whitespace-nowrap mt-6"
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
                      className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
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
                      className="text-[11px] font-medium text-red-600 hover:text-red-700 ml-2 disabled:opacity-50"
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
                  className="text-[11px] font-medium text-teal-600 hover:text-teal-700 w-full py-1"
                >
                  + Add Section
                </button>

                {/* Validation */}
                {getTotalRows(data.sections) > 10 && (
                  <p className="text-[11px] text-red-600 font-medium">⚠ Maximum 10 rows total. Current: {getTotalRows(data.sections)}</p>
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
              <p className="text-[10px] text-slate-500 mt-1">e.g., service = complete_service</p>
            </Field>

            {/* WhatsApp Preview */}
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[10px] font-semibold text-emerald-800 mb-2">📱 WhatsApp Preview</p>
              <div className="text-[11px] space-y-2">
                {data.header && <div className="font-medium text-slate-900">{data.header}</div>}
                <div className="text-slate-700">{data.body || '(Empty body)'}</div>
                {data.footer && <div className="text-slate-600 text-[10px]">{data.footer}</div>}
                <div className="bg-white rounded p-2 border border-emerald-200 space-y-1 mt-1">
                  {(data.sections || []).map((section, sIdx) => (
                    <div key={sIdx}>
                      <div className="font-medium text-slate-800 text-[10px]">{section.title}</div>
                      {(section.rows || []).map((row, rIdx) => (
                        <div key={rIdx} className="text-slate-600 pl-2 text-[10px]">
                          • {row.title} {row.description ? `- ${row.description}` : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="text-center text-slate-600 font-medium text-[10px] bg-teal-100 py-1 rounded">
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
          <Field label="Keywords (comma-separated)">
            <input
              className={inputClass}
              value={(data.keywords || []).join(', ')}
              onChange={(e) =>
                set(
                  'keywords',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </Field>
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

        {node.type === 'action_end' && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              checked={Boolean(data.markConverted)}
              onChange={(e) => set('markConverted', e.target.checked)}
            />
            Mark as conversion
          </label>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Insert variable</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_SYSTEM_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 text-emerald-700 border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                onClick={() => insertVar(v.key)}
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
