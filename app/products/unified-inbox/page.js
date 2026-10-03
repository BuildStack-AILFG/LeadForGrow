import Link from 'next/link';
import { ArrowRight, Inbox, UserRound, Users, Layers, Check, Mail, Clock3, StickyNote, PenLine } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { WhatsAppIcon, InstagramIcon, FacebookIcon, GmailIcon } from '@/app/automation/components/chat/BrandIcons';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'Unified Inbox — WhatsApp, Instagram, Messenger and email',
  description: 'One team inbox for WhatsApp, Instagram DMs and comments, Facebook Messenger and Page comments, and email — with queues, assignment and the customer’s CRM record beside every chat.',
  alternates: { canonical: 'https://www.leadforgrow.com/products/unified-inbox' },
};

const CHANNELS = [
  { Icon: WhatsAppIcon, name: 'WhatsApp', bits: ['Official WhatsApp Business API', 'Approved templates outside the 24-hour window', 'Media, buttons and lists'] },
  { Icon: InstagramIcon, name: 'Instagram', bits: ['Direct messages', 'Public comments on your posts', 'Reply to a comment from the inbox'] },
  { Icon: FacebookIcon, name: 'Facebook', bits: ['Messenger conversations', 'Page post comments', 'Private replies to comments'] },
  { Icon: GmailIcon, name: 'Email', bits: ['Gmail or any IMAP / SMTP mailbox', 'Mail sent from webmail syncs in', 'Signatures, Cc / Bcc, scheduling'] },
];

const QUEUES = [
  { icon: Inbox, name: 'Needs reply', text: 'Customers who wrote last and are still waiting — longest wait first. Newsletters and no-reply senders stay out.' },
  { icon: UserRound, name: 'Mine', text: 'Conversations assigned to you. Agents open here by default.' },
  { icon: Users, name: 'Unassigned', text: 'Nobody owns it yet. “Assign to me” or pick a teammate right on the row.' },
  { icon: Layers, name: 'All', text: 'Everything, with filters for unread, hot leads, follow-up due, pinned and archived.' },
];

const rows = [
  { Icon: WhatsAppIcon, name: 'Priya Sharma', text: 'Can I reschedule to Thursday?', wait: '12m', active: true },
  { Icon: InstagramIcon, name: '@urban.decor', text: 'Price for the oak table?', wait: '38m' },
  { Icon: GmailIcon, name: 'Arjun Mehta', text: 'Re: Quotation for 20 units', wait: '2h' },
  { Icon: FacebookIcon, name: 'Neha K.', text: 'Is delivery free in Pune?', wait: '3h' },
];

