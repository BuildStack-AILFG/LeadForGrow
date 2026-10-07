import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Case Studies — how teams set up LeadForGrow',
  description: 'Worked examples of how a garage, a coaching institute and a real estate team set up LeadForGrow: the problem, the setup, and what changes day to day.',
  alternates: { canonical: 'https://www.leadforgrow.com/case-studies' },
};

const CASES = [
  {
    kind: 'Automotive service centre',
    img: '/images/site/industries/automotive.svg',
    title: 'A garage that books services straight from WhatsApp',
    problem: 'Customers message to ask for a service slot. During a busy day nobody replies for hours, and the same questions — price, pick-up, timings — come in again and again.',
    setup: [
      'An approved welcome template asks “Two-wheeler or four-wheeler?” with tap-to-answer buttons',
      'A WhatsApp Flow collects the vehicle, service and preferred day',
      'Each booking becomes a lead assigned to the service advisor',
      'A reminder goes out before the slot; a feedback request after',
    ],
    change: 'Bookings come in already sorted by vehicle type, and the advisor starts the day with a list instead of a pile of unread chats.',
  },
  {
    kind: 'Coaching institute',
    img: '/images/site/industries/education.svg',
    title: 'An institute that runs admissions season without a spreadsheet',
    problem: 'Enquiries from ads, the website and walk-ins land in different places. Counsellors call the same parent twice, or not at all.',
    setup: [
      'Website form and Meta lead ads feed one pipeline',
      'New enquiries are shared among counsellors with a call task',
      'Parents book a demo class from a booking page, with reminders',
      'The fee bill goes out with a Razorpay payment link',
    ],
    change: 'Every enquiry has one owner and one next step, and the head of admissions sees who is waiting on the Leak Radar.',
  },
  {
    kind: 'Real estate team',
    img: '/images/site/industries/real-estate.svg',
    title: 'A property team that answers ad leads while showing sites',
    problem: 'Ad leads arrive while the team is on site visits. By the time someone calls back, the buyer has spoken to another builder.',
    setup: [
      'Meta lead ads create leads instantly with the campaign name',
      'An approved template sends the brochure and asks the budget within seconds',
      'Buyers pick a site-visit slot themselves',
      'A sequence checks in over the next weeks and stops when they reply',
    ],
    change: 'The first reply is instant, and nobody has to remember which buyer to call back on which day.',
  },
];

export default function CaseStudiesPage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} pb-14`}>
        <div className={SITE.wrap}>
          <p className={SITE.label}>Case studies</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <h1 className={SITE.serifXL}>How teams set up LeadForGrow.</h1>
            <div>
              <p className={SITE.prose}>Three worked examples: the problem, exactly what gets switched on, and what the working day looks like afterwards.</p>
              <p className="mt-4 flex gap-2 border-l-2 border-[#1D4B3E] pl-3 text-sm text-[#4B4D46]">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4B3E]" aria-hidden />
                Illustrative set-ups built from real product features — not testimonials, and not a named customer’s results.
              </p>
            </div>
          </div>
          <ol className={`mt-14 grid border-t ${SITE.rule} sm:grid-cols-3`}>
            {CASES.map((c, i) => (
              <li key={c.title} className={`border-b ${SITE.rule} py-4 sm:border-b-0 sm:pr-6`}>
                <a href={`#case-${i + 1}`} className="group block">
                  <span className="font-mono text-xs text-[#6B6B63]">Chapter {i + 1}</span>
                  <span className="mt-1 block font-semibold text-[#0B1712] group-hover:text-[#1D4B3E]">{c.kind}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </header>

      {CASES.map((c, i) => (
        <article key={c.title} id={`case-${i + 1}`} className={`scroll-mt-24 border-t ${SITE.rule} py-20 ${i % 2 ? SITE.paper : ''}`}>
          <div className={SITE.wrap}>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="font-mono text-sm text-[#1D4B3E]">Chapter {i + 1} — {c.kind}</p>
                <h2 className={`${SITE.serifH2} mt-4`}>{c.title}</h2>
              </div>
              <img src={c.img} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
            </div>
            <div className={`mt-12 grid gap-10 border-t-2 border-[#0B1712] pt-8 md:grid-cols-3`}>
              <section>
                <h3 className={SITE.label}>The problem</h3>
                <p className={`${SITE.body} mt-3`}>{c.problem}</p>
              </section>
              <section>
                <h3 className={SITE.label}>The setup</h3>
                <ol className="mt-3 space-y-3">
                  {c.setup.map((s, n) => (
                    <li key={s} className="grid grid-cols-[24px_1fr] text-[15px] leading-relaxed text-[#0B1712]">
                      <span className="font-mono text-xs leading-[1.9] text-[#6B6B63]">{n + 1}.</span>{s}
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h3 className={SITE.label}>What changes</h3>
                <p className={`${SITE.serif} mt-3 text-xl leading-relaxed`}>{c.change}</p>
              </section>
            </div>
          </div>
        </article>
      ))}

      <section className={`border-t ${SITE.rule} py-20`}>
        <div className={`${SITE.wrap} flex flex-col gap-8 md:flex-row md:items-end md:justify-between`}>
          <div>
            <h2 className={SITE.serifH2}>Want this set up for your business?</h2>
            <p className={`${SITE.body} mt-3`}>Tell us how you get enquiries today and we’ll suggest the setup.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className={SITE.btn}>Talk to us <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/customers" className={SITE.btnGhost}>Our customers</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
