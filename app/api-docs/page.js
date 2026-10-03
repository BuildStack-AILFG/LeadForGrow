import Link from 'next/link';
import { KeyRound, Gauge, AlertTriangle, ShieldCheck } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';
import CodeTabs from './CodeTabs';

export const metadata = {
  title: 'API & Webhooks reference',
  description: 'Send leads into LeadForGrow from your website or app and start automation workflows from outside events — endpoints, authentication, payloads and errors.',
  alternates: { canonical: 'https://www.leadforgrow.com/api-docs' },
};

const BASE = 'https://www.leadforgrow.com';

const ENDPOINTS = [
  {
    id: 'form-submit',
    method: 'POST',
    path: '/api/forms/submit',
    title: 'Submit a form',
    summary: 'Creates a lead from a LeadForGrow form — use it when you build your own form instead of the embed.',
    auth: 'The form’s public token in the body. Find it in Forms → your form → Publish & embed.',
    fields: [
      ['token', 'string', 'Required. The form token.'],
      ['name', 'string', 'Lead name.'],
      ['email', 'string', 'Email or phone is required.'],
      ['phone', 'string', 'With country code, e.g. 919876543210.'],
      ['…any field', 'string', 'Other form fields are saved on the lead.'],
    ],
    samples: [
      { label: 'cURL', code: `curl -X POST ${BASE}/api/forms/submit \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "token": "YOUR_FORM_TOKEN",\n    "name": "Jane Doe",\n    "email": "jane@example.com",\n    "phone": "919876543210",\n    "message": "Need a quote"\n  }'` },
      { label: 'JavaScript', code: `await fetch('${BASE}/api/forms/submit', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    token: 'YOUR_FORM_TOKEN',\n    name: 'Jane Doe',\n    email: 'jane@example.com',\n  }),\n});` },
      { label: 'Response 200', code: `{\n  "success": true,\n  "message": "Thank you! We have received your inquiry.",\n  "redirectUrl": null\n}` },
    ],
    errors: [['400', 'Missing token'], ['404', 'Invalid or inactive form'], ['429', 'More than 5 submissions a minute from one address']],
  },
  {
    id: 'workflow-webhook',
    method: 'POST',
    path: '/api/automation/webhooks/{sequenceId}/{secret}',
    title: 'Trigger a workflow',
    summary: 'Starts a sequence whose trigger is “Webhook”. Creates the lead if needed, or runs for an existing lead.',
    auth: 'Copy the full URL from the sequence’s Workflow settings. Instead of the secret in the URL you may send it as an x-api-key header, or sign the raw body with HMAC-SHA256 in X-Webhook-Signature (sha256=<hex>).',
    fields: [
      ['leadId', 'string', 'Run for this existing lead. If omitted, a lead is created from the fields below.'],
      ['name', 'string', 'Also accepts full_name.'],
      ['email', 'string', ''],
      ['phone', 'string', 'Also accepts mobile.'],
      ['…any field', 'any', 'The whole body is stored with the lead and is available to the workflow.'],
    ],
    samples: [
      { label: 'cURL', code: `curl -X POST ${BASE}/api/automation/webhooks/SEQUENCE_ID/SECRET \\\n  -H "Content-Type: application/json" \\\n  -d '{ "name": "Ravi", "phone": "919812345678", "plan": "gold" }'` },
      { label: 'Signed (Node)', code: `import crypto from 'node:crypto';\n\nconst body = JSON.stringify({ name: 'Ravi', phone: '919812345678' });\nconst sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex');\n\nawait fetch(\`${BASE}/api/automation/webhooks/\${SEQUENCE_ID}/x\`, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': \`sha256=\${sig}\` },\n  body,\n});` },
      { label: 'Response 200', code: `{\n  "success": true,\n  "leadId": "66f0c2…",\n  "logId": "66f0c3…",\n  "replayable": true\n}` },
    ],
    errors: [['400', 'Body is not valid JSON'], ['401', 'Secret, key or signature does not match'], ['404', 'Workflow not found, or its trigger is not Webhook'], ['422', 'No lead could be created (no email or phone)']],
  },
];

