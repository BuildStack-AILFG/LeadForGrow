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
    <div className="bg-canvas dark:bg-slate-900 rounded border border-line dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-slate-800">
        <p className="text-sm font-medium text-fg dark:text-slate-100">{label}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-fg-secondary dark:text-fg-disabled hover:bg-muted dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent-fg dark:text-accent-fg" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-xs text-fg-disabled bg-slate-950 overflow-x-auto font-mono leading-relaxed">{code}</pre>
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
      <div className="rounded border border-warning/30 bg-warning-subtle dark:bg-amber-950/20 dark:border-amber-900 p-6">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Publish your chatbot first</p>
        <p className="text-xs text-warning/80 dark:text-amber-300/80 mt-1">
          Turn on the chatbot using the toggle above, then paste the embed code on your website.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded bg-accent-subtle dark:bg-emerald-950/20 border border-line dark:border-emerald-900">
        <Globe className="w-5 h-5 text-accent-fg flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-accent-fg dark:text-emerald-200">Works on any website</p>
          <p className="text-xs text-accent-fg/80 dark:text-accent-fg/70 mt-1">
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

      <div className="bg-canvas dark:bg-slate-900 rounded border border-line dark:border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-4 h-4 text-fg-tertiary dark:text-fg-tertiary" />
          <p className="text-sm font-medium text-fg dark:text-slate-100">WordPress & CMS</p>
        </div>
        <p className="text-xs text-fg-tertiary dark:text-fg-tertiary leading-relaxed">{snippets.wordpress}</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded bg-subtle dark:bg-slate-900/50 border border-line dark:border-slate-800">
        <Code2 className="w-5 h-5 text-fg-tertiary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-fg dark:text-slate-100">Your Business ID</p>
          <code className="text-xs text-fg-secondary dark:text-fg-tertiary break-all">{businessId}</code>
        </div>
      </div>
    </div>
  );
}
