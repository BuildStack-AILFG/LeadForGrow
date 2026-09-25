'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Users, Upload, Filter, Tag, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

const TABS = [
  { id: 'manual', label: 'Existing leads', icon: Users, hint: 'Pick specific leads from your CRM' },
  { id: 'csv', label: 'Import CSV', icon: Upload, hint: 'Upload a spreadsheet — recipients added as leads' },
  { id: 'filter', label: 'Filter', icon: Filter, hint: 'Send to all leads matching a filter' },
  { id: 'tags', label: 'By tag', icon: Tag, hint: 'Send to everyone with a given tag' },
];

export default function AudiencePicker({ audience, onChange, campaignName = 'broadcast', channel = 'whatsapp' }) {
  const [tab, setTab] = useState(audience?.type || 'manual');
  useEffect(() => { onChange({ type: tab, ...normalize(tab, audience) }); /* eslint-disable-next-line */ }, [tab]);

  return (
    <div className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'manual' && <ManualPicker audience={audience} onChange={onChange} />}
        {tab === 'csv' && <CsvImporter campaignName={campaignName} onChange={onChange} audience={audience} channel={channel} />}
        {tab === 'filter' && <FilterPicker audience={audience} onChange={onChange} />}
        {tab === 'tags' && <TagPicker audience={audience} onChange={onChange} />}
      </div>
    </div>
  );
}

function normalize(type, prev) {
  if (type === 'manual') return { leadIds: prev?.leadIds || [] };
  if (type === 'tags') return { tags: prev?.tags || [] };
  if (type === 'filter') return { filters: prev?.filters || {} };
  return {};
}

