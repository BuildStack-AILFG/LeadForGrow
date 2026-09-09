'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Sparkles, Loader2, RefreshCw, Trash2, Search,
  Globe, FileText, HelpCircle, Package, Building2, BookOpen,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import AutoPageIntro from '../../components/shared/tour/AutoPageIntro';

const TYPE_META = {
  website: { label: 'Website', icon: Globe },
  pdf: { label: 'PDF', icon: FileText },
  docx: { label: 'DOCX', icon: FileText },
  txt: { label: 'Text', icon: FileText },
  faq: { label: 'FAQ', icon: HelpCircle },
  catalog: { label: 'Catalog', icon: Package },
  company: { label: 'Company Info', icon: Building2 },
  custom: { label: 'Custom', icon: BookOpen },
};

const STATUS_COLORS = {
  ready: 'text-emerald-600 bg-emerald-50',
  indexing: 'text-blue-600 bg-blue-50',
  pending: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
};

export default function KnowledgeBasePage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'company', category: '', content: '', url: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/knowledge/sources');
      const data = await res.json();
      if (data.success) setSources(data.data);
    } catch {
      toast.error('Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createSource = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch('/api/ai/knowledge/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, autoIndex: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.warning) toast.error(data.warning);
      else toast.success('Source added and indexed');
      setShowForm(false);
      setForm({ name: '', type: 'company', category: '', content: '', url: '' });
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const reindex = async (id) => {
    try {
      const res = await authFetch(`/api/ai/knowledge/sources/${id}/ingest`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Indexed ${data.data.chunkCount} chunks`);
      load();
    } catch (err) {
      toast.error(err.message || 'Re-index failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this knowledge source?')) return;
    try {
      const res = await authFetch(`/api/ai/knowledge/sources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const testSearch = async () => {
    if (!searchQ.trim()) return;
    try {
      const res = await authFetch('/api/ai/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQ }),
      });
      const data = await res.json();
      if (data.success) setSearchResults(data.data);
    } catch {
      toast.error('Search failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/automation/settings/ai" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" /> AI Knowledge Base
            </h1>
            <p className="text-sm text-slate-500">Train Grovia with your business knowledge — AI answers only from these sources</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" /> Add source
        </button>
      </div>

      <AutoPageIntro />

      <div className="flex gap-2">
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Test knowledge search..."
          className="flex-1 text-sm px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
          onKeyDown={(e) => e.key === 'Enter' && testSearch()}
        />
        <button type="button" onClick={testSearch} className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {searchResults && (
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 space-y-2">
          <p className="text-xs font-semibold text-violet-700">{searchResults.length} results</p>
          {searchResults.map((r, i) => (
            <div key={i} className="text-xs text-slate-600 dark:text-slate-400 p-2 bg-white/60 dark:bg-slate-900/60 rounded-lg">
              <span className="font-medium text-violet-600">{r.sourceName}</span>
              <p className="mt-1 line-clamp-3">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={createSource} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-sm px-3 py-2 border rounded-lg" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="text-sm px-3 py-2 border rounded-lg">
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input placeholder="Category (optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="text-sm px-3 py-2 border rounded-lg" />
            {form.type === 'website' && (
              <input placeholder="Website URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="text-sm px-3 py-2 border rounded-lg" />
            )}
          </div>
          {(form.type === 'company' || form.type === 'custom' || form.type === 'txt') && (
            <textarea
              required
              rows={6}
              placeholder="Paste your business information, policies, pricing, FAQs..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full text-sm px-3 py-2 border rounded-lg"
            />
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add & Index'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <PageLoader label="Loading knowledge sources…" height="12rem" />
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">No knowledge sources yet</p>
          <p className="text-sm mt-1 mb-4">Add company info, FAQs, or crawl your website — your AI can only answer from what's here.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" /> Add your first source
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((s) => {
            const meta = TYPE_META[s.type] || TYPE_META.custom;
            const Icon = meta.icon;
            return (
              <div key={s._id} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.pending}`}>
                      {s.status}
                    </span>
                    {s.category && <span className="text-[10px] text-slate-400">{s.category}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {meta.label} · v{s.version || 1} · {s.chunkCount || 0} chunks
                    {s.lastIndexedAt && ` · indexed ${new Date(s.lastIndexedAt).toLocaleDateString()}`}
                  </p>
                  {s.lastError && <p className="text-xs text-red-500 mt-0.5">{s.lastError}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => reindex(s._id)} title="Re-index" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => remove(s._id)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 className="w-4 h-4" />
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
