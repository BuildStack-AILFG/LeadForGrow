'use client';

import { Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { buildSampleSubmissionBody, getEmbedSnippets } from './constants';

export default function APIDocumentation({ form, baseUrl }) {
  const { submissionUrl, configUrl, curl } = getEmbedSnippets(form, baseUrl);

  const copy = (t) => { navigator.clipboard.writeText(t); toast.success('Copied'); };

  const sampleBody = JSON.stringify(buildSampleSubmissionBody(form), null, 2);

  const sampleResponse = JSON.stringify({
    success: true,
    message: form.successMessage || 'Thank you! We have received your inquiry.',
    redirectUrl: form.redirectUrl || null,
  }, null, 2);

  return (
    <div className="space-y-5 text-sm">
      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">Load form config (GET)</h4>
        <div className="flex items-center gap-2 bg-subtle dark:bg-slate-800 rounded-lg p-3">
          <span className="px-2 py-0.5 bg-info-subtle text-info text-meta font-semibold rounded">GET</span>
          <code className="text-xs flex-1 break-all">{configUrl}</code>
          <button type="button" onClick={() => copy(configUrl)}><Copy className="w-3.5 h-3.5 text-fg-tertiary" /></button>
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">Submit lead (POST)</h4>
        <div className="flex items-center gap-2 bg-subtle dark:bg-slate-800 rounded-lg p-3">
          <span className="px-2 py-0.5 bg-accent-subtle text-accent-fg text-meta font-semibold rounded">POST</span>
          <code className="text-xs flex-1 break-all">{submissionUrl}</code>
          <button type="button" onClick={() => copy(submissionUrl)}><Copy className="w-3.5 h-3.5 text-fg-tertiary" /></button>
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">Authentication</h4>
        <p className="text-xs text-fg-secondary dark:text-fg-tertiary mb-2">Include your form token in the JSON body. Keep it secret — treat it like an API key.</p>
        <div className="flex items-center gap-2 bg-warning-subtle dark:bg-amber-950/30 border border-warning/30 dark:border-amber-900 rounded-lg p-3">
          <code className="text-xs break-all flex-1 font-mono text-amber-900 dark:text-amber-200">{form.token}</code>
          <button type="button" onClick={() => copy(form.token)}><Copy className="w-3.5 h-3.5" /></button>
        </div>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">Request body</h4>
        <pre className="bg-slate-900 text-accent-fg p-4 rounded-lg text-xs overflow-x-auto"><code>{sampleBody}</code></pre>
        <p className="text-meta text-fg-tertiary mt-2">Fields match your form builder. Always include <code className="bg-muted px-1 rounded">token</code>. Submissions create CRM leads automatically.</p>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">Success response</h4>
        <pre className="bg-slate-900 text-fg-disabled p-4 rounded-lg text-xs overflow-x-auto"><code>{sampleResponse}</code></pre>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">cURL</h4>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto"><code>{curl}</code></pre>
        <button type="button" onClick={() => copy(curl)} className="mt-2 text-xs text-accent-fg font-medium">Copy cURL</button>
      </section>

      <section>
        <h4 className="text-xs font-semibold text-fg-tertiary mb-2">CRM</h4>
        <p className="text-xs text-fg-secondary dark:text-fg-tertiary">Every submission flows through the unified ingestion engine — leads appear in your CRM with source <strong>form</strong>. Custom fields are stored on the lead metadata.</p>
      </section>
    </div>
  );
}
