import Link from 'next/link';
import { ArrowRight, BookOpen, Mail, Clock, LifeBuoy, ListChecks, Activity, CircleHelp } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { HELP_GUIDES } from '@/lib/help/guides';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Help Center & Support',
  description: 'Get help with LeadForGrow: step-by-step guides, WhatsApp and email support, support hours and what to include when you contact us.',
  alternates: { canonical: 'https://www.leadforgrow.com/help-center' },
};

const SUPPORT_WHATSAPP = 'https://wa.me/918810873052';
const POPULAR = ['getting-started', 'connect-whatsapp', 'inbox-basics', 'send-broadcast', 'sequences', 'create-bill'];

const FAQ = [
  ['My WhatsApp messages are not arriving in LeadForGrow.', 'Check the webhook in your Meta app points to the exact URL shown in Settings → WhatsApp (use the www address) and that the “messages” field is subscribed.', 'connect-whatsapp'],
  ['Why can’t I type a free-text WhatsApp reply?', 'WhatsApp only allows free text within 24 hours of the customer’s last message. Outside that window, send an approved template.', 'create-template'],
  ['How do I add my team?', 'Settings → Team. Invite by email and pick a role; you can also lock pages per role.', 'team-management'],
  ['Can I import leads from Excel?', 'Yes — Leads → Bulk upload accepts Excel and CSV. Columns such as name, phone and email are matched automatically.', 'leads'],
];

export default function HelpCenterPage() {
  const popular = POPULAR.map((slug) => HELP_GUIDES.find((g) => g.slug === slug)).filter(Boolean);
  return (
    <MarketingShell>
      {/* Support desk header */}
      <section className="bg-[#1D4B3E] pt-16 text-white sm:pt-20">
        <div className={`${SITE.wrap} grid gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-20`}>
          <div>
            <p className={SITE.eyebrowDark}><LifeBuoy className="mr-1.5 inline h-4 w-4" aria-hidden />Help Center</p>
            <h1 className="mt-4 font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              How can we help you today?
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">Most answers are in our guides. If you’re stuck, a real person from our team will help.</p>
          </div>
          <div className="grid gap-3">
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl bg-white p-5 text-[#0B1712] transition-transform hover:-translate-y-0.5">
              <WhatsAppIcon colored className="h-7 w-7" />
              <span className="flex-1"><span className="block font-semibold">Chat with support on WhatsApp</span><span className="text-sm text-[#6B7280]">Fastest during support hours</span></span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/contact" className="flex items-center gap-4 rounded-xl bg-white/10 p-5 ring-1 ring-white/20 transition-colors hover:bg-white/15">
              <Mail className="h-7 w-7 text-[#34D399]" />
              <span className="flex-1"><span className="block font-semibold">Send us a message</span><span className="text-sm text-white/70">Choose “Support” on the contact form</span></span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="flex items-center gap-2 pt-1 text-sm text-white/75"><Clock className="h-4 w-4" /> Mon–Fri, 9:00 AM – 6:00 PM IST</p>
          </div>
        </div>
      </section>

      {/* Popular guides */}
      <section className="py-16">
        <div className={SITE.wrap}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className={SITE.h2}>Most-read guides</h2>
            <Link href="/help" className={`${SITE.link} text-sm`}>All {HELP_GUIDES.length} guides →</Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((g) => (
              <Link key={g.slug} href={`/help/${g.slug}`} className="group flex gap-4 rounded-xl border border-[#E4E7E1] p-5 transition-colors hover:border-[#1D4B3E]/40 hover:bg-[#F0F9F5]">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4B3E]" aria-hidden />
                <span>
                  <span className="block font-semibold text-[#0B1712] group-hover:text-[#1D4B3E]">{g.title}</span>
                  <span className="mt-1 block text-sm text-[#6B7280]">{g.summary}</span>
                  {g.time && <span className="mt-2 block text-xs text-[#9CA3AF]">{g.time}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick answers */}
      <section className="bg-[#F5F6F2] py-16">
        <div className={`${SITE.wrap} grid gap-10 lg:grid-cols-[0.7fr_1.3fr]`}>
          <div>
            <CircleHelp className="h-7 w-7 text-[#1D4B3E]" aria-hidden />
            <h2 className={`${SITE.h2} mt-3`}>Quick answers</h2>
            <p className={`${SITE.body} mt-3`}>The questions we hear most often.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map(([q, a, slug]) => (
              <details key={q} className="group rounded-xl bg-white p-5 open:ring-1 open:ring-[#1D4B3E]/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#0B1712]">
                  {q}<span className="text-xl text-[#1D4B3E] transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className={`${SITE.body} mt-3`}>{a}</p>
                <Link href={`/help/${slug}`} className={`${SITE.link} mt-2 inline-block text-sm`}>Open the guide</Link>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Before you contact us */}
      <section className="py-16">
        <div className={`${SITE.wrap} grid gap-6 md:grid-cols-2`}>
          <div className="rounded-2xl border border-[#E4E7E1] p-8">
            <ListChecks className="h-6 w-6 text-[#1D4B3E]" aria-hidden />
            <h2 className={`${SITE.h3} mt-4`}>Help us help you faster</h2>
            <ol className={`${SITE.body} mt-4 list-decimal space-y-2 pl-5`}>
              <li>Your business name in LeadForGrow</li>
              <li>The page you were on and what you clicked</li>
              <li>The exact error message, or a screenshot</li>
              <li>For a message problem: the channel and the time it was sent</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-[#E4E7E1] p-8">
            <Activity className="h-6 w-6 text-[#1D4B3E]" aria-hidden />
            <h2 className={`${SITE.h3} mt-4`}>Is something down?</h2>
            <p className={`${SITE.body} mt-4`}>Check the live status of the app and the database before you write in.</p>
            <Link href="/system-status" className={`${SITE.btnGhost} mt-6`}>View system status</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
