'use client';

import { useState } from 'react';
import { X, Copy, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getEmbedSnippets } from './constants';
import APIDocumentation from './APIDocumentation';

const TABS = [
  { id: 'html', label: 'HTML embed' },
  { id: 'iframe', label: 'Iframe' },
  { id: 'popup', label: 'Popup' },
  { id: 'react', label: 'React' },
  { id: 'api', label: 'API docs' },
  { id: 'hosted', label: 'Public link' },
];

export default function EmbedCodeModal({ form, onClose }) {
  const [tab, setTab] = useState('html');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const snippets = getEmbedSnippets(form, baseUrl);

  const copy = (text, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const reactSnippet = `import LeadForGrowWidget from './LeadForGrowWidget';
// Use token: "${form.token}"
// POST to: ${snippets.submissionUrl}`;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-3xl sm:max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Publish & embed</h2>
            <p className="text-xs text-slate-500">{form.name}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-wrap gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                tab === t.id ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'html' && (
            <>
              <CodeBlock label="Floating widget (recommended)" code={snippets.html} onCopy={() => copy(snippets.html, 'Embed code copied')} />
              <div className="mt-4">
                <CodeBlock label="Inline embed (no floating button)" code={snippets.inline} onCopy={() => copy(snippets.inline, 'Inline embed copied')} />
              </div>
            </>
          )}
          {tab === 'iframe' && (
            <CodeBlock label="Iframe embed" code={snippets.iframe} onCopy={() => copy(snippets.iframe)} />
          )}
          {tab === 'popup' && (
            <CodeBlock label="Popup widget" code={snippets.popup} onCopy={() => copy(snippets.popup)} />
          )}
          {tab === 'react' && (
            <>
              <CodeBlock label="React integration" code={reactSnippet} onCopy={() => copy(snippets.html)} />
              <p className="text-xs text-slate-500 mt-3">Use the HTML widget inside a React component via dangerouslySetInnerHTML or a portal.</p>
            </>
          )}
          {tab === 'api' && <APIDocumentation form={form} baseUrl={baseUrl} />}
          {tab === 'hosted' && (
            <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-teal-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Public form URL</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Share in ads, WhatsApp, or email — no website needed.</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border break-all">{snippets.hostedLink}</code>
                    <button type="button" onClick={() => copy(snippets.hostedLink)} className="p-2 text-teal-600"><Copy className="w-4 h-4" /></button>
                    <a href={snippets.hostedLink} target="_blank" rel="noopener noreferrer" className="p-2 text-teal-600"><ExternalLink className="w-4 h-4" /></a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CodeBlock({ label, code, onCopy }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <button type="button" onClick={onCopy} className="flex items-center gap-1 text-xs text-teal-600 font-medium">
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto max-h-64"><code>{code}</code></pre>
    </div>
  );
}
