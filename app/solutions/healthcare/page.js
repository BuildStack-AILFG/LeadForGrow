import Link from 'next/link';
import { ArrowRight, CalendarCheck2, BellRing, UserRoundX, HeartHandshake, Info, Lock } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow for Clinics & Healthcare',
  description: 'Appointment enquiries, booking pages, WhatsApp reminders and follow-up for clinics, dental practices, physiotherapy and wellness centres.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/healthcare' },
};

const DAY = [
  { time: '9:12 am', icon: CalendarCheck2, text: 'A new patient asks about a dental cleaning on Instagram. The enquiry goes to the front-desk queue.' },
  { time: '9:20 am', icon: CalendarCheck2, text: 'They pick Saturday 11:00 on your booking page. A confirmation goes out on WhatsApp.' },
  { time: 'Friday', icon: BellRing, text: 'Reminders are sent the day before and an hour before the appointment.' },
  { time: 'Saturday', icon: UserRoundX, text: 'If the patient doesn’t arrive, mark No-show and a rebooking link is sent.' },
  { time: 'Next week', icon: HeartHandshake, text: 'A follow-up message checks how they are doing and offers the next visit.' },
];

export default function HealthcarePage() {
  return (
    <MarketingShell>
      {/* Calm centred hero */}
      <section className="bg-[#F3F7F6] pb-20 pt-32 lg:pb-28 lg:pt-40">
        <div className={`${SITE.narrow} text-center`}>
          <p className={SITE.eyebrow}>Clinics &amp; healthcare</p>
          <h1 className={`${SITE.display} mt-4`}>Fewer missed calls. Fewer empty appointment slots.</h1>
          <p className={`${SITE.lead} mx-auto mt-6 max-w-2xl`}>
            Patients message when the front desk is busy. LeadForGrow answers appointment enquiries, books them into your calendar and
            sends reminders — so your team can focus on the patients in front of them.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/help/meetings" className={SITE.btnGhost}>How booking pages work</Link>
          </div>
        </div>
      </section>

      {/* A day in the clinic — schedule layout */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.h2} max-w-2xl`}>One patient, from first message to follow-up.</h2>
          <div className="mt-12 overflow-hidden rounded-2xl border border-[#E4E7E1]">
            {DAY.map(({ time, icon: Icon, text }, i) => (
              <div key={time} className={`grid items-center gap-4 p-6 sm:grid-cols-[140px_40px_1fr] ${i % 2 ? 'bg-[#FAFBFA]' : 'bg-white'} ${i ? 'border-t border-[#E4E7E1]' : ''}`}>
                <p className="font-mono text-sm font-semibold text-[#1D4B3E]">{time}</p>
                <Icon className="h-5 w-5 text-[#1D4B3E]" aria-hidden />
                <p className="text-[15px] text-[#0B1712]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest data box */}
      <section className="pb-20">
        <div className={`${SITE.wrap} grid gap-6 lg:grid-cols-2`}>
          <div className="rounded-2xl border border-[#E4E7E1] p-8">
            <Lock className="h-6 w-6 text-[#1D4B3E]" aria-hidden />
            <h2 className={`${SITE.h3} mt-4`}>How patient details are handled</h2>
            <ul className={`${SITE.body} mt-4 list-disc space-y-2 pl-5`}>
              <li>Each clinic’s data is kept in its own workspace; your team sees it according to the roles you set.</li>
              <li>Connection credentials for WhatsApp, Instagram and email are stored encrypted.</li>
              <li>A Data Processing Agreement is available for your records.</li>
            </ul>
            <Link href="/security" className={`${SITE.link} mt-5 inline-block text-sm`}>Read about security</Link>
          </div>
          <div className="rounded-2xl bg-amber-50 p-8 ring-1 ring-amber-200">
            <Info className="h-6 w-6 text-amber-700" aria-hidden />
            <h2 className={`${SITE.h3} mt-4`}>What LeadForGrow is not</h2>
            <p className={`${SITE.body} mt-4`}>
              LeadForGrow is for enquiries, appointments and patient communication. It is not an electronic medical record system and is not
              certified for clinical records. Keep diagnoses, prescriptions and reports in your clinical software, and avoid sending them over
              chat.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E4E7E1] py-16">
        <div className={`${SITE.wrap} flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center`}>
          <h2 className={SITE.h2}>Fill tomorrow’s empty slots.</h2>
          <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </MarketingShell>
  );
}
