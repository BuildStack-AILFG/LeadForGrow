'use client';

import { useEffect, useState } from 'react';
import { X, FileText, Search } from 'lucide-react';

export default function TemplateGalleryModal({ onClose, onSelect }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/automation/templates');
        const data = await res.json();
        if (data.success && data.manual) setTemplates(data.manual);
      } catch {
        // best-effort — leave templates empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = templates.filter((t) => t.name?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-lg bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Template gallery</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4B3E]/20 focus:border-[#1D4B3E]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading templates…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No WhatsApp templates found.</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id || t.name}
                type="button"
                onClick={() => onSelect(t)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-[#BAE0CF] hover:bg-[#F0F9F5] text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{t.name}</div>
                  <div className="text-[11px] text-slate-400">{t.language || 'en'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
