import Link from 'next/link';
import { ArrowRight, Megaphone, MessageCircle, MapPin, BellRing, Repeat, Handshake } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow for Real Estate',
  description: 'Answer property enquiries from Meta ads in minutes, book site visits with reminders and keep long-cycle buyers warm until they are ready.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/real-estate' },
};

const FUNNEL = [
  { icon: Megaphone, step: 'Enquiry', text: 'A buyer fills your Facebook or Instagram lead form. The lead appears in your CRM with the ad it came from.' },
  { icon: MessageCircle, step: 'First reply', text: 'An approved WhatsApp template goes out at once with the project brochure and a question about budget.' },
  { icon: MapPin, step: 'Site visit', text: 'The buyer picks a slot on your booking page. The visit lands on your calendar.' },
  { icon: BellRing, step: 'Reminder', text: 'WhatsApp and email reminders go out before the visit. No-shows get a rebook link.' },
  { icon: Repeat, step: 'Nurture', text: 'Not ready yet? A sequence checks in over the following weeks — and stops the moment they reply.' },
  { icon: Handshake, step: 'Booking', text: 'Move the deal to Won, send the booking-amount bill with a payment link, and hand over.' },
];

export default function RealEstatePage() {
  return (
    <MarketingShell>
      {/* Hero with image card */}
      <section className="bg-[#F5F6F2] pt-16 sm:pt-20">
        <div className={`${SITE.wrap} grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24`}>
          <div className="order-2 lg:order-1">
            <p className={SITE.eyebrow}>Real estate &amp; property</p>
            <h1 className={`${SITE.display} mt-4`}>Qualify buyers while you’re out showing flats.</h1>
            <p className={`${SITE.lead} mt-6`}>
              Property buyers enquire with three builders at once. The one who replies first and follows up properly gets the site visit.
              LeadForGrow makes sure that’s you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/products/crm" className={SITE.btnGhost}>See the CRM</Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative">
              <img src="/images/interakt-clone/industries/real-estate.webp" alt="Real estate team reviewing property leads" className="w-full rounded-2xl object-cover" />
              <div className="absolute -bottom-6 left-6 right-6 rounded-xl bg-white p-4 shadow-xl sm:left-auto sm:w-72">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">New lead · Meta ad</p>
                <p className="mt-1 font-semibold text-[#0B1712]">3 BHK enquiry — Whitefield</p>
                <p className="mt-1 text-sm text-[#1D4B3E]">Welcome template sent · Site visit not booked</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funnel — vertical steps with connecting line */}
      <section className="py-24">
        <div className={`${SITE.wrap} grid gap-14 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className={SITE.eyebrow}>From ad click to booking amount</p>
            <h2 className={`${SITE.h2} mt-3`}>One path for every buyer.</h2>
            <p className={`${SITE.body} mt-4`}>Set it up once. Each step runs on its own, and your team steps in when a buyer is ready to talk.</p>
          </div>
          <ol className="relative border-l-2 border-[#E4E7E1] pl-8">
            {FUNNEL.map(({ icon: Icon, step, text }) => (
              <li key={step} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full bg-[#1D4B3E] text-white ring-4 ring-white">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className={SITE.h3}>{step}</h3>
                <p className={`${SITE.body} mt-1.5`}>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Channel partners strip */}
      <section className="bg-[#0B1712] py-16 text-white">
        <div className={`${SITE.wrap} grid items-center gap-8 md:grid-cols-[1.4fr_1fr]`}>
          <div>
            <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold sm:text-3xl">Several sales people, several projects?</h2>
            <p className="mt-3 text-white/70">Assign leads by project or locality, give each person their own queue, and see who has buyers waiting on the Leak Radar.</p>
          </div>
          <Link href="/contact" className={`${SITE.btnLight} md:justify-self-end`}>Talk to us <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </MarketingShell>
  );
}
