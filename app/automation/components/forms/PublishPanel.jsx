'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Globe, Code2, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getEmbedSnippets } from './constants';
import APIDocumentation from './APIDocumentation';

const SECTIONS = [
  { id: 'share', label: 'Share', icon: Globe },
  { id: 'embed', label: 'Embed', icon: Code2 },
  { id: 'api', label: 'API', icon: Code2 },
  { id: 'automate', label: 'Automate', icon: Zap },
];

export default function PublishPanel({ form, styling, onStylingChange, onPublish, isPublished }) {
  const [section, setSection] = useState('share');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const snippets = getEmbedSnippets(form, baseUrl);

  const copy = (text, msg = 'Copied') => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-title font-semibold text-fg dark:text-slate-50">Publish your form</h2>
        <p className="text-sm text-fg-tertiary mt-1">Share, embed, or connect via API. Existing tokens stay the same.</p>
      </div>

      {/* Publish status */}
      <div className={`flex items-center justify-between p-4 rounded-lg mb-8 ${isPublished ? 'bg-accent-subtle dark:bg-emerald-950/30' : 'bg-warning-subtle dark:bg-amber-950/30'}`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className={`w-5 h-5 ${isPublished ? 'text-accent-fg' : 'text-warning'}`} />
          <div>
            <p className="text-sm font-medium text-fg dark:text-slate-100">{isPublished ? 'Form is live' : 'Form is unpublished'}</p>
            <p className="text-xs text-fg-tertiary">{isPublished ? 'Accepting submissions' : 'Not accepting submissions yet'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPublish(!isPublished)}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
            isPublished ? 'bg-canvas dark:bg-slate-800 text-fg-secondary' : 'bg-accent text-white shadow-popover'
          }`}
        >
          {isPublished ? 'Unpublish' : 'Publish now'}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-muted dark:bg-slate-800 rounded-lg mb-6 w-fit">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              section === id ? 'bg-canvas dark:bg-slate-900 text-fg dark:text-slate-50' : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {section === 'share' && (
        <div className="bg-canvas dark:bg-slate-900 rounded-lg p-6 space-y-4">
          <p className="text-sm font-medium text-fg dark:text-slate-100">Public link</p>
          <p className="text-xs text-fg-tertiary">Share in ads, WhatsApp, or email — no website needed.</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-subtle dark:bg-slate-800 p-3 rounded-lg break-all">{snippets.hostedLink}</code>
            <button type="button" onClick={() => copy(snippets.hostedLink)} className="p-3 text-accent-fg hover:bg-accent-subtle rounded-lg"><Copy className="w-4 h-4" /></button>
            <a href={snippets.hostedLink} target="_blank" rel="noopener noreferrer" className="p-3 text-accent-fg hover:bg-accent-subtle rounded-lg"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      )}

      {section === 'embed' && (
        <div className="space-y-4">
          <CodeBlock label="Floating widget (recommended)" code={snippets.html} onCopy={() => copy(snippets.html, 'Embed code copied')} />
          <CodeBlock label="Inline embed" code={snippets.inline} onCopy={() => copy(snippets.inline, 'Inline embed copied')} />
          <CodeBlock label="Iframe" code={snippets.iframe} onCopy={() => copy(snippets.iframe)} />
          <CodeBlock label="Popup with auto-open" code={snippets.popup} onCopy={() => copy(snippets.popup)} />
        </div>
      )}

      {section === 'api' && (
        <div className="bg-canvas dark:bg-slate-900 rounded-lg p-6">
          <APIDocumentation form={form} baseUrl={baseUrl} />
        </div>
      )}

      {section === 'automate' && (
        <div className="space-y-3">
          {[
            { key: 'whatsappReply', label: 'Auto WhatsApp reply', desc: 'Instant acknowledgment message' },
            { key: 'emailNotify', label: 'Email notification', desc: 'Alert your team on new leads' },
            { key: 'assignAgent', label: 'Auto-assign agent', desc: 'Round-robin team assignment' },
            { key: 'triggerAutomation', label: 'Trigger automation', desc: 'Run CRM automation rules' },
          ].map((item) => (
            <label key={item.key} className="flex items-start gap-3 p-4 bg-canvas dark:bg-slate-900 rounded-lg cursor-pointer hover:shadow-popover transition-shadow">
              <input
                type="checkbox"
                checked={!!styling.automation?.[item.key]}
                onChange={(e) => onStylingChange({
                  ...styling,
                  automation: { ...styling.automation, [item.key]: e.target.checked },
                })}
                className="mt-0.5 rounded text-accent-fg"
              />
              <div>
                <p className="text-sm font-medium text-fg dark:text-slate-100">{item.label}</p>
                <p className="text-xs text-fg-tertiary">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ label, code, onCopy }) {
  return (
    <div className="bg-canvas dark:bg-slate-900 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">{label}</span>
        <button type="button" onClick={onCopy} className="flex items-center gap-1 text-xs text-accent-fg font-medium">
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto max-h-48"><code>{code}</code></pre>
    </div>
  );
}
