'use client';

import { useEffect, useState } from 'react';
import { Bold, Italic, Eye, Send, MessageCircle, ChevronDown } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { TEMPLATE_VARIABLES, applyPreviewVars } from './constants';

function VariableChips({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {TEMPLATE_VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(` {{${v.key}}}`)}
          className="text-meta font-medium px-2 py-1 rounded-md bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-tertiary hover:bg-accent-subtle hover:text-accent-fg dark:hover:bg-teal-950/30 dark:hover:text-accent-fg transition-colors"
        >
          {`{{${v.key}}}`}
        </button>
      ))}
    </div>
  );
}

function PreviewBox({ title, content }) {
  if (!content) return null;
  return (
    <div className="mt-2 p-3 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700">
      <p className="text-meta font-semibold text-fg-tertiary mb-1.5">{title}</p>
      <p className="text-xs text-fg-secondary dark:text-fg-disabled whitespace-pre-wrap">{applyPreviewVars(content)}</p>
    </div>
  );
}

export default function TemplateEditor({
  form,
  onChange,
  rule,
  templateRules = [],
  cloudinaryConfig,
  onCloudinaryChange,
  onUploadMedia
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [approvedTemplates, setApprovedTemplates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch('/api/automation/whatsapp-templates?status=APPROVED');
        const data = await res.json();
        if (!cancelled && data.success) setApprovedTemplates(data.data);
      } catch {
        /* ignore — dropdown falls back to legacy templateRules */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const insertVar = (text, field) => {
    onChange({ ...form, [field]: (form[field] || '') + text });
  };

  const wrapSelection = (field, wrapper) => {
    const val = form[field] || '';
    onChange({ ...form, [field]: val + wrapper });
  };

  const showEmail = ['email', 'both'].includes(form.channel);
  const showWhatsApp = ['whatsapp', 'both'].includes(form.channel);
  const waLocked = !!form.whatsappTemplateName;

  return (
    <div className="space-y-5">
      {showEmail && (
        <>
          <div>
            <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Email subject</label>
            <input
              type="text"
              value={form.emailSubject}
              onChange={(e) => onChange({ ...form, emailSubject: e.target.value })}
              placeholder="Thanks for reaching out, {{name}}"
              className="w-full px-3 py-2 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus"
            />
            <VariableChips onInsert={(t) => insertVar(t, 'emailSubject')} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Email body</label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => wrapSelection('messageTemplate', '**')} className="p-1 rounded text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" title="Bold">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => wrapSelection('messageTemplate', '_')} className="p-1 rounded text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" title="Italic">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setShowPreview(!showPreview)} className="p-1 rounded text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" title="Preview">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              rows={5}
              value={form.messageTemplate}
              onChange={(e) => onChange({ ...form, messageTemplate: e.target.value })}
              placeholder="Hi {{name}}, thank you for your interest in {{serviceInterest}}..."
              className="w-full px-3 py-2 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus resize-none font-mono"
            />
            <VariableChips onInsert={(t) => insertVar(t, 'messageTemplate')} />
            {showPreview && <PreviewBox title="Email preview" content={form.messageTemplate} />}
          </div>
        </>
      )}

      {showWhatsApp && (
        <>
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-accent-fg" />
              <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">WhatsApp message</label>
            </div>
            <textarea
              rows={4}
              value={form.whatsappTemplate}
              onChange={(e) => onChange({ ...form, whatsappTemplate: e.target.value })}
              disabled={waLocked}
              placeholder="Hi {{name}}, we received your inquiry..."
              className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                waLocked
                  ? 'bg-muted dark:bg-slate-800 border-line text-fg-tertiary cursor-not-allowed'
                  : 'bg-canvas dark:bg-slate-900 border-line dark:border-slate-700'
              }`}
            />
            {waLocked && (
              <p className="text-meta text-warning dark:text-amber-400 mt-1">Locked — verified Meta template selected.</p>
            )}
            {!waLocked && <VariableChips onInsert={(t) => insertVar(t, 'whatsappTemplate')} />}
            {showPreview && !waLocked && <PreviewBox title="WhatsApp preview" content={form.whatsappTemplate} />}
          </div>

          <div>
            <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Verified Meta template</label>
            <div className="relative">
              <select
                value={form.whatsappTemplateName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const approved = approvedTemplates.find((t) => t.name === selectedName);
                  const legacy = !approved && templateRules.find((t) => t.name === selectedName);
                  const bodyText =
                    approved?.components?.find((c) => c.type === 'BODY')?.text
                    || legacy?.config?.whatsappTemplate
                    || form.whatsappTemplate;
                  onChange({
                    ...form,
                    whatsappTemplateName: selectedName,
                    whatsappTemplate: bodyText,
                  });
                }}
                className="w-full px-3 py-2 pr-8 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="">Custom text message</option>
                {approvedTemplates.length > 0 && (
                  <optgroup label="Meta approved">
                    {approvedTemplates.map((t) => (
                      <option key={t._id} value={t.name}>{t.name} · {t.language}</option>
                    ))}
                  </optgroup>
                )}
                {templateRules.length > 0 && (
                  <optgroup label="Legacy templates">
                    {templateRules.map((t) => (
                      <option key={t._id} value={t.name}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {approvedTemplates.length === 0 && (
                <p className="text-meta text-fg-tertiary mt-1">
                  No approved templates yet — <a href="/automation/whatsapp-templates" className="underline">build & submit one</a>.
                </p>
              )}
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Header media (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.whatsappHeaderMedia}
                onChange={(e) => onChange({ ...form, whatsappHeaderMedia: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3 py-2 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus"
              />
              <label className="cursor-pointer px-3 py-2 text-xs font-medium text-fg-secondary bg-muted dark:bg-slate-800 border border-line dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-700">
                Upload
                <input
                  type="file"
                  className="hidden"
                  accept="video/*,image/*"
                  onChange={async (e) => {
                    const url = await onUploadMedia(e.target.files?.[0]);
                    if (url) onChange({ ...form, whatsappHeaderMedia: url });
                  }}
                />
              </label>
            </div>
            <div className="mt-2 p-2.5 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700">
              <p className="text-meta font-medium text-fg-tertiary mb-1.5">Cloudinary (large uploads)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Cloud name"
                  value={cloudinaryConfig.cloudName}
                  onChange={(e) => onCloudinaryChange('cloudName', e.target.value)}
                  className="text-xs px-2 py-1.5 rounded border border-line dark:border-slate-600 bg-canvas dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="Upload preset"
                  value={cloudinaryConfig.uploadPreset}
                  onChange={(e) => onCloudinaryChange('uploadPreset', e.target.value)}
                  className="text-xs px-2 py-1.5 rounded border border-line dark:border-slate-600 bg-canvas dark:bg-slate-900"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {rule?.type === 'follow_up_reminder' && (
        <div>
          <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Delay (hours)</label>
          <input
            type="number"
            min={0}
            value={form.delayHours}
            onChange={(e) => onChange({ ...form, delayHours: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-3 py-2 text-sm bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-fg hover:text-accent-fg"
      >
        <Send className="w-3.5 h-3.5" />
        {showPreview ? 'Hide preview' : 'Test message preview'}
      </button>
    </div>
  );
}
