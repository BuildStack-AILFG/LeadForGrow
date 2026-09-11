'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Loader2, Send, RefreshCw, ChevronLeft, AlertCircle, CheckCircle2, Info, Upload, X } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import WhatsAppPreview from './WhatsAppPreview';

const CATEGORIES = [
  { id: 'MARKETING', label: 'Marketing', desc: 'Promos, offers, product updates. Requires opt-in.' },
  { id: 'UTILITY', label: 'Utility', desc: 'Order updates, receipts, account alerts.' },
  { id: 'AUTHENTICATION', label: 'Authentication', desc: 'One-time passcodes and verification.' },
];

const LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'bn', label: 'Bengali' },
  { code: 'pa', label: 'Punjabi' },
];

const HEADER_FORMATS = ['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'];

function emptyTemplate() {
  return {
    name: '',
    language: 'en_US',
    category: 'MARKETING',
    components: [
      { type: 'HEADER', format: 'NONE', text: '', example: { header_text: [], header_handle: [] } },
      { type: 'BODY', text: '', example: { body_text: [[]] } },
      { type: 'FOOTER', text: '' },
      { type: 'BUTTONS', buttons: [] },
    ],
  };
}

function normalizeIncoming(t) {
  const base = emptyTemplate();
  const map = new Map(base.components.map((c) => [c.type, c]));
  (t.components || []).forEach((c) => map.set(c.type, { ...map.get(c.type), ...c }));
  return {
    ...t,
    components: Array.from(map.values()),
  };
}

function countVars(text) {
  return (text?.match(/\{\{\d+\}\}/g) || []).length;
}

/**
 * Live validation — returns per-section issue lists so the UI can show inline
 * warnings and disable Submit before the user hits it. Mirrors the same rules
 * the backend uses in /api/automation/whatsapp-templates/[id]/submit.
 */
function validateTemplate(t) {
  const issues = { basics: [], header: [], body: [], footer: [], buttons: [] };

  const name = String(t.name || '').trim();
  if (!name) issues.basics.push('Name is required');
  else if (!/^[a-z0-9_]+$/.test(name)) issues.basics.push('Name must be lowercase letters, numbers, underscores only');
  if (!t.category) issues.basics.push('Category is required');
  if (!t.language) issues.basics.push('Language is required');

  const header = t.components.find((c) => c.type === 'HEADER');
  if (header && header.format && header.format !== 'NONE') {
    if (header.format === 'TEXT') {
      if (!header.text?.trim()) issues.header.push('Header text is required');
      else if (header.text.length > 60) issues.header.push('Header text must be 60 chars or fewer');
    }
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format)) {
      if (!header.example?.header_handle?.length) {
        issues.header.push(`Upload a sample ${header.format.toLowerCase()} — Meta needs it for review`);
      }
    }
  }

  const body = t.components.find((c) => c.type === 'BODY');
  if (!body?.text?.trim()) issues.body.push('Message body is required');
  else if (body.text.length > 1024) issues.body.push('Body must be 1024 chars or fewer');
  else {
    const varCount = countVars(body.text);
    if (varCount > 0) {
      const examples = body.example?.body_text?.[0] || [];
      const missing = examples.filter((v) => !String(v || '').trim()).length;
      if (examples.length !== varCount) issues.body.push(`Fill sample values for all ${varCount} variables`);
      else if (missing > 0) issues.body.push(`${missing} variable sample value(s) are blank`);
    }
  }

  const footer = t.components.find((c) => c.type === 'FOOTER');
  if (footer?.text && footer.text.length > 60) issues.footer.push('Footer must be 60 chars or fewer');

  const buttons = t.components.find((c) => c.type === 'BUTTONS');
  if (buttons?.buttons?.length) {
    if (buttons.buttons.length > 10) issues.buttons.push('Max 10 buttons allowed');
    buttons.buttons.forEach((b, i) => {
      if (!b.text?.trim()) issues.buttons.push(`Button ${i + 1}: text is required`);
      if (b.type === 'URL' && !b.url?.trim()) issues.buttons.push(`Button ${i + 1}: URL is required`);
      if (b.type === 'PHONE_NUMBER' && !b.phone_number?.trim()) issues.buttons.push(`Button ${i + 1}: phone number is required`);
    });
  }

  const total = Object.values(issues).reduce((a, b) => a + b.length, 0);
  return { issues, valid: total === 0, totalCount: total };
}

