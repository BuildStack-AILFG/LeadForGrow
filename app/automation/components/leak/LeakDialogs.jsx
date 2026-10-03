'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

const input = 'w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent text-fg dark:text-white';
const primary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium';
const secondary = 'px-4 py-2 rounded-md text-sm font-medium border border-line dark:border-slate-700 text-fg-secondary dark:text-slate-200 hover:bg-subtle dark:hover:bg-slate-800';

function Shell({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-t-2xl sm:rounded-lg shadow-modal p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-fg dark:text-slate-50">{title}</h3>
            {subtitle && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const bodyOf = (t) => (t.components || []).find((c) => String(c.type).toUpperCase() === 'BODY')?.text || '';
// Image / video / document headers need a media link at send time; one tap can't supply it.
const hasMediaHeader = (t) => (t.components || []).some((c) => String(c.type).toUpperCase() === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(String(c.format || '').toUpperCase()));
const varCount = (text) => new Set((text.match(/\{\{\d+\}\}/g) || [])).size;

export function TemplateDialog({ flag, onClose, onSend }) {
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(null);
  const [vars, setVars] = useState([]);
  const [sending, setSending] = useState(false);
  const firstName = String(flag.lead.name || '').split(/\s+/)[0] || 'there';

  useEffect(() => {
    authFetch('/api/automation/whatsapp-templates?status=APPROVED')
      .then((r) => r.json())
      .then((d) => setTemplates((d.data || d.templates || []).filter((t) => String(t.status).toUpperCase() === 'APPROVED' && !hasMediaHeader(t))))
      .catch(() => setError("Couldn't load your WhatsApp templates."));
  }, []);

  const pick = (t) => {
    setPicked(t);
    const n = varCount(bodyOf(t));
    setVars(Array.from({ length: n }, (_, i) => (i === 0 ? firstName : '')));
  };

  const preview = useMemo(() => (picked ? bodyOf(picked).replace(/\{\{(\d+)\}\}/g, (_, i) => vars[Number(i) - 1] || `{{${i}}}`) : ''), [picked, vars]);
  const ready = picked && vars.every((v) => v.trim());

  const send = async () => {
    setSending(true);
    const done = await onSend({ templateName: picked.name, templateLanguage: picked.language || 'en', templateVariables: vars, preview });
    setSending(false);
    if (done) onClose();
  };

  return (
    <Shell title={`Send a template to ${flag.lead.name}`} subtitle="Approved WhatsApp templates work even outside the 24-hour window." onClose={onClose}>
      {error ? <p className="text-sm text-danger">{error}</p> : !templates ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent-fg" /></div>
      ) : !templates.length ? (
        <p className="text-sm text-fg-secondary dark:text-fg-disabled">No approved text templates yet (templates with an image or video header need the full composer). Create one in WhatsApp Templates, or use Reply while the chat window is open.</p>
      ) : !picked ? (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t._id || t.name}>
              <button type="button" onClick={() => pick(t)} className="w-full text-left p-3 rounded-lg border border-line dark:border-slate-700 hover:border-accent hover:bg-accent-subtle dark:hover:bg-accent-pressed/10">
                <span className="block text-sm font-semibold text-fg dark:text-white">{t.name}</span>
                <span className="block text-xs text-fg-tertiary mt-0.5 line-clamp-2">{bodyOf(t) || 'No body text'}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          {vars.map((v, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5" htmlFor={`tv-${i}`}>{`Value for {{${i + 1}}}`}</label>
              <input id={`tv-${i}`} className={input} value={v} onChange={(e) => setVars((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
            </div>
          ))}
          <div className="rounded-lg bg-[#e7f7ef] dark:bg-emerald-950/30 border border-line dark:border-emerald-900 p-3 text-sm text-fg dark:text-slate-100 whitespace-pre-wrap">{preview}</div>
          <div className="flex gap-2">
            <button type="button" className={secondary} onClick={() => setPicked(null)}>Back</button>
            <button type="button" className={`${primary} flex-1`} disabled={!ready || sending} onClick={send}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send on WhatsApp
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}

export function ReassignDialog({ flag, loadTeam, onClose, onPick }) {
  const [members, setMembers] = useState(null);
  const [saving, setSaving] = useState('');
  useEffect(() => { loadTeam().then(setMembers).catch(() => setMembers([])); }, [loadTeam]);
  const pick = async (m) => {
    setSaving(m.id);
    const done = await onPick(m);
    setSaving('');
    if (done) onClose();
  };
  return (
    <Shell title={`Give ${flag.lead.name} to…`} subtitle="They get the usual assignment notification." onClose={onClose}>
      {!members ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent-fg" /></div> : (
        <ul className="space-y-1.5">
          {members.filter((m) => m.id !== flag.assignedTo?.id).map((m) => (
            <li key={m.id}>
              <button type="button" disabled={!!saving} onClick={() => pick(m)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-line dark:border-slate-700 hover:border-accent text-sm text-fg dark:text-slate-100 disabled:opacity-50">
                {m.name}
                {saving === m.id && <Loader2 className="w-4 h-4 animate-spin text-accent-fg" />}
              </button>
            </li>
          ))}
          {!members.length && <p className="text-sm text-fg-tertiary">No teammates found.</p>}
        </ul>
      )}
    </Shell>
  );
}

const REASON_COPY = {
  outside: { title: 'Worked outside the CRM', label: 'What happened? (optional)', placeholder: 'e.g. Called from my phone, visiting Saturday', button: 'Log it', required: false },
  snooze: { title: 'Snooze this leak', label: 'Why wait?', placeholder: 'e.g. Customer asked us to call after the 10th', button: 'Snooze', required: true },
  unqualified: { title: 'Mark as unqualified', label: 'Why?', placeholder: 'e.g. Wrong number, out of service area', button: 'Mark unqualified', required: true },
  dismiss: { title: 'Not a leak', label: 'Why is this not a leak?', placeholder: 'e.g. Already a customer, duplicate enquiry', button: 'Not a leak', required: true },
};
const SNOOZE = [[2, '2 hours'], [24, 'Tomorrow'], [72, '3 days'], [168, '1 week']];

export function ReasonDialog({ kind, flag, onClose, onSubmit }) {
  const copy = REASON_COPY[kind];
  const [note, setNote] = useState('');
  const [hours, setHours] = useState(24);
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const done = await onSubmit({ note: note.trim(), hours });
    setSaving(false);
    if (done) onClose();
  };
  return (
    <Shell title={copy.title} subtitle={flag.lead.name} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {kind === 'snooze' && (
          <div className="grid grid-cols-2 gap-2">
            {SNOOZE.map(([h, text]) => (
              <button key={h} type="button" aria-pressed={hours === h} onClick={() => setHours(h)} className={`px-3 py-2 rounded-lg text-sm font-medium border ${hours === h ? 'bg-accent border-accent text-white' : 'border-line dark:border-slate-700 text-fg-secondary dark:text-slate-200'}`}>
                {text}
              </button>
            ))}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5" htmlFor="leak-note">{copy.label}</label>
          <textarea id="leak-note" rows={3} maxLength={500} className={input} placeholder={copy.placeholder} value={note} onChange={(e) => setNote(e.target.value)} required={copy.required} />
        </div>
        <div className="flex gap-2">
          <button type="button" className={secondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={`${primary} flex-1`} disabled={saving || (copy.required && !note.trim())}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {copy.button}
          </button>
        </div>
      </form>
    </Shell>
  );
}
