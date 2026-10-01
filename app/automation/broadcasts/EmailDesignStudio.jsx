'use client';

/**
 * Designed emails for broadcasts: pick a template, fill in the fields, see a
 * live preview (desktop or phone). Or paste/upload your own HTML.
 *
 * The preview is rendered locally from lib/emailDesigns (no API calls while
 * typing). The server re-renders the design from the same template when the
 * campaign is saved, so what's previewed is what's sent.
 */
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, Upload, Loader2, FileCode2, ChevronDown, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  EMAIL_DESIGN_TEMPLATES, EMAIL_DESIGN_CATEGORIES, getEmailDesign, defaultDesignValues, renderEmailDesign,
  applyHtmlVars, withUnsubscribeLink, EMAIL_ASSET_BASE, normalizeUrl,
} from '@/lib/emailDesigns';
import { uploadImageToCloudinary } from '@/lib/cloudinaryUpload';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

const MAX_HTML_BYTES = 300 * 1024;

/** What a recipient would see: personalisation filled in, unsubscribe link inert. */
function toPreviewHtml(html, { name, businessName }) {
  let out = applyHtmlVars(html, { name: name || 'Priya', businessName: businessName || 'Your business' });
  out = withUnsubscribeLink(out, '#');
  // Default artwork lives on the production site; serve it from this origin
  // so the preview works on localhost and before a deploy.
  if (typeof window !== 'undefined') out = out.split(EMAIL_ASSET_BASE).join(`${window.location.origin}/email-assets`);
  // Clicking a link in the preview opens it in a new tab (never inside the preview).
  const base = '<base target="_blank">';
  out = /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, (m) => `${m}${base}`) : `${base}${out}`;
  return out;
}

/**
 * Renders an email at its real width (600px desktop / 375px phone) and scales
 * it down to fit the column, so "desktop" really shows the desktop layout.
 */
const ScaledEmailFrame = memo(function ScaledEmailFrame({ html, width = 640, maxHeight, interactive = true, title = 'Email preview' }) {
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(600);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const timers = [];
    const measure = () => {
      const doc = frame.contentDocument;
      if (doc?.body) setContentHeight(Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight));
    };
    const onLoad = () => {
      measure();
      frame.contentDocument?.querySelectorAll('img').forEach((img) => {
        if (!img.complete) img.addEventListener('load', measure, { once: true });
      });
      [250, 1000].forEach((ms) => timers.push(setTimeout(measure, ms)));
    };
    frame.addEventListener('load', onLoad);
    return () => {
      frame.removeEventListener('load', onLoad);
      timers.forEach(clearTimeout);
    };
  }, [html, width]);

  const scale = boxWidth ? Math.min(1, boxWidth / width) : 1;
  const visibleHeight = maxHeight ? Math.min(contentHeight * scale, maxHeight) : contentHeight * scale;

  return (
    <div ref={boxRef} className="w-full overflow-hidden" style={{ height: visibleHeight }}>
      <iframe
        ref={frameRef}
        title={title}
        srcDoc={html}
        // No scripts, even for pasted HTML. Same-origin so we can measure height;
        // popups so buttons and links in the preview open in a new tab.
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="block border-0 bg-white"
        style={{
          width,
          height: contentHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
    </div>
  );
});

