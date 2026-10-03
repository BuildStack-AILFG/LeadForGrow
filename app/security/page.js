import Link from 'next/link';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Security',
  description: 'How LeadForGrow protects your business and customer data: encryption, authentication, access control, workspace isolation, verified webhooks and responsible disclosure.',
  alternates: { canonical: 'https://www.leadforgrow.com/security' },
};

const SECTIONS = [
  {
    id: 'encryption', title: 'Encryption',
    body: 'Data in transit is protected with TLS — the website and the app are served over HTTPS. Sensitive credentials are encrypted at rest with AES-256.',
    practice: ['WhatsApp, Instagram and Facebook access tokens, email passwords and your own AI key are stored encrypted', 'Encrypted credentials are never sent back to the browser — settings only show whether one is saved'],
  },
  {
    id: 'authentication', title: 'Authentication',
    body: 'Passwords are hashed with bcrypt before they are stored. Signed-in sessions use signed tokens that expire.',
    practice: ['We never store passwords in readable form', 'Sign-in attempts are rate-limited'],
  },
  {
    id: 'access', title: 'Access control',
    body: 'Six built-in roles — Owner, Admin, Manager, Sales Agent, Support and Viewer — decide who can see and change what. Owners can also lock individual pages per role.',
    practice: ['Salespeople can be limited to their own leads in views such as Leak Radar', 'Security and admin activity is recorded in an audit log with who did it and when'],
  },
  {
    id: 'isolation', title: 'Workspace isolation',
    body: 'Each business is a separate workspace. Leads, conversations, settings and files are stored and queried per workspace, so your team works only with your own business’s data.',
    practice: ['Diagnostic and webhook tools only show your own workspace’s records'],
  },
  {
    id: 'webhooks', title: 'Inbound webhooks',
    body: 'Messages and events from Meta are accepted only with a valid X-Hub-Signature-256. Requests with a missing or wrong signature are refused, not processed.',
    practice: ['Workflow webhook secrets are compared in constant time', 'Credential headers are removed before webhook payloads are logged'],
  },
  {
    id: 'disclosure', title: 'Responsible disclosure',
    body: 'Report vulnerabilities to security@leadforgrow.com. We aim to respond within 72 hours.',
    practice: ['Our responsible disclosure policy describes scope and safe harbour for researchers'],
  },
];

export default function SecurityPage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} ${SITE.paper} border-b ${SITE.rule} pb-16`}>
        <div className={SITE.wrap}>
          <p className={SITE.label}>Security overview</p>
          <h1 className={`${SITE.serifXL} mt-6 max-w-4xl`}>How we protect your business and your customers’ data.</h1>
          <p className={`${SITE.prose} mt-6 max-w-2xl`}>
            Described plainly: what we do today, without badges or certifications we don’t hold. If you need more detail for a security review,
            ask us.
          </p>
        </div>
      </header>

      <div className={`${SITE.wrap} grid gap-14 py-16 lg:grid-cols-[220px_1fr]`}>
        <nav aria-label="Contents" className="lg:sticky lg:top-28 lg:self-start">
          <p className={SITE.label}>Contents</p>
          <ol className="mt-4 space-y-2 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.id}><a href={`#${s.id}`} className="grid grid-cols-[28px_1fr] text-[#4B4D46] hover:text-[#1D4B3E]"><span className="font-mono text-[#A3A199]">{i + 1}.</span>{s.title}</a></li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0">
          {/* At a glance */}
          <table className="w-full border-t-2 border-[#0B1712] text-left text-[15px]">
            <caption className={`${SITE.label} pb-3 text-left`}>At a glance</caption>
            <tbody>
              {[
                ['In transit', 'TLS (HTTPS)'],
                ['Credentials at rest', 'AES-256'],
                ['Passwords', 'bcrypt hashes'],
                ['People', 'Six roles, page locks, audit log'],
                ['Meta webhooks', 'Signature required'],
              ].map(([k, v]) => (
                <tr key={k} className={`border-b ${SITE.rule}`}>
                  <th scope="row" className="w-1/2 py-3 pr-4 font-normal text-[#6B6B63]">{k}</th>
                  <td className="py-3 font-medium text-[#0B1712]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className={`scroll-mt-28 border-t ${SITE.rule} mt-14 pt-10`}>
              <p className="font-mono text-sm text-[#1D4B3E]">{String(i + 1).padStart(2, '0')}</p>
              <h2 className={`${SITE.serif} mt-2 text-[1.75rem]`}>{s.title}</h2>
              <p className={`${SITE.prose} mt-4 max-w-2xl`}>{s.body}</p>
              <div className="mt-6 max-w-2xl bg-[#F3F6F4] px-5 py-4">
                <p className={SITE.label}>In practice</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] text-[#33352F]">
                  {s.practice.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </section>
          ))}

          <section className={`mt-16 border-t-2 border-[#0B1712] pt-8`}>
            <h2 className={`${SITE.serif} text-2xl`}>Related documents</h2>
            <ul className="mt-4 divide-y divide-[#E2E0D8]">
              {[
                ['Data Processing Agreement', '/dpa'],
                ['Responsible disclosure policy', '/responsible-disclosure'],
                ['Privacy Policy', '/privacy'],
                ['Compliance', '/compliance'],
              ].map(([t, href]) => (
                <li key={href}><Link href={href} className="flex justify-between py-3 text-[15px] text-[#0B1712] hover:text-[#1D4B3E]">{t}<span aria-hidden>→</span></Link></li>
              ))}
            </ul>
            <p className={`${SITE.body} mt-8`}>
              Security questions or a questionnaire to fill in? <Link href="/contact" className={SITE.link}>Send it to us</Link> and we’ll answer it
              honestly — including what we don’t do yet.
            </p>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
