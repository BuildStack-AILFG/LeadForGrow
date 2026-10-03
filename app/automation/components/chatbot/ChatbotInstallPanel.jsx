'use client';

import { useState } from 'react';
import { Copy, Check, Rocket, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getEmbedSnippets } from './constants';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';

function CodeBlock({ label, hint, code, toastMsg }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success(toastMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="overflow-hidden rounded-md border border-line">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-subtle px-3 py-2">
        <div className="min-w-0">
          <p className="text-dense font-medium text-fg">{label}</p>
          {hint && <p className="text-meta text-fg-tertiary">{hint}</p>}
        </div>
        <Button size="sm" icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
      </div>
      <pre className="overflow-x-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">{code}</pre>
    </div>
  );
}

export default function ChatbotInstallPanel({ businessId, config, isPublished, onPublish, publishing }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const snippets = getEmbedSnippets(businessId, baseUrl, config.appearance?.position || 'right');

  if (!isPublished) {
    return (
      <EmptyState
        icon={Rocket}
        title="Publish the chatbot to get its code"
        description="Once it’s live, you paste one snippet into your website."
        action={onPublish && <Button variant="primary" icon={Rocket} onClick={onPublish} loading={publishing}>Publish</Button>}
      />
    );
  }

  return (
    <div className="space-y-5 p-5">
      <div>
        <h3 className="text-body font-semibold text-fg">Add it to your website</h3>
        <p className="mt-0.5 text-dense text-fg-secondary">
          Paste this just before <code className="rounded bg-muted px-1 font-mono text-meta">&lt;/body&gt;</code> on every page. Works with WordPress, Shopify, Webflow and plain HTML.
        </p>
      </div>

      <CodeBlock label="Script" hint="Recommended" code={snippets.script} toastMsg="Embed code copied" />

      <details className="group rounded-md border border-line">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-dense font-medium text-fg-secondary hover:text-fg">
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          Other ways to install
        </summary>
        <div className="space-y-4 border-t border-line p-3">
          <CodeBlock label="Iframe" hint="If your site doesn’t allow scripts" code={snippets.iframe} toastMsg="Iframe code copied" />
          <div>
            <p className="text-dense font-medium text-fg">WordPress</p>
            <p className="mt-0.5 text-meta leading-relaxed text-fg-tertiary">{snippets.wordpress}</p>
          </div>
        </div>
      </details>
    </div>
  );
}
