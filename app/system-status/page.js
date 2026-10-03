import Link from 'next/link';
import { ExternalLink, Activity } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';
import StatusBoard from './StatusBoard';

export const metadata = {
  title: 'System Status',
  description: 'Live status of the LeadForGrow app, database and background jobs, with links to the status pages of the messaging platforms we depend on.',
  alternates: { canonical: 'https://www.leadforgrow.com/system-status' },
};

const UPSTREAM = [
  ['Meta — WhatsApp, Instagram, Messenger', 'https://metastatus.com'],
  ['Razorpay — payment links', 'https://status.razorpay.com'],
];

export default function SystemStatusPage() {
  return (
    <MarketingShell>
      <section className="pb-16 pt-32 sm:pt-36">
        <div className={`${SITE.wrap} max-w-3xl`}>
          <p className="flex items-center gap-2 text-sm font-medium text-[#6B7280]"><Activity className="h-4 w-4 text-[#1D4B3E]" /> status.leadforgrow</p>
          <h1 className="mt-2 font-[family-name:var(--font-plus-jakarta)] text-4xl font-bold tracking-[-0.02em] text-[#0B1712]">System status</h1>
          <p className={`${SITE.body} mt-3`}>
            This page checks our servers live from your browser each time you open it. It reports what the check finds right now — it does not
            show history.
          </p>

          <div className="mt-10"><StatusBoard /></div>

          <h2 className="mt-14 text-lg font-semibold text-[#0B1712]">Platforms we depend on</h2>
          <p className={`${SITE.small} mt-1`}>If messages are delayed but everything above is operational, the cause is often upstream.</p>
          <ul className="mt-4 space-y-2">
            {UPSTREAM.map(([name, href]) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-[#E4E7E1] px-5 py-4 text-[15px] text-[#0B1712] hover:border-[#1D4B3E]/40 hover:bg-[#F0F9F5]">
                  {name} <ExternalLink className="h-4 w-4 text-[#6B7280]" />
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-2xl bg-[#F5F6F2] p-6">
            <h2 className="font-semibold text-[#0B1712]">Seeing a problem that isn’t shown here?</h2>
            <p className={`${SITE.small} mt-1`}>Tell us what you see and when it started — the more detail, the faster we can fix it.</p>
            <Link href="/help-center" className={`${SITE.link} mt-3 inline-block text-sm`}>Contact support</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
