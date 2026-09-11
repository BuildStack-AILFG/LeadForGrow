'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Loader2, Search, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import TemplateBuilder from './TemplateBuilder';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';

const STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-slate-100 text-slate-500',
  PAUSED: 'bg-teal-100 text-teal-700',
};

const FILTERS = ['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/automation/whatsapp-templates');
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const syncFromMeta = async () => {
    setSyncing(true);
    try {
      const res = await authFetch('/api/automation/whatsapp-templates/sync', { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(data.message);
      fetchTemplates();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const deleteTemplate = async (t) => {
    if (!confirm(`Delete "${t.name}"?${t.metaTemplateId ? ' This will also delete it from Meta.' : ''}`)) return;
    try {
      const res = await authFetch(`/api/automation/whatsapp-templates/${t._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Deleted');
      fetchTemplates();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (editingId || creating) {
    return (
      <TemplateBuilder
        templateId={editingId}
        onBack={() => { setEditingId(null); setCreating(false); fetchTemplates(); }}
        onSaved={(t) => {
          if (creating && t?._id) {
            setCreating(false);
            setEditingId(t._id);
          }
        }}
      />
    );
  }

  const filtered = templates
    .filter((t) => filter === 'ALL' || t.status === filter)
    .filter((t) => !query.trim() || t.name.toLowerCase().includes(query.toLowerCase()));

  const counts = templates.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">WhatsApp Templates</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build, submit for Meta approval, and use — all from here. No Business Manager needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={syncFromMeta} disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync from Meta
          </button>
          <button type="button" onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-600/20">
            <Plus className="w-3.5 h-3.5" /> New template
          </button>
        </div>
      </div>

      <AutoPageIntro />

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                filter === f ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== 'ALL' && counts[f] ? <span className="ml-1 text-slate-400">({counts[f]})</span> : null}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name…"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border-0 shadow-sm text-sm" />
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading templates…" height="40vh" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No templates yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Build one from scratch or pull existing templates from Meta.</p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Build new template
            </button>
            <button type="button" onClick={syncFromMeta} disabled={syncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg">
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Import from Meta
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const body = t.components?.find((c) => c.type === 'BODY');
            return (
              <div key={t._id}
                className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setEditingId(t._id)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{t.name}</p>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[t.status] || STATUS_STYLES.DRAFT}`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  {t.category} · {t.language}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 min-h-[3rem]">
                  {body?.text || <span className="italic text-slate-400">No body text yet</span>}
                </p>
                {t.status === 'REJECTED' && t.metaRejectionReason && (
                  <p className="mt-2 text-[10px] text-red-600 line-clamp-2">Rejected: {t.metaRejectionReason}</p>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{t.source === 'imported' ? 'From Meta' : 'Built here'}</span>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); deleteTemplate(t); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