export default function TemplateBuilder({ templateId, onBack, onSaved }) {
  const [template, setTemplate] = useState(emptyTemplate());
  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isNew = !templateId;
  const readOnly = ['PENDING', 'APPROVED'].includes(template.status);

  useEffect(() => {
    if (!templateId) return;
    (async () => {
      try {
        const res = await authFetch(`/api/automation/whatsapp-templates/${templateId}`);
        const data = await res.json();
        if (data.success) setTemplate(normalizeIncoming(data.data));
        else toast.error(data.error || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [templateId]);

  const header = template.components.find((c) => c.type === 'HEADER');
  const body = template.components.find((c) => c.type === 'BODY');
  const footer = template.components.find((c) => c.type === 'FOOTER');
  const buttons = template.components.find((c) => c.type === 'BUTTONS');

  const bodyVarCount = countVars(body?.text);
  const headerVarCount = header?.format === 'TEXT' ? countVars(header?.text) : 0;

  const validation = useMemo(() => validateTemplate(template), [template]);

  useEffect(() => {
    setTemplate((prev) => {
      const next = { ...prev, components: prev.components.map((c) => ({ ...c })) };
      const b = next.components.find((c) => c.type === 'BODY');
      if (b) {
        const current = b.example?.body_text?.[0] || [];
        const resized = Array.from({ length: bodyVarCount }, (_, i) => current[i] || '');
        b.example = { body_text: [resized] };
      }
      const h = next.components.find((c) => c.type === 'HEADER');
      if (h && h.format === 'TEXT') {
        const current = h.example?.header_text || [];
        h.example = {
          ...h.example,
          header_text: Array.from({ length: headerVarCount }, (_, i) => current[i] || ''),
        };
      }
      return next;
    });
  }, [bodyVarCount, headerVarCount]);

  const updateComponent = (type, patch) => {
    setTemplate((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.type === type ? { ...c, ...patch } : c)),
    }));
  };

  const insertBodyVar = () => {
    const nextIdx = bodyVarCount + 1;
    updateComponent('BODY', { text: `${body?.text || ''}{{${nextIdx}}}` });
  };

  const addButton = (type) => {
    if ((buttons?.buttons?.length || 0) >= 10) {
      return toast.error('Meta allows at most 10 buttons');
    }
    const next = [...(buttons?.buttons || [])];
    if (type === 'QUICK_REPLY') next.push({ type, text: 'Reply' });
    if (type === 'URL') next.push({ type, text: 'Visit', url: 'https://example.com' });
    if (type === 'PHONE_NUMBER') next.push({ type, text: 'Call us', phone_number: '+911234567890' });
    updateComponent('BUTTONS', { buttons: next });
  };

  const previewTemplate = useMemo(() => {
    const cleaned = { ...template, components: template.components.filter((c) => {
      if (c.type === 'HEADER') return c.format && c.format !== 'NONE';
      if (c.type === 'FOOTER') return Boolean(c.text?.trim());
      if (c.type === 'BUTTONS') return (c.buttons?.length || 0) > 0;
      return true;
    }) };
    return cleaned;
  }, [template]);

  const buildPayload = () => {
    const components = [];
    if (header?.format && header.format !== 'NONE') {
      const comp = { type: 'HEADER', format: header.format };
      if (header.format === 'TEXT') {
        comp.text = header.text || '';
        if (headerVarCount > 0) comp.example = { header_text: header.example?.header_text || [] };
      }
      if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format)) {
        // Meta requires a sample media handle (from Resumable Upload) for review
        if (header.example?.header_handle?.length) {
          comp.example = { header_handle: header.example.header_handle };
        }
        // Preserve the display filename on the local record (Meta ignores it)
        if (header.example?.header_filename) {
          comp.example = { ...(comp.example || {}), header_filename: header.example.header_filename };
        }
      }
      components.push(comp);
    }
    components.push({
      type: 'BODY',
      text: body?.text || '',
      ...(bodyVarCount > 0 ? { example: { body_text: body?.example?.body_text || [[]] } } : {}),
    });
    if (footer?.text?.trim()) components.push({ type: 'FOOTER', text: footer.text.trim() });
    if (buttons?.buttons?.length) components.push({ type: 'BUTTONS', buttons: buttons.buttons });
    return {
      name: template.name.trim().toLowerCase().replace(/\s+/g, '_'),
      language: template.language,
      category: template.category,
      components,
    };
  };

  const saveDraft = async () => {
    if (!template.name.trim()) return toast.error('Template name is required');
    if (!/^[a-z0-9_]+$/.test(template.name.trim().toLowerCase().replace(/\s+/g, '_'))) {
      return toast.error('Use only lowercase letters, numbers, underscores');
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const url = isNew ? '/api/automation/whatsapp-templates' : `/api/automation/whatsapp-templates/${templateId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Draft saved');
      onSaved?.(data.data);
      if (isNew) {
        // navigate to edit mode via callback
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitToMeta = async () => {
    if (isNew) {
      await saveDraft();
      toast('Save first, then submit again', { icon: 'ℹ️' });
      return;
    }
    setSubmitting(true);
    try {
      // Save latest edits first
      await authFetch(`/api/automation/whatsapp-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const res = await authFetch(`/api/automation/whatsapp-templates/${templateId}/submit`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        const detail = data.validationErrors?.join(' • ') || data.error;
        throw new Error(detail);
      }
      toast.success('Submitted to Meta for approval');
      setTemplate(normalizeIncoming(data.data));
      onSaved?.(data.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const refreshStatus = async () => {
    if (isNew || !template.metaTemplateId) return;
    setRefreshing(true);
    try {
      const res = await authFetch(`/api/automation/whatsapp-templates/${templateId}/refresh`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTemplate(normalizeIncoming(data.data));
      toast.success(`Status: ${data.data.status}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <PageLoader label="Loading template…" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
              {isNew ? 'New WhatsApp template' : template.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <StatusBadge status={template.status} />
              {template.metaLastCheckedAt && (
                <span>Last checked {new Date(template.metaLastCheckedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template.metaTemplateId && (
            <button type="button" onClick={refreshStatus} disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh status
            </button>
          )}
          {!readOnly && (
            <button type="button" onClick={saveDraft} disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save draft
            </button>
          )}
          {!readOnly && !isNew && (
            <button
              type="button"
              onClick={submitToMeta}
              disabled={submitting || !validation.valid}
              title={
                !validation.valid
                  ? `Fix ${validation.totalCount} issue${validation.totalCount === 1 ? '' : 's'} first: ${
                      Object.entries(validation.issues)
                        .flatMap(([sec, list]) => list.map((msg) => `${sec}: ${msg}`))
                        .slice(0, 5)
                        .join(' • ')
                    }`
                  : 'Send to Meta for approval'
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit for approval
              {!validation.valid && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                  {validation.totalCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {template.status === 'REJECTED' && template.metaRejectionReason && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">Meta rejected this template</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{template.metaRejectionReason}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Edit and resubmit — status will reset to Draft.</p>
          </div>
        </div>
      )}
      {readOnly && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            This template is {template.status.toLowerCase()} — edits are locked. Duplicate it to make changes.
          </p>
        </div>
      )}
      {!readOnly && !isNew && (
        <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 ${
          validation.valid
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
        }`}>
          {validation.valid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Ready to submit for Meta approval
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Fix <span className="font-semibold text-slate-900 dark:text-white">{validation.totalCount}</span> issue{validation.totalCount === 1 ? '' : 's'} in the sections below before submitting to Meta
              </p>
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: form */}
        <div className="space-y-5">
          <Section title="Basics" issues={validation.issues.basics}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template name" hint="lowercase, no spaces — e.g. order_confirmation">
                <input
                  disabled={readOnly || !isNew}
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="order_confirmation"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-60"
                />
              </Field>
              <Field label="Language">
                <select disabled={readOnly}
                  value={template.language}
                  onChange={(e) => setTemplate({ ...template, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm disabled:opacity-60">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </Field>
              <Field label="Category" full>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} type="button" disabled={readOnly}
                      onClick={() => setTemplate({ ...template, category: c.id })}
                      className={`text-left p-3 rounded-lg border text-xs ${
                        template.category === c.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}>
                      <p className="font-semibold">{c.label}</p>
                      <p className="text-slate-500 mt-0.5 leading-tight">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section title="Header" optional issues={validation.issues.header}>
            <Field label="Format">
              <div className="flex flex-wrap gap-2">
                {HEADER_FORMATS.map((f) => (
                  <button key={f} type="button" disabled={readOnly}
                    onClick={() => updateComponent('HEADER', { format: f })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      header?.format === f
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}>{f === 'NONE' ? 'None' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
                ))}
              </div>
            </Field>
            {header?.format === 'TEXT' && (
              <>
                <Field label="Header text" hint="Max 60 characters">
                  <input disabled={readOnly}
                    maxLength={60}
                    value={header.text || ''}
                    onChange={(e) => updateComponent('HEADER', { text: e.target.value })}
                    placeholder="e.g. Your order is confirmed"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
                </Field>
                {headerVarCount > 0 && (
                  <SampleValueEditor
                    label="Sample values for header variables"
                    count={headerVarCount}
                    values={header.example?.header_text || []}
                    disabled={readOnly}
                    onChange={(vals) => updateComponent('HEADER', { example: { ...header.example, header_text: vals } })}
                  />
                )}
              </>
            )}
            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.format) && (
              <MediaSampleField
                format={header.format}
                disabled={readOnly}
                handle={header.example?.header_handle?.[0] || ''}
                filename={header.example?.header_filename || ''}
                onChange={({ handle, filename, publicUrl }) => updateComponent('HEADER', {
                  example: {
                    ...header.example,
                    header_handle: handle ? [handle] : [],
                    header_filename: filename || undefined,
                    header_media_url: publicUrl || header.example?.header_media_url,
                  },
                })}
              />
            )}
          </Section>

          <Section title="Body" required issues={validation.issues.body}>
            <Field label={`Message body · ${(body?.text || '').length}/1024`} hint="Use {{1}}, {{2}} for personalisation">
              <textarea disabled={readOnly}
                rows={5}
                maxLength={1024}
                value={body?.text || ''}
                onChange={(e) => updateComponent('BODY', { text: e.target.value })}
                placeholder="Hi {{1}}, your order #{{2}} has been confirmed."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono" />
              <button type="button" disabled={readOnly} onClick={insertBodyVar}
                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                <Plus className="w-3 h-3" /> Add variable
              </button>
            </Field>
            {bodyVarCount > 0 && (
              <SampleValueEditor
                label="Sample values for body variables"
                count={bodyVarCount}
                values={body.example?.body_text?.[0] || []}
                disabled={readOnly}
                onChange={(vals) => updateComponent('BODY', { example: { body_text: [vals] } })}
              />
            )}
          </Section>

          <Section title="Footer" optional issues={validation.issues.footer}>
            <Field label={`Footer text · ${(footer?.text || '').length}/60`}>
              <input disabled={readOnly}
                maxLength={60}
                value={footer?.text || ''}
                onChange={(e) => updateComponent('FOOTER', { text: e.target.value })}
                placeholder="e.g. Reply STOP to unsubscribe"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
            </Field>
          </Section>

          <Section title="Buttons" optional issues={validation.issues.buttons}>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" disabled={readOnly} onClick={() => addButton('QUICK_REPLY')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                + Quick reply
              </button>
              <button type="button" disabled={readOnly} onClick={() => addButton('URL')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                + URL
              </button>
              <button type="button" disabled={readOnly} onClick={() => addButton('PHONE_NUMBER')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                + Call
              </button>
            </div>
            <div className="space-y-2">
              {(buttons?.buttons || []).map((b, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_auto] gap-2 items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 px-2">{b.type.replace('_', ' ')}</span>
                  <div className="flex gap-2">
                    <input disabled={readOnly}
                      maxLength={25}
                      value={b.text}
                      onChange={(e) => {
                        const next = [...buttons.buttons];
                        next[i] = { ...next[i], text: e.target.value };
                        updateComponent('BUTTONS', { buttons: next });
                      }}
                      placeholder="Button text (max 25)"
                      className="flex-1 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                    {b.type === 'URL' && (
                      <input disabled={readOnly}
                        value={b.url || ''}
                        onChange={(e) => {
                          const next = [...buttons.buttons];
                          next[i] = { ...next[i], url: e.target.value };
                          updateComponent('BUTTONS', { buttons: next });
                        }}
                        placeholder="https://…"
                        className="flex-1 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                    )}
                    {b.type === 'PHONE_NUMBER' && (
                      <input disabled={readOnly}
                        value={b.phone_number || ''}
                        onChange={(e) => {
                          const next = [...buttons.buttons];
                          next[i] = { ...next[i], phone_number: e.target.value };
                          updateComponent('BUTTONS', { buttons: next });
                        }}
                        placeholder="+911234567890"
                        className="flex-1 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                    )}
                  </div>
                  <button type="button" disabled={readOnly}
                    onClick={() => updateComponent('BUTTONS', { buttons: buttons.buttons.filter((_, x) => x !== i) })}
                    className="p-1.5 rounded hover:bg-red-100 text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Right: preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <WhatsAppPreview template={previewTemplate} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, optional, required, children, issues }) {
  const hasIssues = issues?.length > 0;
  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-4 ${
      hasIssues ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {required && <span className="text-[10px] font-medium text-red-600">Required</span>}
        {optional && <span className="text-[10px] font-medium text-slate-400">Optional</span>}
        {hasIssues && (
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {issues.length} to fix
          </span>
        )}
      </div>
      {hasIssues && (
        <ul className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 space-y-1">
          {issues.map((msg, i) => (
            <li key={i} className="text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{msg}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

function Field({ label, hint, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function SampleValueEditor({ label, count, values, onChange, disabled }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 shrink-0">{`{{${i + 1}}}`}</span>
            <input disabled={disabled}
              value={values[i] || ''}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={i === 0 ? 'e.g. John' : 'sample'}
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
          </div>
        ))}
      </div>
    </div>
  );
}

const ACCEPT_BY_FORMAT = {
  IMAGE: 'image/jpeg,image/png',
  VIDEO: 'video/mp4,video/3gp',
  DOCUMENT: 'application/pdf',
};

const MAX_SIZE_BY_FORMAT = {
  IMAGE: 5 * 1024 * 1024,
  VIDEO: 16 * 1024 * 1024,
  DOCUMENT: 100 * 1024 * 1024,
};

function MediaSampleField({ format, handle, filename, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const isHandle = handle && !/^https?:\/\//i.test(handle);

  const handleFile = async (file) => {
    if (!file) return;
    const maxSize = MAX_SIZE_BY_FORMAT[format] || 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return toast.error(`File too large. Meta max for ${format.toLowerCase()}: ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      const res = await fetch('/api/automation/whatsapp-templates/upload-media', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      onChange({ handle: data.handle, filename: data.filename, publicUrl: data.publicUrl });
      toast.success('Uploaded to Meta ✓');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const label = format === 'DOCUMENT' ? 'Sample PDF' : format === 'VIDEO' ? 'Sample video' : 'Sample image';
  const hint = `Uploads to Meta's Resumable Upload API and stores the returned handle — the sanctioned production path for template review samples.`;

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading to Meta…' : (handle ? `Replace ${format.toLowerCase()}` : `Upload ${format.toLowerCase()}`)}
          </button>
          {handle && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ handle: '', filename: '', publicUrl: '' })}
              className="inline-flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_BY_FORMAT[format]}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {handle ? (
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-md px-2 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium">Sample uploaded to Meta</span>
            {filename && <span className="text-slate-500">· {filename}</span>}
            <span className="text-slate-400 font-mono truncate" title={handle}>
              · {isHandle ? `${String(handle).slice(0, 14)}…` : handle}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            Meta accepts {format === 'IMAGE' ? 'JPEG/PNG up to 5MB' : format === 'VIDEO' ? 'MP4/3GP up to 16MB' : 'PDF up to 100MB'}.
            The file is used only during Meta's review; real messages can attach any compliant file.
          </p>
        )}
      </div>
    </Field>
  );
}

function StatusBadge({ status }) {
  const styles = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
    DISABLED: 'bg-slate-100 text-slate-500',
    PAUSED: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${styles[status] || styles.DRAFT}`}>
      {status || 'DRAFT'}
    </span>
  );
}