function ManualPicker({ audience, onChange }) {
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const selected = new Set(audience?.leadIds || []);

  const fetchLeads = useCallback(async (q) => {
    setLoading(true);
    try {
      const url = new URL('/api/automation/leads', window.location.origin);
      if (q) url.searchParams.set('search', q);
      url.searchParams.set('limit', '50');
      const res = await authFetch(url.pathname + url.search);
      const data = await res.json();
      if (data.success) setLeads(data.data || data.leads || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(''); }, [fetchLeads]);
  useEffect(() => {
    const t = setTimeout(() => fetchLeads(query), 250);
    return () => clearTimeout(t);
  }, [query, fetchLeads]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ type: 'manual', leadIds: Array.from(next) });
  };
  const selectAll = () => onChange({ type: 'manual', leadIds: leads.map((l) => l._id) });
  const clearAll = () => onChange({ type: 'manual', leadIds: [] });

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads by name or phone…"
          className="w-full pl-10 pr-4 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
      </div>
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400">{selected.size} selected</span>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-emerald-700 dark:text-emerald-300 hover:underline">Select all visible</button>
          {selected.size > 0 && <button type="button" onClick={clearAll} className="text-slate-500 dark:text-slate-400 hover:underline">Clear</button>}
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto rounded border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="p-6 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : leads.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">No leads found</p>
        ) : leads.map((l) => (
          <label key={l._id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-sm">
            <input type="checkbox" checked={selected.has(l._id)} onChange={() => toggle(l._id)}
              className="rounded text-emerald-600 dark:text-emerald-400 focus:ring-teal-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 dark:text-white truncate">{l.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {l.phone || l.whatsapp || 'no phone'} · {l.status || 'new'} {l.source ? `· ${l.source}` : ''}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function CsvImporter({ campaignName, onChange, audience, channel = 'whatsapp' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [fileToImport, setFileToImport] = useState(null);

  // Email-only campaigns key on the email column; WhatsApp / both key on phone.
  const emailOnly = channel === 'email';
  const keyLabel = emailOnly ? 'email' : 'phone';

  const runUpload = async (dryRun) => {
    if (!fileToImport) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', fileToImport);
      fd.append('campaignName', campaignName);
      fd.append('channel', channel);
      if (dryRun) fd.append('dryRun', '1');
      const res = await fetch('/api/automation/broadcasts/import-csv', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (dryRun) {
        setPreview(data);
      } else {
        setResult(data);
        onChange({ type: 'manual', leadIds: data.leadIds });
        toast.success(`${data.created + data.updated} recipients ready · added tag ${data.tag}`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePick = (file) => {
    setFileToImport(file);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handlePick(e.dataTransfer.files[0]); }}
      >
        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {fileToImport?.name || 'Drop CSV or Excel file here, or click to browse'}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {emailOnly
            ? 'Must have a column named email / e-mail / mail (phone optional)'
            : 'Must have a column named phone / mobile / whatsapp / number'}
        </p>
        <input ref={inputRef} type="file" className="hidden" accept=".csv,.xlsx,.xlsm"
          onChange={(e) => handlePick(e.target.files?.[0])} />
      </div>

      {fileToImport && !result && (
        <div className="flex gap-2">
          <button type="button" disabled={uploading} onClick={() => runUpload(true)}
            className="px-3 py-2 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">
            {uploading ? 'Checking…' : 'Preview'}
          </button>
          <button type="button" disabled={uploading} onClick={() => runUpload(false)}
            className="px-3 py-2 rounded text-xs font-semibold text-white bg-[#1D4B3E] hover:bg-[#163c32]">
            {uploading ? 'Importing…' : 'Import & use as audience'}
          </button>
        </div>
      )}

      {preview && (
        <div className="rounded border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-2">
          <div className="flex flex-wrap gap-3">
            <Badge tone="emerald">✓ {preview.valid} valid</Badge>
            {preview.duplicates > 0 && <Badge tone="amber">⚠ {preview.duplicates} duplicates</Badge>}
            {preview.invalid > 0 && <Badge tone="red">✗ {preview.invalid} invalid {keyLabel}</Badge>}
          </div>
          {preview.preview?.length > 0 && (
            <table className="w-full text-[11px] mt-2">
              <thead className="text-slate-400"><tr><th className="text-left">Name</th><th className="text-left">Phone</th><th className="text-left">Email</th></tr></thead>
              <tbody>
                {preview.preview.map((r, i) => (
                  <tr key={i} className="text-slate-700 dark:text-slate-300"><td>{r.name}</td><td>{r.phone}</td><td>{r.email}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {result && (
        <div className="rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-xs">
          <p className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> {result.created + result.updated} recipients loaded
          </p>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Created {result.created}, updated {result.updated}. Tagged as <code className="bg-white dark:bg-slate-900 px-1 rounded">{result.tag}</code></p>
        </div>
      )}

      {audience?.leadIds?.length > 0 && !result && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Current audience: {audience.leadIds.length} recipients</p>
      )}
    </div>
  );
}

function FilterPicker({ audience, onChange }) {
  const f = audience?.filters || {};
  const set = (key, value) => onChange({ type: 'filter', filters: { ...f, [key]: value } });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs">
        <span className="text-slate-500 dark:text-slate-400 block mb-1">Status</span>
        <select value={f.status || ''} onChange={(e) => set('status', e.target.value || undefined)}
          className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="">Any status</option>
          <option value="new_lead">New</option>
          <option value="first_contact">First contact</option>
          <option value="qualified">Qualified</option>
          <option value="follow_up">Follow-up</option>
          <option value="won">Won</option>
        </select>
      </label>
      <label className="text-xs">
        <span className="text-slate-500 dark:text-slate-400 block mb-1">Source</span>
        <input value={f.source || ''} onChange={(e) => set('source', e.target.value || undefined)}
          placeholder="e.g. facebook_ad" className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
      </label>
      <label className="text-xs sm:col-span-2">
        <span className="text-slate-500 dark:text-slate-400 block mb-1">Tags (comma-separated)</span>
        <input value={(f.tags || []).join(', ')}
          onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
          placeholder="vip, hot_lead" className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
      </label>
    </div>
  );
}

function TagPicker({ audience, onChange }) {
  const tags = audience?.tags || [];
  return (
    <label className="text-xs block">
      <span className="text-slate-500 dark:text-slate-400 block mb-1">Audience tags (comma-separated)</span>
      <input value={tags.join(', ')}
        onChange={(e) => onChange({ type: 'tags', tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
        placeholder="e.g. newsletter, hot_lead"
        className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
    </label>
  );
}

function Badge({ tone, children }) {
  const map = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  };
  return <span className={`px-2 py-1 rounded font-medium ${map[tone] || map.emerald}`}>{children}</span>;
}
