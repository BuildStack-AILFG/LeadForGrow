'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, MessageCircle, Trash2, Maximize2, RotateCcw, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import TemplateBuilder from './TemplateBuilder';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import { TEMPLATE_CATEGORIES } from './templateCategories';
import { useConfirm } from '@/app/components/ConfirmProvider';

const STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-slate-100 text-slate-500',
  PAUSED: 'bg-teal-100 text-teal-700',
};

const FILTERS = ['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

const TABS = [
  { id: 'library', label: 'Template Library' },
  { id: 'active', label: 'Active' },
  { id: 'deleted', label: 'Deleted' },
];

function formatRelative(date) {
  if (!date) return '';
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Shared green preview body — every template card across all 3 tabs
// (Library, Active, Deleted) centers on this same pale-green block so the
// page reads as one visual language rather than 3 different card styles.
function TemplateCardBody({ template, badge, minHeight = 'min-h-[110px]' }) {
  const body = template.components?.find((c) => c.type === 'BODY');
  return (
    <div className={`relative bg-[#DCF3E7] p-3 ${minHeight}`}>
      {badge && <div className="absolute top-2 right-2">{badge}</div>}
      <p className="font-semibold text-[13px] text-[#0B2B1E] mb-1 pr-14 line-clamp-1">{template.name}</p>
      <p className="text-[11px] text-[#0B2B1E]/80 leading-snug line-clamp-4 whitespace-pre-wrap">
        {body?.text || <span className="italic text-[#0B2B1E]/50">No body text yet</span>}
      </p>
    </div>
  );
}

function TemplateCard({ template, onExpand }) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-[#bfe3cf] shadow-sm">
      <TemplateCardBody template={template} minHeight="min-h-[132px]" />
      <div className="bg-white px-3 py-2 text-[11px] text-slate-500 truncate border-t border-[#bfe3cf]">
        {template.name}
      </div>

      {/* Hover overlay — matches the reference "Use this template" + Expand pattern */}
      <div className="absolute inset-0 bg-slate-900/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-3">
        <p className="text-white text-xs font-medium">Use this template</p>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100"
        >
          <Maximize2 className="w-3 h-3" /> Expand
        </button>
      </div>
    </div>
  );
}

export default function WhatsAppTemplatesPage() {
  const confirm = useConfirm();
  const [templates, setTemplates] = useState([]);
  const [deletedTemplates, setDeletedTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('library');

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

  const fetchDeleted = useCallback(async () => {
    try {
      setDeletedLoading(true);
      const res = await authFetch('/api/automation/whatsapp-templates?deleted=true');
      const data = await res.json();
      if (data.success) setDeletedTemplates(data.data);
    } catch {
      toast.error('Failed to load deleted templates');
    } finally {
      setDeletedLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => {
    if (activeTab === 'deleted') fetchDeleted();
  }, [activeTab, fetchDeleted]);

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
    if (!(await confirm({ title: 'Delete template', message: `Delete "${t.name}"?${t.metaTemplateId ? ' This will also delete it from Meta.' : ''}`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      const res = await authFetch(`/api/automation/whatsapp-templates/${t._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Moved to Deleted');
      fetchTemplates();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const restoreTemplate = async (t) => {
    try {
      const res = await authFetch(`/api/automation/whatsapp-templates/${t._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Restored');
      setDeletedTemplates((prev) => prev.filter((d) => d._id !== t._id));
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

  const byCategory = TEMPLATE_CATEGORIES
    .map((c) => ({ ...c, templates: templates.filter((t) => t.category === c.id) }))
    .filter((c) => c.templates.length > 0);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#1D4B3E] flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Templates</h1>
            <p className="text-xs text-slate-500 mt-0.5">Managing WhatsApp Templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={syncFromMeta} disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1D4B3E] bg-[#F0F9F5] hover:bg-[#dcefe6] rounded disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync from Meta
          </button>
          <button type="button" onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4B3E] hover:bg-[#163c32] rounded shadow-sm">
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>
      </div>

      <AutoPageIntro />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? 'border-[#1D4B3E] text-[#1D4B3E]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        loading ? (
          <PageLoader label="Loading templates…" height="40vh" />
        ) : templates.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No templates yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Build one from scratch or pull existing templates from Meta.</p>
            <div className="flex justify-center gap-2">
              <button type="button" onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4B3E] rounded">
                <Plus className="w-3.5 h-3.5" /> Build new template
              </button>
              <button type="button" onClick={syncFromMeta} disabled={syncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1D4B3E] bg-[#F0F9F5] rounded">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Import from Meta
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4">
            {byCategory.map((col) => (
              <div key={col.id} className="flex-shrink-0 w-[240px]">
                <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{col.label}</h3>
                  <span className="text-[11px] text-slate-400">{col.templates.length} template{col.templates.length === 1 ? '' : 's'}</span>
                </div>
                <div className="space-y-3">
                  {col.templates.map((t) => (
                    <TemplateCard key={t._id} template={t} onExpand={() => setEditingId(t._id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'active' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded shadow-sm">
              {FILTERS.map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded ${
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
                className="w-full pl-10 pr-4 py-2 rounded bg-white dark:bg-slate-900 border-0 shadow-sm text-sm" />
            </div>
          </div>

          {loading ? (
            <PageLoader label="Loading templates…" height="40vh" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No templates match this filter</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((t) => (
                <div key={t._id}
                  className="group relative rounded-lg overflow-hidden border border-[#bfe3cf] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setEditingId(t._id)}>
                  <TemplateCardBody
                    template={t}
                    badge={
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[t.status] || STATUS_STYLES.DRAFT}`}>
                        {t.status}
                      </span>
                    }
                  />
                  <div className="bg-white px-3 py-2 border-t border-[#bfe3cf]">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{t.category} · {t.language} · {t.source === 'imported' ? 'From Meta' : 'Built here'}</span>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(t); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {t.status === 'REJECTED' && t.metaRejectionReason && (
                      <p className="mt-1 text-[10px] text-red-600 line-clamp-2">Rejected: {t.metaRejectionReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'deleted' && (
        deletedLoading ? (
          <PageLoader label="Loading deleted templates…" height="40vh" />
        ) : deletedTemplates.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nothing deleted</p>
            <p className="text-xs text-slate-500 mt-1">Templates you delete show up here and can be restored.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deletedTemplates.map((t) => (
              <div key={t._id} className="rounded-lg overflow-hidden border border-[#bfe3cf] shadow-sm opacity-90">
                <TemplateCardBody template={t} />
                <div className="bg-white px-3 py-2 border-t border-[#bfe3cf] flex items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400 truncate">Deleted {formatRelative(t.deletedAt)}</p>
                  <button type="button" onClick={() => restoreTemplate(t)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#1D4B3E] bg-[#F0F9F5] hover:bg-[#dcefe6] rounded flex-shrink-0">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