function PreviewPanel({ html, previewVars }) {
  const [device, setDevice] = useState('desktop');
  const deferredHtml = useDeferredValue(html);
  const previewHtml = useMemo(() => toPreviewHtml(deferredHtml, previewVars), [deferredHtml, previewVars]);
  const isPhone = device === 'phone';
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-3 py-2">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Preview as <span className="text-slate-700 dark:text-slate-200">{previewVars.name || 'Priya'}</span>
        </p>
        <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5" role="group" aria-label="Preview size">
          {[['desktop', Monitor, 'Desktop'], ['phone', Smartphone, 'Phone']].map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              aria-pressed={device === id}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${device === id ? 'bg-violet-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className={`p-3 ${isPhone ? 'flex justify-center' : ''}`}>
        <div className={isPhone ? 'w-full max-w-[375px] rounded-[18px] border-[6px] border-slate-800 overflow-hidden bg-white' : 'w-full'}>
          <ScaledEmailFrame html={previewHtml} width={isPhone ? 375 : 640} maxHeight={isPhone ? 640 : 900} />
        </div>
      </div>
    </div>
  );
}

function GalleryCard({ title, badge, description, thumbHtml, onPick, onDelete, actionLabel = 'Use this design →' }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition hover:border-violet-400 hover:shadow-md">
      <button type="button" onClick={onPick} className="flex flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
        <div className="relative h-52 w-full overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
          {thumbHtml ? (
            <ScaledEmailFrame html={thumbHtml} width={640} interactive={false} title={`${title} preview`} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <FileCode2 className="h-8 w-8" />
              <span className="text-[11px]">Your own HTML</span>
            </div>
          )}
          <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/90 to-transparent dark:from-slate-900/90" />
        </div>
        <div className="flex w-full flex-1 flex-col gap-1 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={title}>{title}</p>
            {badge && <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">{badge}</span>}
          </div>
          {description && <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">{description}</p>}
          <span className="mt-auto pt-2 text-[11px] font-semibold text-violet-600 dark:text-violet-400 group-hover:underline">{actionLabel}</span>
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete template"
          aria-label={`Delete ${title}`}
          className="absolute right-2 top-2 rounded-md bg-white/90 dark:bg-slate-900/90 p-1.5 text-slate-500 opacity-0 shadow-sm transition hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function TemplateGallery({ onPick, previewVars, savedDesigns, savedLoading, onPickSaved, onDeleteSaved }) {
  const [category, setCategory] = useState('All');
  const categories = useMemo(() => {
    const used = new Set(EMAIL_DESIGN_TEMPLATES.map((t) => t.category));
    return ['All', ...EMAIL_DESIGN_CATEGORIES.filter((c) => used.has(c))];
  }, []);
  const builtIn = useMemo(
    () => EMAIL_DESIGN_TEMPLATES
      .filter((t) => category === 'All' || t.category === category)
      .map((t) => ({ t, html: toPreviewHtml(renderEmailDesign(t.id, {}), previewVars) })),
    [category, previewVars],
  );
  const mine = useMemo(
    () => (savedDesigns || []).map((s) => ({
      s,
      html: s.format === 'design' && getEmailDesign(s.baseTemplateId) ? toPreviewHtml(renderEmailDesign(s.baseTemplateId, s.values || {}), previewVars) : '',
    })),
    [savedDesigns, previewVars],
  );
  return (
    <div className="space-y-4">
      {(savedLoading || mine.length > 0) && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">My templates</h4>
          {savedLoading ? (
            <p className="flex items-center gap-2 text-[11px] text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your templates…</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {mine.map(({ s, html }) => (
                <GalleryCard
                  key={s._id}
                  title={s.name}
                  badge={s.format === 'html' ? 'HTML' : getEmailDesign(s.baseTemplateId)?.name}
                  description={s.subject ? `Subject: ${s.subject}` : ''}
                  thumbHtml={html}
                  actionLabel="Use this template →"
                  onPick={() => onPickSaved(s)}
                  onDelete={() => onDeleteSaved(s)}
                />
              ))}
            </div>
          )}
        </section>
      )}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">Ready-made designs</h4>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter designs">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${category === c ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-300'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {builtIn.map(({ t, html }) => (
            <GalleryCard key={t.id} title={t.name} badge={t.category} description={t.description} thumbHtml={html} onPick={() => onPick(t.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** "My templates": loaded once when the studio opens, refreshed after save/delete. */
function useSavedDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/email-designs');
      const data = await res.json();
      if (data.success) setDesigns(data.data || []);
    } catch { /* gallery still works with built-in designs */ } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { designs, loading, reload: load };
}

function SaveTemplateBar({ saved, saving, onSave }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {saved?.id ? (
        <>
          <button type="button" disabled={saving} onClick={() => onSave(false)} className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Update “{saved.name}”
          </button>
          <button type="button" disabled={saving} onClick={() => onSave(true)} className="rounded-md border border-violet-200 dark:border-violet-800 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-60">
            Save as new
          </button>
        </>
      ) : (
        <button type="button" disabled={saving} onClick={() => onSave(true)} className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-60">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save as template
        </button>
      )}
    </div>
  );
}

const inputClass = 'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500';

function ImageField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file (PNG, JPG or GIF).');
    if (file.size > 5 * 1024 * 1024) return toast.error('Images must be under 5 MB.');
    setUploading(true);
    try {
      onChange(await uploadImageToCloudinary(file));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  return (
    <div className="flex items-center gap-2">
      {value ? <img src={value} alt="" className="h-9 w-9 shrink-0 rounded border border-slate-200 dark:border-slate-700 object-cover bg-slate-50" /> : null}
      <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" className={`${inputClass} min-w-0 flex-1`} />
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        Upload
      </button>
    </div>
  );
}

function Field({ field, value, onChange }) {
  const id = `design-${field.key}`;
  let control;
  if (field.type === 'textarea') {
    control = <textarea id={id} rows={field.rows || 3} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-y`} />;
  } else if (field.type === 'image') {
    control = <ImageField value={value} onChange={onChange} />;
  } else if (field.type === 'color') {
    control = (
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded border border-slate-200 dark:border-slate-700 bg-white p-0.5" aria-label={field.label} />
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} font-mono`} maxLength={7} />
      </div>
    );
  } else {
    control = field.type === 'url'
      ? <input id={id} type="url" value={value} placeholder="https://your-website.com" onChange={(e) => onChange(e.target.value)} onBlur={(e) => { const fixed = normalizeUrl(e.target.value); if (fixed !== e.target.value) onChange(fixed); }} className={inputClass} />
      : <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  }
  return (
    <div className={field.type === 'color' ? '' : 'col-span-2'}>
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">{field.label}</label>
      {control}
      {field.help && <p className="mt-1 text-[10px] text-slate-400">{field.help}</p>}
      {field.key === 'brandName' && /\{\{\s*(name|email|phone)\s*\}\}/i.test(value) && (
        <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          This shows the <em>recipient&apos;s</em> details as the sender. Use {'{{business.name}}'} or type your business name.
        </p>
      )}
    </div>
  );
}

