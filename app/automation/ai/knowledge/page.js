'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Loader2, RefreshCw, Trash2, Search,
  Globe, FileText, HelpCircle, Package, Building2, BookOpen,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import AutoPageIntro from '../../components/shared/tour/AutoPageIntro';
import { useConfirm } from '@/app/components/ConfirmProvider';

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
  ready: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
  indexing: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30',
  pending: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
  error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30',
};

export default function KnowledgeBasePage() {
  const confirm = useConfirm();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'company', category: '', content: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  // Type-specific inputs.
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);
  const [catalog, setCatalog] = useState([{ name: '', price: '', sku: '', description: '' }]);
  const [file, setFile] = useState(null); // { url, name, mimeType }
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setForm({ name: '', type: 'company', category: '', content: '', url: '' });
    setFaqs([{ question: '', answer: '' }]);
    setCatalog([{ name: '', price: '', sku: '', description: '' }]);
    setFile(null);
  };

  const handleFileUpload = async (f) => {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error('Max 15 MB'); return; }
    setUploading(true);
    try {
      const signRes = await authFetch('/api/cloudinary-sign', { method: 'POST' });
      const sign = await signRes.json();
      if (!sign.success) throw new Error(sign.error || 'Could not sign upload');
      const fd = new FormData();
      fd.append('file', f);
      fd.append('api_key', sign.apiKey);
      fd.append('timestamp', sign.timestamp);
      fd.append('signature', sign.signature);
      if (sign.folder) fd.append('folder', sign.folder);
      // /auto/ handles PDFs, docs, etc. (not just images).
      const cdn = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, { method: 'POST', body: fd });
      const data = await cdn.json();
      if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
      setFile({ url: data.secure_url, name: f.name, mimeType: f.type });
      toast.success('File uploaded');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

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

    // Build a payload with only the fields that matter for this type, and
    // validate the type-specific input before hitting the server.
    const payload = { name: form.name, type: form.type, category: form.category, autoIndex: true };
    if (form.type === 'website') {
      if (!form.url.trim()) { toast.error('Enter a website URL'); return; }
      payload.url = form.url.trim();
    } else if (form.type === 'pdf' || form.type === 'docx') {
      if (!file?.url) { toast.error('Upload a file first'); return; }
      payload.fileUrl = file.url; payload.fileName = file.name; payload.mimeType = file.mimeType;
    } else if (form.type === 'faq') {
      const clean = faqs.filter((f) => f.question.trim() && f.answer.trim());
      if (!clean.length) { toast.error('Add at least one question and answer'); return; }
      payload.faqs = clean;
    } else if (form.type === 'catalog') {
      const clean = catalog.filter((p) => p.name.trim());
      if (!clean.length) { toast.error('Add at least one product'); return; }
      payload.catalog = clean;
    } else {
      if (!form.content.trim()) { toast.error('Paste some content'); return; }
      payload.content = form.content;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/ai/knowledge/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.warning) toast.error(data.warning);
      else toast.success('Source added and indexed');
      setShowForm(false);
      resetForm();
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
    if (!(await confirm({ title: 'Delete source', message: 'Delete this knowledge source?', confirmLabel: 'Delete', danger: true }))) return;
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Knowledge Base</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Train Grovia with your business knowledge — AI answers only from these sources</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
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
        <button type="button" onClick={testSearch} className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {searchResults && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{searchResults.length} results</p>
          {searchResults.map((r, i) => (
            <div key={i} className="text-xs text-slate-600 dark:text-slate-400 p-2 bg-white/60 dark:bg-slate-900/60 rounded-lg">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{r.sourceName}</span>
              <p className="mt-1 line-clamp-3">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={createSource} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Name (e.g. Pricing 2026, Product FAQ)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input placeholder="Category (optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 sm:col-span-2" />
          </div>

          {/* ── Website ── */}
          {form.type === 'website' && (
            <input placeholder="https://yourbusiness.com/about" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
          )}

          {/* ── PDF / DOCX upload ── */}
          {(form.type === 'pdf' || form.type === 'docx') && (
            <div>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-6 cursor-pointer hover:border-emerald-400 transition-colors">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : <FileText className="w-6 h-6 text-slate-400" />}
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {file ? file.name : `Click to upload ${form.type.toUpperCase()} — max 15 MB`}
                </span>
                <input type="file" className="hidden"
                  accept={form.type === 'pdf' ? '.pdf' : '.doc,.docx'}
                  onChange={(e) => { handleFileUpload(e.target.files?.[0]); e.target.value = ''; }} disabled={uploading} />
              </label>
              {file && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5">✓ {file.name} uploaded — click Add &amp; Index to process</p>}
            </div>
          )}

          {/* ── FAQ builder ── */}
          {form.type === 'faq' && (
            <div className="space-y-2">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 relative">
                  <input placeholder={`Question ${i + 1}`} value={f.question}
                    onChange={(e) => setFaqs(faqs.map((x, j) => j === i ? { ...x, question: e.target.value } : x))}
                    className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
                  <textarea placeholder="Answer" rows={2} value={f.answer}
                    onChange={(e) => setFaqs(faqs.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))}
                    className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
                  {faqs.length > 1 && (
                    <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add another Q&amp;A
              </button>
            </div>
          )}

          {/* ── Catalog builder ── */}
          {form.type === 'catalog' && (
            <div className="space-y-2">
              {catalog.map((p, i) => (
                <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 relative">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input placeholder="Product / service name" value={p.name}
                      onChange={(e) => setCatalog(catalog.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      className="sm:col-span-2 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
                    <input placeholder="Price (e.g. Rs. 999)" value={p.price}
                      onChange={(e) => setCatalog(catalog.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                      className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input placeholder="SKU (optional)" value={p.sku}
                      onChange={(e) => setCatalog(catalog.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))}
                      className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
                    <input placeholder="Short description" value={p.description}
                      onChange={(e) => setCatalog(catalog.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      className="sm:col-span-2 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
                  </div>
                  {catalog.length > 1 && (
                    <button type="button" onClick={() => setCatalog(catalog.filter((_, j) => j !== i))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setCatalog([...catalog, { name: '', price: '', sku: '', description: '' }])} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add another product
              </button>
            </div>
          )}

          {/* ── Pasted text (company / custom / txt) ── */}
          {(form.type === 'company' || form.type === 'custom' || form.type === 'txt') && (
            <textarea
              rows={6}
              placeholder="Paste your business information, policies, pricing, hours, refund policy, FAQs…"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            />
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting || uploading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Indexing…' : 'Add & Index'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <PageLoader label="Loading knowledge sources…" height="12rem" />
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">No knowledge sources yet</p>
          <p className="text-sm mt-1 mb-4">Add company info, FAQs, or crawl your website — your AI can only answer from what's here.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
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
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.pending}`}>
                      {s.status}
                    </span>
                    {s.category && <span className="text-[10px] text-slate-400">{s.category}</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {meta.label} · v{s.version || 1} · {s.chunkCount || 0} chunks
                    {s.lastIndexedAt && ` · indexed ${new Date(s.lastIndexedAt).toLocaleDateString()}`}
                  </p>
                  {s.lastError && <p className="text-xs text-red-500 mt-0.5">{s.lastError}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => reindex(s._id)} title="Re-index" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => remove(s._id)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
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
