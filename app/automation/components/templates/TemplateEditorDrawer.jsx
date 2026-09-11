'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import { CHANNELS, applyPreview } from './constants';
import VariablePanel from './VariablePanel';

export default function TemplateEditorDrawer({ open, template, onClose, onSave, onCopyVar, readOnly = false }) {
  const [draft, setDraft] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template) setDraft({ ...template });
    setShowPreview(false);
  }, [template, open]);

  if (!open || !template || !draft) return null;

  const isReadOnly = readOnly || draft.isMetaTemplate;

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const handleSave = () => onSave(draft);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {isReadOnly ? 'View template' : 'Edit template'}
            </h2>
            <p className="text-xs text-slate-500">{isReadOnly ? 'Meta templates are read-only' : 'Customize your message'}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!isReadOnly && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Template name</label>
              <input
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                className={inputClass}
              />
            </div>
          )}

          {!isReadOnly && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Channel</label>
              <div className="flex gap-2">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const active = draft.channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => update({ channel: ch.id })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                        active
                          ? ch.color === 'emerald' ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {draft.channel === 'email' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Subject line</label>
              <input
                value={draft.subject || ''}
                onChange={(e) => update({ subject: e.target.value })}
                disabled={isReadOnly}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Message</label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center gap-1 text-xs text-teal-600 font-medium"
              >
                <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[160px]">
                {applyPreview(draft.body)}
              </div>
            ) : (
              <textarea
                value={draft.body}
                onChange={(e) => update({ body: e.target.value })}
                disabled={isReadOnly}
                rows={8}
                className={`${inputClass} resize-none font-mono text-sm leading-relaxed`}
                placeholder="Hi {{lead.name}}, …"
              />
            )}
          </div>

          {!isReadOnly && <VariablePanel onCopy={onCopyVar} />}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl">
            Cancel
          </button>
          {!isReadOnly && (
            <button type="button" onClick={handleSave} className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl">
              Done
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

const inputClass = 'w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/25 disabled:opacity-60';
