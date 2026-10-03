import Link from 'next/link';
import { ArrowRight, UtensilsCrossed, CalendarClock, Star, PartyPopper, Megaphone } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow for Restaurants & Cafés',
  description: 'Take table bookings and catering enquiries on WhatsApp, confirm them automatically and bring guests back with offers they opted in to.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/restaurants' },
};

const CHAT = [
  { from: 'guest', text: 'Hi, table for 4 tonight?' },
  { from: 'bot', text: 'Hello! Which time works for you?', buttons: ['7:00 pm', '8:00 pm', '9:00 pm'] },
  { from: 'guest', text: '8:00 pm' },
  { from: 'bot', text: 'Done ✅ Table for 4 at 8:00 pm tonight. See you soon!' },
];

const MOMENTS = [
  { icon: CalendarClock, title: 'Bookings on WhatsApp', text: 'A booking flow asks for date, time and party size with tap-to-answer buttons, then confirms.' },
  { icon: PartyPopper, title: 'Catering & party enquiries', text: 'Bigger orders become leads with an owner, a quote and a follow-up reminder.' },
  { icon: Star, title: 'Feedback after the visit', text: 'Send a review request the next day — a tap on the stars opens your review page.' },
  { icon: Megaphone, title: 'Festival offers', text: 'Broadcast a Diwali or New Year offer to guests who opted in. STOP replies are honoured automatically.' },
];

export default function RestaurantsPage() {
  return (
    <MarketingShell>
      {/* Photo-led hero */}
      <section className="relative overflow-hidden pt-16 sm:pt-20">
        <img src="/images/interakt-clone/industries/restaurant-food.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1712]/95 via-[#0B1712]/80 to-[#0B1712]/30" aria-hidden />
        <div className={`${SITE.wrap} relative grid items-center gap-12 py-20 text-white lg:grid-cols-[1.1fr_0.9fr] lg:py-28`}>
          <div>
            <p className={SITE.eyebrowDark}><UtensilsCrossed className="mr-1.5 inline h-4 w-4" aria-hidden />Restaurants &amp; cafés</p>
            <h1 className="mt-4 font-[family-name:var(--font-plus-jakarta)] text-[2.25rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-[3.5rem]">
              Your guests already book on WhatsApp. Answer them instantly.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              During service nobody can reply to messages. LeadForGrow takes the booking, confirms it and adds the guest to your list — while
              your team looks after the people at the tables.
            </p>
            <Link href="/register" className={`${SITE.btnLight} mt-8`}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
          </div>

          {/* WhatsApp-style phone */}
          <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border-[6px] border-black bg-[#EFEAE2] shadow-2xl">
            <div className="flex items-center gap-2 rounded-t-[1.6rem] bg-[#1D4B3E] px-4 py-3 text-sm font-semibold text-white">
              <WhatsAppIcon className="h-4 w-4" /> The Spice Room
            </div>
            <div className="space-y-2.5 p-4 text-[13px]">
              {CHAT.map((m, i) => (
                <div key={i} className={m.from === 'guest' ? 'ml-auto w-fit max-w-[80%] rounded-lg bg-[#D9FDD3] px-3 py-2 text-[#0B1712]' : 'w-fit max-w-[85%] rounded-lg bg-white px-3 py-2 text-[#0B1712]'}>
                  {m.text}
                  {m.buttons && (
                    <div className="mt-2 grid gap-1.5">
                      {m.buttons.map((b) => <span key={b} className="rounded-md border border-[#E4E7E1] py-1 text-center font-medium text-[#027EB5]">{b}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="pb-3 text-center text-[10px] text-[#6B7280]">Example conversation</p>
          </div>
        </div>
      </section>

      {/* Moments — alternating list */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.h2} max-w-2xl`}>Four moments where restaurants lose guests — handled.</h2>
          <div className="mt-12 divide-y divide-[#E4E7E1] border-y border-[#E4E7E1]">
            {MOMENTS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="grid items-center gap-4 py-8 md:grid-cols-[80px_280px_1fr]">
                <span className="font-[family-name:var(--font-plus-jakarta)] text-3xl font-bold text-[#1D4B3E]/25">0{i + 1}</span>
                <h3 className="flex items-center gap-3 text-lg font-semibold text-[#0B1712]"><Icon className="h-5 w-5 text-[#1D4B3E]" aria-hidden />{title}</h3>
                <p className={SITE.body}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className={SITE.wrap}>
          <div className="rounded-2xl bg-[#F5F6F2] p-8 text-center sm:p-14">
            <h2 className={SITE.h2}>Set up your booking flow this week.</h2>
            <p className={`${SITE.body} mx-auto mt-3 max-w-xl`}>Start from a flow template, change the times and the welcome text, and publish.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className={SITE.btn}>Start free trial</Link>
              <Link href="/help/whatsapp-flows" className={SITE.btnGhost}>WhatsApp Flows guide</Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
