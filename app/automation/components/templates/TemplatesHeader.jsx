'use client';

import { Plus, Save, Loader2 } from 'lucide-react';
import { WhatsAppIcon } from '../chat/BrandIcons';

export default function TemplatesHeader({ stats, saving, syncing, onSave, onSync, onCreate }) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F9FA]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">Message templates</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {stats.total} templates · {stats.autoActive} auto flows active · quick replies & email
            </p>
            <a
              href="/automation/whatsapp-templates"
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1D4B3E] dark:text-emerald-400 hover:underline"
            >
              → For Meta-approved WhatsApp templates, use WhatsApp Templates
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/automation/whatsapp-templates"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1D4B3E] dark:text-emerald-400 bg-[#25D366]/10 dark:bg-emerald-950/40 hover:bg-[#25D366]/20 dark:hover:bg-emerald-950/60 rounded transition-colors"
            >
              <WhatsAppIcon size={14} style={{ color: '#25D366' }} />
              WhatsApp Templates
            </a>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New template
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1D4B3E] hover:bg-[#163c32] rounded shadow-md shadow-[#1D4B3E]/20 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
