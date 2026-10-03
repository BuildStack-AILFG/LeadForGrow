'use client';

import { useState } from 'react';
import { Clock, Eye } from 'lucide-react';
import { applyPreview } from './constants';

export default function AutomatedFlowPanel({ type, template, onChange, onCopyVar }) {
  const [showPreview, setShowPreview] = useState(false);
  const isWelcome = type === 'welcome';

  return (
    <div className="bg-canvas dark:bg-slate-900 rounded overflow-hidden">
      <div className="px-6 py-5 border-b border-line dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-meta font-semibold text-accent-fg mb-1">Automated flow</p>
          <h2 className="text-title font-semibold text-fg dark:text-slate-50">
            {isWelcome ? 'Welcome message' : 'Follow-up message'}
          </h2>
          <p className="text-sm text-fg-tertiary mt-1 max-w-lg">
            {isWelcome
              ? 'Sent instantly when a new lead enters your CRM.'
              : 'Sent automatically if there is no reply within the set time.'}
          </p>
        </div>
        <label className="flex items-center gap-3 px-4 py-2 bg-subtle dark:bg-slate-800/50 rounded cursor-pointer">
          <span className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Active</span>
          <div
            className={`relative w-9 h-5 rounded-full transition-colors ${!template.enabled ? 'bg-slate-300 dark:bg-slate-600' : ''}`}
            style={{ backgroundColor: template.enabled ? '#1D4B3E' : undefined }}
            onClick={() => onChange({ ...template, enabled: !template.enabled })}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-canvas rounded-full transition-transform ${template.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-fg-tertiary mb-1.5">Email subject</label>
            <input
              value={template.subject}
              onChange={(e) => onChange({ ...template, subject: e.target.value })}
              className={inputClass}
              placeholder="Subject line"
            />
          </div>
          {!isWelcome && (
            <div>
              <label className="block text-xs font-medium text-fg-tertiary mb-1.5">Wait before sending (hours)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
                <input
                  type="number"
                  min={1}
                  value={template.delayHours}
                  onChange={(e) => onChange({ ...template, delayHours: parseInt(e.target.value, 10) || 24 })}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-fg-tertiary">Message body</label>
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="inline-flex items-center gap-1 text-xs text-accent-fg font-medium">
              <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {showPreview ? (
            <div className="p-5 bg-subtle dark:bg-slate-800/50 rounded text-sm whitespace-pre-wrap leading-relaxed min-h-[200px] text-fg-secondary dark:text-fg-disabled">
              {applyPreview(template.body)}
            </div>
          ) : (
            <textarea
              value={template.body}
              onChange={(e) => onChange({ ...template, body: e.target.value })}
              rows={10}
              className={`${inputClass} resize-none leading-relaxed`}
              placeholder="Hi {{lead.name}}, …"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {['{{lead.name}}', '{{lead.email}}', '{{user.name}}', '{{business.name}}'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onCopyVar(v)}
              className="px-2.5 py-1 text-meta font-mono bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-tertiary rounded hover:bg-accent/10 dark:hover:bg-teal-950/30 hover:text-accent-fg transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-4 py-2.5 text-sm bg-subtle dark:bg-slate-800/80 border-0 rounded focus:outline-none focus:ring-2 focus:ring-focus';
