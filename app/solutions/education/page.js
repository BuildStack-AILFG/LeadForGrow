import Link from 'next/link';
import { ArrowRight, GraduationCap, FileText, PhoneCall, Presentation, BadgeIndianRupee, Megaphone } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'LeadForGrow for Education & Coaching',
  description: 'Manage admission enquiries for schools, colleges, coaching institutes and online courses: counsellor assignment, demo-class reminders and fee collection.',
  alternates: { canonical: 'https://www.leadforgrow.com/solutions/education' },
};

const BOARD = [
  { col: 'Enquiry', cards: ['Aarav · JEE 2027', 'Meera · Class 11 Science'] },
  { col: 'Counselling', cards: ['Kabir · NEET crash course'] },
  { col: 'Demo class', cards: ['Sana · Spoken English', 'Ishaan · Coding for kids'] },
  { col: 'Fee pending', cards: ['Riya · Foundation batch'] },
  { col: 'Enrolled', cards: ['Dev · JEE 2027'] },
];

const STEPS = [
  { icon: FileText, title: 'Enquiry form', text: 'Your website form or a Meta lead ad creates the student lead — with course and city.' },
  { icon: PhoneCall, title: 'Counsellor assigned', text: 'Leads are shared among counsellors, each with a call task and a WhatsApp intro.' },
  { icon: Presentation, title: 'Demo class booked', text: 'Parents pick a demo slot; reminders go out on WhatsApp and email.' },
  { icon: BadgeIndianRupee, title: 'Fee collected', text: 'Send the fee bill with a Razorpay link. When it’s paid, the bill is marked paid on its own.' },
];

export default function EducationPage() {
  return (
    <MarketingShell>
      <section className="pt-32 lg:pt-36">
        <div className={`${SITE.wrap} grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end`}>
          <div>
            <p className={SITE.eyebrow}><GraduationCap className="mr-1.5 inline h-4 w-4" aria-hidden />Education &amp; coaching</p>
            <h1 className={`${SITE.display} mt-4`}>Turn admission enquiries into enrolled students.</h1>
          </div>
          <p className={SITE.lead}>
            Admission season brings hundreds of enquiries in a few weeks. Give every parent a fast answer, a counsellor and a demo class — without
            a spreadsheet.
          </p>
        </div>

        {/* Admissions board */}
        <div className={`${SITE.wrap} mt-14`}>
          <div className="overflow-x-auto rounded-2xl bg-[#F5F6F2] p-4 sm:p-6" aria-label="Admissions pipeline illustration">
            <div className="grid min-w-[760px] grid-cols-5 gap-3">
              {BOARD.map((c) => (
                <div key={c.col}>
                  <p className="mb-3 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-[#4B5563]">{c.col}<span className="text-[#9CA3AF]">{c.cards.length}</span></p>
                  <div className="space-y-2">
                    {c.cards.map((card) => (
                      <div key={card} className="rounded-lg border border-[#E4E7E1] bg-white px-3 py-3 text-sm font-medium text-[#0B1712] shadow-sm">{card}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className={`${SITE.small} mt-2`}>Illustration — example stages and names. Stages are yours to rename.</p>
        </div>
      </section>

      <section className="py-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.h2} max-w-xl`}>The admissions journey, automated.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="relative rounded-2xl border border-[#E4E7E1] p-6">
                <span className="absolute right-5 top-5 text-sm font-semibold text-[#9CA3AF]">{i + 1}/4</span>
                <Icon className="h-6 w-6 text-[#1D4B3E]" aria-hidden />
                <h3 className={`${SITE.h3} mt-4`}>{title}</h3>
                <p className={`${SITE.small} mt-2`}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1D4B3E] py-16 text-white">
        <div className={`${SITE.wrap} grid items-center gap-8 md:grid-cols-[auto_1fr_auto]`}>
          <Megaphone className="h-10 w-10 text-[#34D399]" aria-hidden />
          <div>
            <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold">New batch starting?</h2>
            <p className="mt-1 text-white/75">Send a WhatsApp or email broadcast to past enquiries who opted in — and see who replied.</p>
          </div>
          <Link href="/register" className={SITE.btnLight}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </MarketingShell>
  );
}