function DesignForm({ template, values, onChange }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const f of template.fields) {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group).push(f);
    }
    return [...map.entries()];
  }, [template]);
  return (
    <div className="space-y-2">
      {groups.map(([group, fields], i) => (
        <details key={group} open={i < 2} className="group rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
            {group}
            <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 px-3 py-3">
            {fields.map((f) => (
              <Field key={f.key} field={f} value={values[f.key] ?? ''} onChange={(v) => onChange({ ...values, [f.key]: v })} />
            ))}
          </div>
        </details>
      ))}
      <p className="px-1 text-[10px] text-slate-400">
        Personalise any field: <code className="font-mono">{'{{name}}'}</code> = the recipient&apos;s name, <code className="font-mono">{'{{business.name}}'}</code> = your business name. An unsubscribe link is always included in the footer.
      </p>
    </div>
  );
}

function CustomHtmlEditor({ html, onChange, previewVars, saveBar }) {
  const fileRef = useRef(null);
  const loadFile = (file) => {
    if (!file) return;
    if (file.size > MAX_HTML_BYTES) return toast.error('HTML file is larger than 300 KB. Host images online instead of embedding them.');
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.onerror = () => toast.error('Could not read that file');
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="custom-email-html" className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Email HTML</label>
          <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            <Upload className="h-3.5 w-3.5" /> Upload .html file
          </button>
        </div>
        <textarea
          id="custom-email-html"
          value={html}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          spellCheck={false}
          placeholder="Paste the HTML exported from Canva, Stripo, Beefree, Mailchimp or your designer…"
          className={`${inputClass} font-mono text-[11px] leading-relaxed`}
        />
        <p className="text-[10px] text-slate-400">
          Scripts, forms and embedded frames are removed when you save. Images must be online (https) links. If your HTML has no unsubscribe link, one is added at the bottom.
        </p>
        {html.trim() && saveBar}
      </div>
      {html.trim() ? (
        <PreviewPanel html={html} previewVars={previewVars} />
      ) : (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <FileCode2 className="h-6 w-6 text-slate-400" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Your email preview appears here.</p>
        </div>
      )}
    </div>
  );
}

