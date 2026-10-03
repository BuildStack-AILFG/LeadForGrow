import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Customers',
  description: 'Businesses that run their enquiries, follow-up and customer conversations on LeadForGrow — and the industries we work with.',
  alternates: { canonical: 'https://www.leadforgrow.com/customers' },
};

/** Same names the homepage logo strip shows (app/components/landing/TrustedCompanies.jsx), minus our own operating company. */
const NAMES = ['Homies4u', 'Pistons Garage', 'PMKR', 'CXO', 'Moodli'];

const INDUSTRIES = [
  { name: 'Automotive & garages', note: 'Service bookings over WhatsApp', img: '/images/interakt-clone/industries/automotive.webp', href: '/case-studies' },
  { name: 'Real estate', note: 'Ad leads, site visits, long follow-up', img: '/images/interakt-clone/industries/real-estate.webp', href: '/solutions/real-estate' },
  { name: 'Education & coaching', note: 'Admissions and demo classes', img: '/images/interakt-clone/industries/education.webp', href: '/solutions/education' },
  { name: 'Clinics & wellness', note: 'Appointments and reminders', img: '/images/interakt-clone/industries/health-wellness.webp', href: '/solutions/healthcare' },
  { name: 'Restaurants & food', note: 'Table bookings and offers', img: '/images/interakt-clone/industries/restaurant-food.webp', href: '/solutions/restaurants' },
  { name: 'Marketing agencies', note: 'Client lead handling and reporting', img: '/images/interakt-clone/industries/marketing-agencies.webp', href: '/solutions/agencies' },
];

export default function CustomersPage() {
  return (
    <MarketingShell>
      <header className={`${SITE.top} pb-16`}>
        <div className={`${SITE.wrap} grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end`}>
          <div>
            <p className={SITE.label}>Customers</p>
            <h1 className={`${SITE.serifXL} mt-6`}>Businesses that sell in their customers’ chats.</h1>
          </div>
          <p className={SITE.prose}>
            They use LeadForGrow to answer quickly, follow up on every enquiry and see what each lead becomes.
          </p>
        </div>
      </header>

      {/* Name wall */}
      <section className={`border-y ${SITE.rule}`}>
        <div className={SITE.wrap}><ul className="grid grid-cols-1 gap-px border-x border-[#E2E0D8] bg-[#E2E0D8] sm:grid-cols-5">
          {NAMES.map((n) => (
            <li key={n} className="flex h-24 items-center justify-center bg-white px-4 text-center sm:h-36">
              <span className={`${SITE.serif} text-2xl text-[#0B1712]/80 sm:text-xl lg:text-[1.75rem]`}>{n}</span>
            </li>
          ))}
        </ul></div>
      </section>

      {/* Industry index */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className={SITE.serifH2}>Industries we work with</h2>
            <p className={SITE.small}>Six of the most common</p>
          </div>
          <ol className="mt-10 border-t-2 border-[#0B1712]">
            {INDUSTRIES.map((ind, i) => (
              <li key={ind.name} className={`border-b ${SITE.rule}`}>
                <Link href={ind.href} className="group grid grid-cols-[40px_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[56px_96px_1fr_1fr_auto] sm:gap-6">
                  <span className="font-mono text-sm text-[#6B6B63]">{String(i + 1).padStart(2, '0')}</span>
                  <img src={ind.img} alt="" loading="lazy" className="hidden h-14 w-24 object-cover sm:block" />
                  <span className="text-lg font-semibold text-[#0B1712] group-hover:text-[#1D4B3E]">{ind.name}</span>
                  <span className="hidden text-sm text-[#6B6B63] sm:block">{ind.note}</span>
                  <ArrowUpRight className="h-5 w-5 text-[#A3A199] transition-colors group-hover:text-[#1D4B3E]" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Story invite */}
      <section className={`${SITE.paper} border-t ${SITE.rule} py-20`}>
        <div className={`${SITE.narrow} text-center`}>
          <h2 className={SITE.serifH2}>Using LeadForGrow? Tell your story.</h2>
          <p className={`${SITE.prose} mt-4`}>We publish customer stories only with the customer’s written approval — in their words, with their numbers.</p>
          <Link href="/contact" className={`${SITE.btn} mt-8`}>Get in touch</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
