import Link from 'next/link';
import { ArrowRight, Globe, FileText, HelpCircle, Package, Building2, PencilLine, SlidersHorizontal, KeyRound, MessageSquareText, Bot, ToggleRight } from 'lucide-react';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';

export const metadata = {
  title: 'AI Assistant — replies grounded in your business',
  description: 'AI reply suggestions written from your own knowledge base: website, PDFs, FAQs and catalog. You choose where AI is on, and you stay in control of what is sent.',
  alternates: { canonical: 'https://www.leadforgrow.com/products/ai' },
};

const SOURCES = [
  { icon: Globe, label: 'Website pages' },
  { icon: FileText, label: 'PDF & DOCX files' },
  { icon: HelpCircle, label: 'FAQs' },
  { icon: Package, label: 'Product catalog' },
  { icon: Building2, label: 'Company info' },
  { icon: PencilLine, label: 'Your own notes' },
];

const CONTROLS = [
  { icon: ToggleRight, title: 'On per channel', text: 'Turn AI replies on for Instagram and keep Facebook on fixed text — one switch per channel in Settings → Channels.' },
  { icon: SlidersHorizontal, title: 'Tone and instructions', text: 'Set the tone, the languages and plain-English instructions such as “never quote a price, offer a call instead”.' },
  { icon: MessageSquareText, title: 'Suggest, then send', text: 'In the inbox AI drafts the reply; a person reads it, edits it and presses send.' },
  { icon: KeyRound, title: 'Bring your own key', text: 'Prefer your own OpenAI account? Add your key — it is stored encrypted and never shown back.' },
];

export default function AiProductPage() {
  return (
    <MarketingShell>
      {/* Centered hero with a chat example */}
      <section className="bg-gradient-to-b from-[#E8F3EE] to-white pb-10 pt-32 lg:pt-40">
        <div className={`${SITE.narrow} text-center`}>
          <p className={SITE.eyebrow}>AI Assistant</p>
          <h1 className={`${SITE.display} mt-4`}>Answers that sound like your best salesperson.</h1>
          <p className={`${SITE.lead} mx-auto mt-6 max-w-2xl`}>
            Give LeadForGrow your website, price list and FAQs. When a customer asks “kitne ka hai?”, the AI finds the right answer in your
            material and drafts a reply — in your tone, in seconds.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register" className={SITE.btn}>Start free trial <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl px-4">
          <div className="rounded-2xl border border-[#E4E7E1] bg-white p-5 shadow-[0_30px_80px_-40px_rgba(11,23,18,0.4)] sm:p-7">
            <div className="flex items-center gap-2 border-b border-[#E4E7E1] pb-4 text-sm text-[#6B7280]">
              <span className="h-2 w-2 rounded-full bg-[#25D366]" /> WhatsApp · Rahul
            </div>
            <div className="mt-5 space-y-4 text-[15px]">
              <p className="mr-auto max-w-[80%] rounded-2xl rounded-tl-sm bg-[#F3F4F6] px-4 py-3 text-[#0B1712]">Hi, bike service kitne ka hai? Sunday open ho?</p>
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm border border-dashed border-[#1D4B3E]/40 bg-[#F0F9F5] px-4 py-3 text-[#0B1712]">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#1D4B3E]"><Bot className="h-3.5 w-3.5" /> AI suggestion · Friendly tone</p>
                Hi Rahul! General service for two-wheelers starts at the price in our service list, and yes — we’re open Sunday 10 am to 2 pm.
                Shall I book a slot for you?
              </div>
              <p className="text-center text-xs text-[#6B7280]">Found in: “Service price list.pdf” and “Opening hours” · Edit before sending</p>
            </div>
          </div>
          <p className={`${SITE.small} mt-3 text-center`}>Illustrative example.</p>
        </div>
      </section>

      {/* How it works — three steps horizontal */}
      <section className="py-20">
        <div className={SITE.wrap}>
          <h2 className={`${SITE.h2} max-w-xl`}>How the AI knows your business.</h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            <div>
              <p className="font-[family-name:var(--font-plus-jakarta)] text-5xl font-bold text-[#1D4B3E]/20">01</p>
              <h3 className={`${SITE.h3} mt-2`}>Add your sources</h3>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {SOURCES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-[#0B1712]"><Icon className="h-4 w-4 text-[#1D4B3E]" aria-hidden /> {label}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-[family-name:var(--font-plus-jakarta)] text-5xl font-bold text-[#1D4B3E]/20">02</p>
              <h3 className={`${SITE.h3} mt-2`}>We index them</h3>
              <p className={`${SITE.body} mt-4`}>
                Each source is split into small passages. When a question arrives, the most relevant passages are found — by meaning
                when semantic search is enabled, so “kitne ka hai” can match a pricing paragraph, and by keywords otherwise.
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-plus-jakarta)] text-5xl font-bold text-[#1D4B3E]/20">03</p>
              <h3 className={`${SITE.h3} mt-2`}>Replies are grounded</h3>
              <p className={`${SITE.body} mt-4`}>
                The reply is written from the passages it found plus the last messages of the conversation — not from guesses about your
                business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Controls — split dark panel */}
      <section className="pb-20">
        <div className={SITE.wrap}>
          <div className="grid overflow-hidden rounded-2xl bg-[#0B1712] text-white lg:grid-cols-[0.8fr_1.2fr]">
            <div className="p-8 sm:p-12">
              <p className={SITE.eyebrowDark}>You stay in control</p>
              <h2 className="mt-3 font-[family-name:var(--font-plus-jakarta)] text-[1.75rem] font-bold leading-tight sm:text-[2.25rem]">AI is optional, everywhere.</h2>
              <p className="mt-4 text-white/70">It is off until you switch it on, and fixed replies keep working exactly as before.</p>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              {CONTROLS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-[#0B1712] p-7">
                  <Icon className="h-5 w-5 text-[#34D399]" aria-hidden />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grovia */}
      <section className="bg-[#F5F6F2] py-20">
        <div className={`${SITE.wrap} grid items-center gap-10 lg:grid-cols-2`}>
          <div>
            <p className={SITE.eyebrow}>Also included</p>
            <h2 className={`${SITE.h2} mt-3`}>Grovia, your business assistant.</h2>
            <p className={`${SITE.body} mt-4`}>
              Ask questions about your own workspace in plain language — “which leads went cold this week?” or “how many demos are booked
              tomorrow?” — from any page of the app.
            </p>
          </div>
          <div className="space-y-3">
            {['Which hot leads haven’t been contacted today?', 'Summarise this week’s won deals', 'What’s overdue for my team?'].map((q) => (
              <p key={q} className="rounded-full border border-[#0B1712]/10 bg-white px-5 py-3 text-[15px] text-[#0B1712]">“{q}”</p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className={`${SITE.narrow} text-center`}>
          <h2 className={SITE.h2}>Teach it your business this afternoon.</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={SITE.btn}>Start free trial</Link>
            <Link href="/help/ai-knowledge" className={SITE.btnGhost}>AI Knowledge guide</Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