function Method({ m }) {
  return <span className="rounded bg-[#34D399]/15 px-2 py-0.5 font-mono text-xs font-bold text-[#34D399]">{m}</span>;
}

export default function ApiDocsPage() {
  return (
    <MarketingShell>
      <div className="bg-[#0B1712] pt-20 text-white sm:pt-24">
        <section className={`${SITE.wrap} border-b border-white/10 py-16`}>
          <p className={SITE.eyebrowDark}>Developers</p>
          <h1 className="mt-3 font-[family-name:var(--font-plus-jakarta)] text-4xl font-bold tracking-[-0.02em] sm:text-5xl">API &amp; webhooks</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Send leads into LeadForGrow from any website, landing page builder or app, and start automation workflows from your own systems.
            All requests are JSON over HTTPS.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/70">
            <span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-[#34D399]" /> Secret-based authentication</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#34D399]" /> Constant-time secret checks</span>
            <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-[#34D399]" /> Base URL <code className="font-mono text-white">{BASE}</code></span>
          </div>
        </section>

        <div className={`${SITE.wrap} grid gap-10 py-14 lg:grid-cols-[200px_1fr]`}>
          <nav aria-label="Endpoints" className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Endpoints</p>
            <ul className="space-y-1">
              {ENDPOINTS.map((e) => (
                <li key={e.id}><a href={`#${e.id}`} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"><Method m={e.method} /> {e.title}</a></li>
              ))}
              <li><a href="#errors" className="block rounded px-2 py-1.5 text-sm text-white/75 hover:bg-white/5 hover:text-white">Errors &amp; limits</a></li>
            </ul>
          </nav>

          <div className="min-w-0 space-y-20">
            {ENDPOINTS.map((e) => (
              <section key={e.id} id={e.id} className="grid scroll-mt-24 gap-8 xl:grid-cols-2">
                <div className="min-w-0">
                  <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold">{e.title}</h2>
                  <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm"><Method m={e.method} /> <span className="break-all text-white/90">{e.path}</span></p>
                  <p className="mt-4 text-[15px] leading-relaxed text-white/70">{e.summary}</p>
                  <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-white/50">Authentication</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/70">{e.auth}</p>
                  <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-white/50">Body</h3>
                  <dl className="mt-2 divide-y divide-white/10 border-y border-white/10">
                    {e.fields.map(([name, type, desc]) => (
                      <div key={name} className="grid gap-1 py-3 sm:grid-cols-[130px_70px_1fr]">
                        <dt className="font-mono text-sm text-white">{name}</dt>
                        <dd className="font-mono text-xs text-white/40">{type}</dd>
                        <dd className="text-sm text-white/65">{desc}</dd>
                      </div>
                    ))}
                  </dl>
                  <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-white/50">Errors</h3>
                  <ul className="mt-2 space-y-1.5">
                    {e.errors.map(([code, why]) => (
                      <li key={code} className="flex gap-3 text-sm text-white/70"><span className="font-mono text-amber-300">{code}</span> {why}</li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
                  <CodeTabs samples={e.samples} />
                </div>
              </section>
            ))}

            <section id="errors" className="scroll-mt-24 rounded-xl border border-white/10 p-6">
              <h2 className="flex items-center gap-2 font-[family-name:var(--font-plus-jakarta)] text-xl font-bold"><AlertTriangle className="h-5 w-5 text-amber-300" /> Errors &amp; limits</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] text-white/70">
                <li>Every response is JSON with <code className="font-mono text-white">success</code> true or false; failures include an <code className="font-mono text-white">error</code> message.</li>
                <li>A lead needs an email address or a phone number.</li>
                <li>Leads count towards your plan’s monthly lead limit; requests over the limit are refused with a clear message.</li>
                <li>Keep secrets on your server. Anyone with a workflow URL can start that workflow, so treat it like a password.</li>
              </ul>
            </section>

            <p className="text-sm text-white/60">
              Need something these endpoints don’t cover? <Link href="/contact" className="font-medium text-[#34D399] hover:underline">Tell us what you’re building</Link>.
            </p>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
