'use client';

import { Copy, Check, Globe, Code2, FileCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getEmbedSnippets } from './constants';

function CodeBlock({ label, code, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs text-slate-300 bg-slate-950 overflow-x-auto font-mono leading-relaxed">{code}</pre>
    </div>
  );
}

export default function ChatbotInstallPanel({ businessId, config, isPublished }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const snippets = getEmbedSnippets(businessId, baseUrl, config.appearance?.position || 'right');

  const copy = (text, msg = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  if (!isPublished) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-6">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Publish your chatbot first</p>
        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1">
          Turn on the chatbot using the toggle above, then paste the embed code on your website.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900">
        <Globe className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Works on any website</p>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/70 mt-1">
            WordPress, Shopify, Webflow, React, or plain HTML — paste once and leads flow into your CRM with source <strong>Bot</strong>.
          </p>
        </div>
      </div>

      <CodeBlock
        label="Script embed (recommended)"
        code={snippets.script}
        onCopy={() => copy(snippets.script, 'Embed code copied')}
      />

      <CodeBlock
        label="Direct iframe"
        code={snippets.iframe}
        onCopy={() => copy(snippets.iframe, 'Iframe code copied')}
      />

      <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-4 h-4 text-slate-500" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">WordPress & CMS</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{snippets.wordpress}</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <Code2 className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Your Business ID</p>
          <code className="text-xs text-slate-600 dark:text-slate-400 break-all">{businessId}</code>
        </div>
      </div>
    </div>
  );
}