export default function UnifiedInboxPage() {
  return (
    <MarketingShell>
      {/* Hero: headline over a three-pane inbox drawing */}
      <section className="pt-32 lg:pt-36">
        <div className={`${SITE.wrap} max-w-4xl text-center`}>
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-[#E4E7E1] px-4 py-2">
            <WhatsAppIcon colored className="h-4 w-4" /><InstagramIcon colored className="h-4 w-4" /><FacebookIcon colored className="h-4 w-4" /><GmailIcon size={16} />
            <span className="text-sm font-medium text-[#0B1712]">Four channels · one inbox</span>
          </div>
          <h1 className={`${SITE.display} mt-6`}>Every customer conversation, in one place.</h1>
          <p className={`${SITE.lead} mx-auto mt-6 max-w-2xl`}>
            Stop switching between the WhatsApp app, Instagram, Messenger and Gmail. Your whole team replies from one inbox — and sees who the
            customer is while they type.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/help/inbox-basics" className={SITE.btnGhost}>Inbox guide</Link>
          </div>
        </div>

        <div className={`${SITE.wrap} mt-14`}>
          <div className="grid overflow-hidden rounded-t-2xl border border-b-0 border-[#E4E7E1] bg-white shadow-[0_-20px_60px_-40px_rgba(11,23,18,0.4)] md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_260px]" aria-label="Inbox illustration">
            <div className="border-b border-[#E4E7E1] md:border-b-0 md:border-r">
              <div className="flex gap-4 border-b border-[#E4E7E1] px-4 py-3 text-xs font-semibold">
                <span className="text-[#1D4B3E]">Needs reply 4</span><span className="text-[#9CA3AF]">Mine</span><span className="text-[#9CA3AF]">All</span>
              </div>
              {rows.map(({ Icon, name, text, wait, active }) => (
                <div key={name} className={`flex items-start gap-3 border-b border-[#F1F2EF] px-4 py-3 ${active ? 'bg-[#F0F9F5]' : ''}`}>
                  <Icon colored className="mt-0.5 h-4 w-4 shrink-0" size={16} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0B1712]">{name}</p>
                    <p className="truncate text-xs text-[#6B7280]">{text}</p>
                  </div>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{wait}</span>
                </div>
              ))}
            </div>
            <div className="hidden bg-[#F1F6F3] p-5 md:block">
              <p className="mr-auto w-fit max-w-[75%] rounded-xl bg-white px-4 py-2.5 text-sm text-[#0B1712] shadow-sm">Hi! Can I reschedule to Thursday?</p>
              <p className="ml-auto mt-3 w-fit max-w-[75%] rounded-xl bg-[#1F8A5E] px-4 py-2.5 text-sm text-white">Of course — Thursday 11 am works. Shall I confirm?</p>
              <p className="mt-4 text-center text-[11px] text-[#6B7280]">Reply window: 23h 48m left</p>
            </div>
            <div className="hidden border-l border-[#E4E7E1] p-5 lg:block">
              <p className="text-sm font-semibold text-[#0B1712]">Priya Sharma</p>
              <p className="text-xs text-[#6B7280]">Stage: Demo scheduled</p>
              <div className="mt-4 space-y-2 text-xs text-[#4B5563]">
                <p>Owner · Ankit</p><p>Follow-up · Thu 11:00</p><p>Source · Meta lead ad</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Channels — four columns with brand marks */}
      <section className="border-t border-[#E4E7E1] bg-[#F5F6F2] py-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.h2} max-w-xl`}>What each channel brings in.</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map(({ Icon, name, bits }) => (
              <div key={name} className="rounded-xl bg-white p-6">
                <Icon colored className="h-7 w-7" size={28} />
                <h3 className={`${SITE.h3} mt-4`}>{name}</h3>
                <ul className="mt-3 space-y-2">
                  {bits.map((b) => <li key={b} className="flex gap-2 text-sm text-[#4B5563]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4B3E]" />{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Queues — stacked list with big labels */}
      <section className="py-20">
        <div className={`${SITE.wrap} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className={SITE.eyebrow}>Queues, not filters</p>
            <h2 className={`${SITE.h2} mt-3`}>Know exactly who is waiting for you.</h2>
            <p className={`${SITE.body} mt-4`}>
              Each queue shows a live count. Owners and managers open on <em>Needs reply</em>; agents open on <em>Mine</em>. Press
              <strong> Done</strong> on a row and it leaves the queue — if the customer writes again, it comes back.
            </p>
          </div>
          <ol className="space-y-4">
            {QUEUES.map(({ icon: Icon, name, text }) => (
              <li key={name} className="flex gap-5 rounded-xl border border-[#E4E7E1] p-6">
                <Icon className="h-6 w-6 shrink-0 text-[#1D4B3E]" aria-hidden />
                <div><h3 className={SITE.h3}>{name}</h3><p className={`${SITE.body} mt-1`}>{text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Team features strip */}
      <section className="bg-[#0B1712] py-16 text-white">
        <div className={`${SITE.wrap} grid gap-8 sm:grid-cols-2 lg:grid-cols-4`}>
          {[
            [StickyNote, 'Internal notes', 'Write a note only your team sees, inside the thread.'],
            [Clock3, 'Waiting timers', 'A badge turns amber, then red, the longer a customer waits.'],
            [Mail, 'Real email threads', 'Emails render as the sender designed them, threaded like webmail.'],
            [PenLine, 'Signatures', 'Several signatures per mailbox — pick one as you write.'],
          ].map(([Icon, t, d]) => (
            <div key={t}>
              <Icon className="h-5 w-5 text-[#34D399]" aria-hidden />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-white/65">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className={`${SITE.wrap} flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center`}>
          <h2 className={SITE.h2}>Close the other tabs.</h2>
          <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </MarketingShell>
  );
}
