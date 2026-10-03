'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import WarningNote from '@/app/components/ui/WarningNote';
import { joinWebhookUrl, isPublicHttpsOrigin } from '@/lib/meta/webhookUrls';

/**
 * A read-only callback URL with a Copy button, for pasting into the Meta developer dashboard.
 * The origin is the address this page is opened on (that is the host Meta must reach); `origin` can be
 * passed in for tests.
 */
export default function WebhookUrlField({ path, label = 'Callback URL', origin: originProp = null, children }) {
  const [origin, setOrigin] = useState(originProp || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!originProp && typeof window !== 'undefined') setOrigin(window.location.origin);
  }, [originProp]);

  const url = joinWebhookUrl(origin, path);
  const reachable = origin ? isPublicHttpsOrigin(origin) : true;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked — the URL is selectable in the box, so the user can still copy it by hand.
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary">{label}</label>
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url || path}
          onFocus={(e) => e.target.select()}
          aria-label={label}
          className="flex-1 min-w-0 px-3 py-2 text-xs font-mono border border-line dark:border-slate-700 rounded bg-subtle dark:bg-slate-800 text-fg dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-focus"
        />
        <button
          type="button"
          onClick={copy}
          disabled={!url}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-line dark:border-slate-700 rounded-md bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-slate-200 hover:bg-subtle dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent-fg dark:text-accent-fg" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {children}
      {!reachable && (
        <WarningNote>
          This is a local or non-https address, so Meta cannot reach it. Open LeadForGrow on your live https address
          (or an ngrok https URL) and copy the URL from there.
        </WarningNote>
      )}
    </div>
  );
}
