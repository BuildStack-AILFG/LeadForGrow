import Link from 'next/link';
import { ArrowRight, Timer, CalendarClock, Megaphone, CalendarCheck2, IndianRupee, Bot } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { getGuide } from '@/lib/help/guides';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Playbooks & Guides',
  description: 'Goal-based playbooks for LeadForGrow: reply faster, never miss a follow-up, run a campaign, book more meetings, get paid sooner and let AI answer FAQs.',
  alternates: { canonical: 'https://www.leadforgrow.com/guides' },
};

const PLAYBOOKS = [
  {
    icon: Timer, color: '#1D4B3E',
    goal: 'Reply to every enquiry within minutes',
    why: 'The business that answers first usually gets the customer. Put every channel in one inbox, send an instant welcome, and alert the team.',
    guides: ['connect-whatsapp', 'inbox-basics', 'automation-rules'],
  },
  {
    icon: CalendarClock, color: '#B45309',
    goal: 'Never miss a follow-up',
    why: 'Most deals are lost to silence, not to “no”. Give every lead an owner, a next task and a sequence that nudges them if they go quiet.',
    guides: ['leads', 'tasks', 'sequences'],
  },
  {
    icon: Megaphone, color: '#7C3AED',
    goal: 'Run a festival or launch campaign',
    why: 'Get a template approved by Meta, pick the audience, send — and see who replied, all in one place.',
    guides: ['create-template', 'send-broadcast'],
  },
  {
    icon: CalendarCheck2, color: '#1D4ED8',
    goal: 'Book more meetings and demos',
    why: 'Let people pick a slot themselves from a form, the website chat or WhatsApp, with reminders so they actually turn up.',
    guides: ['forms', 'chatbot', 'meetings'],
  },
  {
    icon: IndianRupee, color: '#0F766E',
    goal: 'Get paid sooner',
    why: 'Send a GST bill with your logo and a payment link the moment a deal closes. It is marked paid when the customer pays.',
    guides: ['bill-header-setup', 'create-bill', 'payment-link'],
  },
  {
    icon: Bot, color: '#BE185D',
    goal: 'Let AI answer the repeat questions',
    why: 'Prices, timings, locations — feed them in once and get AI reply suggestions grounded in your own material.',
    guides: ['ai-knowledge', 'ai-settings'],
  },
];

export default function GuidesPage() {
  return (
    <MarketingShell>
      <section className="pb-20 pt-32 sm:pt-36">
        <div className={`${SITE.wrap} grid gap-8 lg:grid-cols-2 lg:items-end`}>
          <div>
            <p className={SITE.eyebrow}>Playbooks</p>
            <h1 className={`${SITE.display} mt-4`}>Start with the result you want.</h1>
          </div>
          <p className={SITE.lead}>
            Each playbook strings together the guides you need, in the order to follow them. Pick a goal and you’ll have it running before the
            end of the day.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className={`${SITE.wrap} space-y-5`}>
          {PLAYBOOKS.map(({ icon: Icon, color, goal, why, guides }) => (
            <article key={goal} className="grid gap-6 rounded-2xl border border-[#E4E7E1] p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
              <div className="flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}14`, color }}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <h2 className="font-[family-name:var(--font-plus-jakarta)] text-xl font-bold text-[#0B1712] sm:text-2xl">{goal}</h2>
                  <p className={`${SITE.body} mt-2`}>{why}</p>
                </div>
              </div>
              <ol className="space-y-2">
                {guides.map((slug, i) => {
                  const g = getGuide(slug);
                  if (!g) return null;
                  return (
                    <li key={slug}>
                      <Link href={`/help/${slug}`} className="group flex items-center gap-4 rounded-xl bg-[#F5F6F2] px-4 py-3 transition-colors hover:bg-[#E8F3EE]">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0B1712]">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-[#0B1712]">{g.title}</span>
                          {g.time && <span className="text-xs text-[#6B7280]">{g.time}</span>}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[#1D4B3E] transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