/**
 * mode: 'design' | 'html'
 * design: { templateId, values } — templateId empty shows the gallery
 * saved: { id, name } of the "My templates" entry being edited, or null
 * onLoadSaved(entry): the page applies a saved template (it may switch mode)
 */
export default function EmailDesignStudio({
  mode, design, onDesignChange, html, onHtmlChange, previewVars,
  subject, saved, onSavedChange, onLoadSaved,
}) {
  const confirm = useConfirm();
  const { designs: savedDesigns, loading: savedLoading, reload: reloadSaved } = useSavedDesigns();
  const [saving, setSaving] = useState(false);
  const template = design?.templateId ? getEmailDesign(design.templateId) : null;
  const values = design?.values || {};
  const renderedHtml = useMemo(() => (template ? renderEmailDesign(template.id, values) : ''), [template, values]);

  const saveTemplate = async (asNew) => {
    let name = saved?.name;
    if (asNew || !saved?.id) {
      name = await confirm({
        mode: 'prompt',
        title: 'Save as template',
        message: 'Your team can reuse it from “My templates” in any email campaign.',
        placeholder: 'e.g. Diwali offer 2026',
        confirmLabel: 'Save',
        defaultValue: saved?.name ? `${saved.name} (copy)` : template?.name || '',
        required: true,
      });
      if (!name?.trim()) return;
    }
    const payload = mode === 'html'
      ? { name, format: 'html', html, subject }
      : { name, format: 'design', baseTemplateId: template?.id, values, subject };
    setSaving(true);
    try {
      const updating = !asNew && saved?.id;
      const res = await authFetch(updating ? `/api/automation/email-designs/${saved.id}` : '/api/automation/email-designs', {
        method: updating ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not save the template');
      onSavedChange?.({ id: data.data._id, name: data.data.name });
      toast.success(updating ? 'Template updated' : 'Saved to My templates');
      reloadSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const pickSaved = async (entry) => {
    try {
      let full = entry;
      if (entry.format === 'html') {
        const res = await authFetch(`/api/automation/email-designs/${entry._id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Could not open the template');
        full = data.data;
      } else if (!getEmailDesign(entry.baseTemplateId)) {
        throw new Error('This template is based on a design that no longer exists.');
      }
      onLoadSaved?.(full);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteSaved = async (entry) => {
    const ok = await confirm({ title: `Delete “${entry.name}”?`, message: 'It will be removed from My templates for everyone in your team. Campaigns already sent are not affected.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const res = await authFetch(`/api/automation/email-designs/${entry._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not delete the template');
      if (saved?.id === entry._id) onSavedChange?.(null);
      toast.success('Template deleted');
      reloadSaved();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveBar = <SaveTemplateBar saved={saved} saving={saving} onSave={saveTemplate} />;

  if (mode === 'html') {
    return <CustomHtmlEditor html={html || ''} onChange={onHtmlChange} previewVars={previewVars} saveBar={saveBar} />;
  }

  if (!template) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-600 dark:text-slate-300">Pick a design to start. You can change every word, image and colour, then save it as your own template.</p>
        <TemplateGallery
          previewVars={previewVars}
          savedDesigns={savedDesigns}
          savedLoading={savedLoading}
          onPick={(id) => { onSavedChange?.(null); onDesignChange({ templateId: id, values: defaultDesignValues(id) }); }}
          onPickSaved={pickSaved}
          onDeleteSaved={deleteSaved}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => { onSavedChange?.(null); onDesignChange({ templateId: '', values: {} }); }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> All designs
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {saved?.name ? 'Template: ' : 'Design: '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">{saved?.name || template.name}</span>
          </p>
          {saveBar}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="min-w-0 lg:max-h-[860px] lg:overflow-y-auto lg:pr-1">
          <DesignForm template={template} values={values} onChange={(next) => onDesignChange({ templateId: template.id, values: next })} />
        </div>
        <PreviewPanel html={renderedHtml} previewVars={previewVars} />
      </div>
    </div>
  );
}
