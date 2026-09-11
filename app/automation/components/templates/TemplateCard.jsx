'use client';

import { Mail, MessageCircle, Trash2, Pencil, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { applyPreview } from './constants';

export default function TemplateCard({ template, index, onEdit, onDelete }) {
  const isWhatsApp = template.channel === 'whatsapp';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isWhatsApp ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600'
            }`}>
              {isWhatsApp ? <MessageCircle className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{template.name}</p>
              <p className="text-xs text-slate-500 capitalize">{template.channel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!template.isMetaTemplate && (
              <button type="button" onClick={() => onEdit(template)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button type="button" onClick={() => onDelete(template)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {template.isMetaTemplate && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full mb-3">
            <ShieldCheck className="w-3 h-3" /> Meta · {template.metaCategory || 'Marketing'}
          </span>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed min-h-[3.75rem]">
          {applyPreview(template.body)}
        </p>

        {template.channel === 'email' && template.subject && (
          <p className="text-xs text-slate-400 mt-2 truncate">Subject: {template.subject}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onEdit(template)}
        className="w-full px-5 py-3 text-xs font-medium text-teal-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/20 border-t border-slate-100 dark:border-slate-800 transition-colors text-left"
      >
        {template.isMetaTemplate ? 'View template' : 'Edit template →'}
      </button>
    </motion.div>
  );
}
