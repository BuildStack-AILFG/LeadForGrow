'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, MessageCircle, Trash2, Maximize2, RotateCcw, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import TemplateBuilder from './TemplateBuilder';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import { TEMPLATE_CATEGORIES } from './templateCategories';
import TemplateChannelTabs from '../components/templates/TemplateChannelTabs';
import { useConfirm } from '@/app/components/ConfirmProvider';

const STATUS_STYLES = {
  DRAFT: 'bg-muted text-fg-secondary',
  PENDING: 'bg-warning-subtle text-warning',
  APPROVED: 'bg-accent-subtle text-accent-fg',
  REJECTED: 'bg-danger-subtle text-red-800',
  DISABLED: 'bg-muted text-fg-tertiary',
  PAUSED: 'bg-accent-subtle text-accent-fg',
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
      <p className="font-semibold text-dense text-[#0B2B1E] mb-1 pr-14 line-clamp-1">{template.name}</p>
      <p className="text-meta text-[#0B2B1E]/80 leading-snug line-clamp-4 whitespace-pre-wrap">
        {body?.text || <span className="italic text-[#0B2B1E]/50">No body text yet</span>}
      </p>
    </div>
  );
}

function TemplateCard({ template, onExpand }) {
  return (
    <div className="group relative rounded-lg overflow-hidden border border-line">
      <TemplateCardBody template={template} minHeight="min-h-[132px]" />
      <div className="bg-canvas px-3 py-2 text-meta text-fg-tertiary truncate border-t border-line">
        {template.name}
      </div>

      {/* Hover overlay — matches the reference "Use this template" + Expand pattern */}
      <div className="absolute inset-0 bg-slate-900/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 px-3">
        <p className="text-white text-xs font-medium">Use this template</p>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-canvas text-fg text-xs font-medium hover:bg-muted"
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

  const matchesFilter = (t) => filter === 'ALL' || t.status === filter;
  const matchesQuery = (t) => !query.trim() || t.name.toLowerCase().includes(query.toLowerCase());

  const filtered = templates.filter(matchesFilter).filter(matchesQuery);
  const filteredDeleted = deletedTemplates.filter(matchesFilter).filter(matchesQuery);

  const counts = templates.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const byCategory = TEMPLATE_CATEGORIES
    .map((c) => ({ ...c, templates: templates.filter((t) => t.category === c.id).filter(matchesFilter).filter(matchesQuery) }))
    .filter((c) => c.templates.length > 0);


  return (
    <>
    <TemplateChannelTabs />
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-canvas border border-line flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-[18px] h-[18px] text-fg-secondary" />
          </div>
          <div>
            <h1 className="text-page font-semibold text-fg">Templates</h1>
            <p className="text-xs text-fg-tertiary mt-0.5">Managing WhatsApp Templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={syncFromMeta} disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent-fg bg-accent-subtle hover:bg-accent-subtle rounded disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync from Meta
          </button>
          <button type="button" onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-md">
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>
      </div>

      <AutoPageIntro />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-line dark:border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? 'border-accent text-accent-fg'
                : 'border-transparent text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + status filter — shared across all 3 tabs so Library (the default landing
          view) and Deleted aren't stuck with no way to find a specific template. */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 p-1 bg-canvas dark:bg-slate-900 rounded">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                filter === f ? 'bg-muted dark:bg-slate-800 text-fg dark:text-white' : 'text-fg-tertiary hover:text-fg-secondary'
              }`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== 'ALL' && counts[f] ? <span className="ml-1 text-fg-tertiary">({counts[f]})</span> : null}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name…"
            className="w-full pl-10 pr-4 py-2 rounded bg-canvas dark:bg-slate-900 border-0 text-sm" />
        </div>
      </div>

      {activeTab === 'library' && (
        loading ? (
          <PageLoader label="Loading templates…" height="40vh" />
        ) : templates.length === 0 ? (
          <div className="text-center py-16 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800">
            <MessageCircle className="w-10 h-10 text-fg-disabled mx-auto mb-3" />
            <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">No templates yet</p>
            <p className="text-xs text-fg-tertiary mt-1 mb-4">Build one from scratch or pull existing templates from Meta.</p>
            <div className="flex justify-center gap-2">
              <button type="button" onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent rounded-md">
                <Plus className="w-3.5 h-3.5" /> Build new template
              </button>
              <button type="button" onClick={syncFromMeta} disabled={syncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-accent-fg bg-accent-subtle rounded">
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Import from Meta
              </button>
            </div>
          </div>
        ) : byCategory.length === 0 ? (
          <div className="text-center py-16 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800">
            <MessageCircle className="w-10 h-10 text-fg-disabled mx-auto mb-3" />
            <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">No templates match this filter</p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4">
            {byCategory.map((col) => (
              <div key={col.id} className="flex-shrink-0 w-[240px]">
                <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-line dark:border-slate-800">
                  <h3 className="text-meta font-semibold text-fg-tertiary">{col.label}</h3>
                  <span className="text-meta text-fg-tertiary">{col.templates.length} template{col.templates.length === 1 ? '' : 's'}</span>
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
          {loading ? (
            <PageLoader label="Loading templates…" height="40vh" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800">
              <MessageCircle className="w-10 h-10 text-fg-disabled mx-auto mb-3" />
              <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">No templates match this filter</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((t) => (
                <div key={t._id}
                  className="group relative rounded-lg overflow-hidden border border-line hover:shadow-popover transition-shadow cursor-pointer"
                  onClick={() => setEditingId(t._id)}>
                  <TemplateCardBody
                    template={t}
                    badge={
                      <span className={`text-meta font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[t.status] || STATUS_STYLES.DRAFT}`}>
                        {t.status}
                      </span>
                    }
                  />
                  <div className="bg-canvas px-3 py-2 border-t border-line">
                    <div className="flex items-center justify-between gap-2 text-meta text-fg-tertiary">
                      <span className="truncate">{t.category} · {t.language} · {t.source === 'imported' ? 'From Meta' : 'Built here'}</span>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(t); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger-subtle text-danger flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {t.status === 'REJECTED' && t.metaRejectionReason && (
                      <p className="mt-1 text-meta text-danger line-clamp-2">Rejected: {t.metaRejectionReason}</p>
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
          <div className="text-center py-16 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800">
            <Trash2 className="w-10 h-10 text-fg-disabled mx-auto mb-3" />
            <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">Nothing deleted</p>
            <p className="text-xs text-fg-tertiary mt-1">Templates you delete show up here and can be restored.</p>
          </div>
        ) : filteredDeleted.length === 0 ? (
          <div className="text-center py-16 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800">
            <Trash2 className="w-10 h-10 text-fg-disabled mx-auto mb-3" />
            <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">No deleted templates match this filter</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDeleted.map((t) => (
              <div key={t._id} className="rounded-lg overflow-hidden border border-line opacity-90">
                <TemplateCardBody template={t} />
                <div className="bg-canvas px-3 py-2 border-t border-line flex items-center justify-between gap-2">
                  <p className="text-meta text-fg-tertiary truncate">Deleted {formatRelative(t.deletedAt)}</p>
                  <button type="button" onClick={() => restoreTemplate(t)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-meta font-semibold text-accent-fg bg-accent-subtle hover:bg-accent-subtle rounded flex-shrink-0">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
    </>
  );
}
