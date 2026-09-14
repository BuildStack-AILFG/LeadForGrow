'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Mail, Sparkles, CheckCircle2 } from 'lucide-react';

function WhatsAppLogo({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M16.1 6.5c-5.2 0-9.4 4.2-9.4 9.4 0 1.7.4 3.3 1.2 4.7L6.5 25.5l5.1-1.3c1.3.7 2.8 1.1 4.3 1.1 5.2 0 9.4-4.2 9.4-9.4s-4.2-9.4-9.4-9.4zm5.4 13.3c-.2.6-1.2 1.1-1.7 1.2-.4.1-.9.2-3.9-.8-3.3-1.1-5.4-4.5-5.6-4.7-.2-.2-1.3-1.8-1.3-3.4 0-1.6.8-2.4 1.1-2.7.3-.3.7-.4 1-.4h.7c.2 0 .5-.1.8.6.3.7 1 2.5 1.1 2.7.1.2.1.4 0 .6-.1.2-.2.3-.3.5-.1.1-.2.3-.3.4-.1.1-.2.2-.1.4.1.2.5.9 1.2 1.5.8.7 1.5 1 1.7 1.1.2.1.4.1.5-.1.1-.2.7-.8.9-1.1.2-.3.4-.2.7-.1.3.1 1.8.8 2.1 1 .3.1.5.2.6.3.1.2.1 1-.1 1.6z"
      />
    </svg>
  );
}

const WORKFLOW_STEPS = [
  'Automation Triggered',
  'Lead Captured',
  'Auto-Reply Sent',
  'Intent Detected',
  'Pipeline Updated',
  'Follow-up Automated',
  'Lead Converted',
];

const FLOW_STEPS = [
  { step: 1, text: 'Listening…' },
  { step: 2, text: 'Message came in' },
  { step: 3, text: 'AI is replying…' },
  { step: 4, text: 'Auto-replied' },
  { step: 5, text: 'Customer replied' },
  { step: 6, text: 'AI is replying…' },
  { step: 7, text: 'Replied again' },
];

const INCOMING = {
  email: { sender: 'Sarah Chen', subject: 'Quick question about LeadForGrow', time: '10:24' },
  whatsapp: 'Hi 👋 Can your CRM automatically reply to customers?',
  instagram: 'Hey! I love your product. Does it automate Instagram replies?',
};

const AI_REPLY_1 = {
  email: 'Re: How LeadForGrow automates conversations',
  whatsapp: 'Absolutely! 😊 LeadForGrow replies, qualifies leads, and schedules meetings.',
  instagram: 'Yes! LeadForGrow handles Instagram DMs along with WhatsApp and Email.',
};

const USER_REPLY = {
  email: { sender: 'Sarah Chen', subject: 'Please send the quotation', time: '10:31' },
  whatsapp: 'Can you send the meeting link?',
  instagram: 'Will you be available for me 24×7?',
};

const AI_REPLY_2 = {
  email: 'Re: Quotation attached — please review',
  whatsapp: 'Here’s your meeting link 🔗 ',
  instagram: 'Yes! We’re available 24×7 — auto-replies never stop.',
};

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function TypingDots({ light = false }) {
  return (
    <span className={`inline-flex items-center gap-1 ${light ? 'text-white/70' : 'text-[#64748B]'}`} aria-hidden>
      <span className="typing-dot" />
      <span className="typing-dot typing-dot-delay-1" />
      <span className="typing-dot typing-dot-delay-2" />
    </span>
  );
}

function PhoneMockup({ theme, headerLabel, children }) {
  const headers = {
    email: 'bg-[#F6F8FA] text-[#111827] border-b border-[#E5E7EB]',
    whatsapp: 'bg-[#075E54] text-white',
    instagram: 'bg-black text-white border-b border-white/10',
  };

  const screens = {
    email: 'bg-white',
    whatsapp: 'bg-[#ECE5DD]',
    instagram: 'bg-black',
  };

  return (
    <div className="mx-auto h-[336px] w-[168px] shrink-0">
      <div className="flex h-full flex-col rounded-[1.75rem] border-[3px] border-[#0a0a0a] bg-[#0a0a0a] p-[3px] shadow-[0_20px_50px_rgba(15,23,42,0.22)]">
        <div className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-black">
          <div className="flex h-5 shrink-0 items-end justify-center bg-black pb-0.5">
            <div className="h-1.5 w-14 rounded-full bg-[#2a2a2a]" />
          </div>
          <div className={`flex h-7 shrink-0 items-center gap-1.5 px-2.5 text-[9px] font-semibold ${headers[theme]}`}>
            {theme === 'whatsapp' && <WhatsAppLogo className="h-3.5 w-3.5 shrink-0" />}
            {theme === 'email' && <Mail className="h-3 w-3 shrink-0 text-blue-600" />}
            {theme === 'instagram' && <InstagramIcon className="h-3 w-3 shrink-0" />}
            <span className="truncate">{headerLabel}</span>
          </div>
          <div
            data-phone-scroll
            tabIndex={0}
            className={`phone-scroll flex min-h-0 flex-1 flex-col overscroll-contain ${theme === 'email' ? 'gap-0 p-1.5' : 'gap-1.5 p-2'} ${screens[theme]}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelColumn({ channel, accent, icon: Icon, title, subtitle, iconClass, iconSize = 'h-[18px] w-[18px]', iconStrokeWidth, compact = false, children }) {
  const accentBars = {
    email: 'bg-[#2563EB]',
    whatsapp: 'bg-[#059669]',
    instagram: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]',
  };

  return (
    <div
      data-channel={channel}
      className={`relative flex w-full flex-col border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] sm:p-5 ${
        compact ? 'min-h-[340px]' : 'min-h-[480px] sm:min-h-[500px]'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] ${accentBars[accent]}`} />
      <div className="mb-4 flex items-center gap-3 pt-1">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className={iconSize} strokeWidth={iconStrokeWidth} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#111827]">{title}</p>
          <p className="truncate text-[11px] text-[#64748B]">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}

function InboxRow({ sender, subject, time, unread, highlight, className = '' }) {
  return (
    <div
      className={`flex items-start gap-1 border-b border-[#E8ECEF] px-0.5 py-1 ${highlight ? 'bg-[#EFF6FF]' : ''} ${className}`}
    >
      {unread ? (
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
      ) : (
        <span className="mt-1 h-1.5 w-1.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[9px] ${unread ? 'font-semibold text-[#111827]' : 'font-medium text-[#64748B]'}`}>
          {sender}
        </p>
        <p className={`truncate text-[9px] ${unread ? 'font-medium text-[#374151]' : 'text-[#64748B]'}`}>
          {subject}
        </p>
      </div>
      <span className="shrink-0 text-[8px] text-[#94A3B8]">{time}</span>
    </div>
  );
}

// LeadForGrow's own graphic — neither Interakt nor ManyChat market Email as a channel,
// so there's no real screenshot to source for this column. Matches the visual language
// (white card, colored accent, AI-analysing step) of the real WhatsApp/Instagram assets
// next to it so the row reads as one consistent set, not a mismatched filler.
function EmailAutomationGraphic() {
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-3">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94A3B8]">
          <Mail className="h-3.5 w-3.5 text-blue-500" /> Customer Email · Received
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-[#111827]">
          &ldquo;Hi, do you offer a refund if the product doesn&rsquo;t fit?&rdquo;
        </p>
      </div>

      <div className="ml-4 flex items-center gap-1.5 rounded-xl bg-[#EFF6FF] px-3 py-2 text-[11px] font-semibold text-blue-700">
        <Sparkles className="h-3.5 w-3.5" /> AI drafting reply…
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Auto-Reply Sent
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-[#111827]">
          &ldquo;Yes! Free returns within 30 days — here&rsquo;s your prepaid label 📎&rdquo;
        </p>
      </div>
    </div>
  );
}

function EmptyPhoneState({ theme }) {
  const labels = { email: 'Inbox empty', whatsapp: 'No messages yet', instagram: 'No DMs yet' };
  return (
    <div data-empty-state className="flex flex-1 flex-col items-center justify-center py-8 opacity-40">
      <p className={`text-[9px] font-medium ${theme === 'instagram' ? 'text-white/50' : 'text-[#94A3B8]'}`}>
        {labels[theme]}
      </p>
    </div>
  );
}

// The live scroll-jacked phone-mockup demo below is kept in place but not rendered —
// flip this back to true to restore it. Swapped for a static omnichannel screenshot per
// explicit request (2026-09-13).
const SHOW_LIVE_ANIMATION = false;

export default function AutomationInActionSection() {
  const wrapperRef = useRef(null);
  const pinRef = useRef(null);
  const stageRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    if (!SHOW_LIVE_ANIMATION) return;
    const stage = stageRef.current;
    if (!stage) return;

    const scrollers = stage.querySelectorAll('[data-phone-scroll]');
    const cleanups = [];

    scrollers.forEach((el) => {
      const activate = () => el.classList.add('phone-scroll-active');
      const deactivate = () => el.classList.remove('phone-scroll-active');

      el.addEventListener('mouseenter', activate);
      el.addEventListener('mouseleave', deactivate);
      el.addEventListener('focusin', activate);
      el.addEventListener('focusout', deactivate);
      el.addEventListener('touchstart', activate, { passive: true });
      el.addEventListener('touchend', deactivate, { passive: true });

      cleanups.push(() => {
        el.removeEventListener('mouseenter', activate);
        el.removeEventListener('mouseleave', deactivate);
        el.removeEventListener('focusin', activate);
        el.removeEventListener('focusout', deactivate);
        el.removeEventListener('touchstart', activate);
        el.removeEventListener('touchend', deactivate);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  useLayoutEffect(() => {
    if (!SHOW_LIVE_ANIMATION) return;
    let cancelled = false;

    async function init() {
      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const wrapper = wrapperRef.current;
      const pin = pinRef.current;
      const stage = stageRef.current;
      if (!wrapper || !pin || !stage) return;

      const mobile = window.matchMedia('(max-width: 767px)').matches;
      const scrollLen = mobile ? 3200 : 2800;

      ctxRef.current = gsap.context(() => {
        const q = gsap.utils.selector(stage);

        const emptyStates = q('[data-empty-state]');
        const incoming = q('[data-incoming]');
        const aiTyping1 = q('[data-ai-typing-1]');
        const aiReply1 = q('[data-ai-reply-1]');
        const userReply = q('[data-user-reply]');
        const aiTyping2 = q('[data-ai-typing-2]');
        const aiReply2 = q('[data-ai-reply-2]');
        const doneTags = q('[data-done-tag]');
        const phoneScrolls = q('[data-phone-scroll]');
        const statusLines = q('[data-status-line]');
        const finalStatus = q('[data-final-status]');
        const workflow = q('[data-workflow]');

        const fadeUp = { opacity: 0, y: 12 };
        gsap.set(emptyStates, { opacity: 0.4 });
        gsap.set(incoming, fadeUp);
        gsap.set(aiTyping1, { opacity: 0, scale: 0.92 });
        gsap.set(aiReply1, fadeUp);
        gsap.set(userReply, fadeUp);
        gsap.set(aiTyping2, { opacity: 0, scale: 0.92 });
        gsap.set(aiReply2, fadeUp);
        gsap.set(doneTags, { opacity: 0, y: 6 });
        gsap.set(workflow, { opacity: 0, y: 8, scale: 0.92 });
        gsap.set(finalStatus, { opacity: 0, scale: 0.96 });
        gsap.set(statusLines, { opacity: 0, y: 6 });
        gsap.set(statusLines[0], { opacity: 1, y: 0 });

        const AUTO_SCROLL_FROM = 0.5;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            start: 'top top',
            end: `+=${scrollLen}`,
            pin: pin,
            scrub: 1,
            anticipatePin: 1,
            pinReparent: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              phoneScrolls.forEach((el) => {
                if (self.progress >= AUTO_SCROLL_FROM) {
                  el.classList.add('phone-scroll-auto');
                } else {
                  el.classList.remove('phone-scroll-auto');
                }
              });
            },
          },
        });

        function scrollPhones(position, delay = 0) {
          if (position < AUTO_SCROLL_FROM) return;

          phoneScrolls.forEach((el, i) => {
            tl.to(
              el,
              { scrollTop: () => el.scrollHeight, duration: 0.07, ease: 'power2.out' },
              position + i * 0.008 + delay
            );
          });
        }

        function showStatus(index, position, hidePrev = true) {
          if (hidePrev && index > 0) {
            tl.to(statusLines[index - 1], { opacity: 0, y: -4, duration: 0.03 }, position);
          }
          tl.to(statusLines[index], { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' }, position + 0.01);
        }

        // Phase 1 — messages arrive
        showStatus(1, 0.14);
        tl.to(emptyStates, { opacity: 0, duration: 0.04 }, 0.14);
        incoming.forEach((el, i) => {
          tl.to(el, { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, 0.16 + i * 0.015);
        });

        // Phase 2 — first AI reply
        showStatus(2, 0.32);
        aiTyping1.forEach((el, i) => {
          tl.to(el, { opacity: 1, scale: 1, duration: 0.04, ease: 'back.out(1.5)' }, 0.34 + i * 0.012);
        });
        tl.to(aiTyping1, { opacity: 0, scale: 0.9, duration: 0.03 }, 0.44);
        aiReply1.forEach((el, i) => {
          tl.to(el, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.46 + i * 0.015);
        });
        showStatus(3, 0.47);

        // Phase 3 — customer replies again on all 3
        showStatus(4, 0.56);
        userReply.forEach((el, i) => {
          tl.to(el, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.58 + i * 0.015);
        });
        scrollPhones(0.61);

        // Phase 4 — second AI reply on all 3
        showStatus(5, 0.68);
        aiTyping2.forEach((el, i) => {
          tl.to(el, { opacity: 1, scale: 1, duration: 0.04, ease: 'back.out(1.5)' }, 0.7 + i * 0.012);
        });
        tl.to(aiTyping2, { opacity: 0, scale: 0.9, duration: 0.03 }, 0.78);
        aiReply2.forEach((el, i) => {
          tl.to(el, { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.8 + i * 0.015);
        });
        showStatus(6, 0.82);
        scrollPhones(0.73);
        scrollPhones(0.84);
        tl.to(doneTags, { opacity: 1, y: 0, duration: 0.04, stagger: 0.015 }, 0.86);
        scrollPhones(0.88);

        // Phase 5 — workflow + complete
        tl.to(statusLines, { opacity: 0, duration: 0.03 }, 0.88);
        tl.to(finalStatus, { opacity: 1, scale: 1, duration: 0.05, ease: 'back.out(1.4)' }, 0.89);
        workflow.forEach((el, i) => {
          tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.012, ease: 'back.out(2)' }, 0.9 + i * 0.012);
        });
        tl.to({}, { duration: 0.04 }, 1);
      }, stage);

      ScrollTrigger.refresh();
    }

    init();

    return () => {
      cancelled = true;
      ctxRef.current?.revert();
    };
  }, []);

  return (
    <section ref={wrapperRef} className="automation-scroll-wrapper relative -mt-1 w-full bg-[#F8FAFC] sm:-mt-2">
      <div
        ref={pinRef}
        className={
          SHOW_LIVE_ANIMATION
            ? 'relative flex min-h-screen w-full flex-col justify-center pb-12 pt-6 sm:pb-16 sm:pt-8'
            : 'relative w-full py-8 sm:py-10'
        }
      >
        <div className="mx-auto mb-6 w-full max-w-3xl px-4 text-center sm:px-6">
          <h2
            className="text-3xl font-extrabold tracking-[-0.03em] text-[#111827] sm:text-4xl"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Automation in Action
          </h2>
          <p className="mt-2 text-base text-[#64748B] sm:text-lg">
            See how LeadForGrow replies to every customer, everywhere, instantly.
          </p>
        </div>

        {!SHOW_LIVE_ANIMATION && (
          <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-3 md:gap-5 lg:px-8">
            <ChannelColumn
              channel="email"
              accent="email"
              icon={Mail}
              title="Email"
              subtitle="Inbox · Auto-reply"
              iconClass="border border-blue-100 bg-blue-50 text-blue-600"
              iconStrokeWidth={1.75}
              compact
            >
              <EmailAutomationGraphic />
            </ChannelColumn>

            <ChannelColumn
              channel="whatsapp"
              accent="whatsapp"
              icon={WhatsAppLogo}
              title="WhatsApp"
              subtitle="Business chat · Auto-reply"
              iconClass="bg-transparent"
              iconSize="h-10 w-10"
              compact
            >
              <img
                src="/images/interakt-clone/whatsapp-intent-matching.webp"
                alt="WhatsApp AI detecting customer intent and triggering an automated reply"
                className="max-h-[300px] w-full object-contain"
                loading="lazy"
              />
            </ChannelColumn>

            <ChannelColumn
              channel="instagram"
              accent="instagram"
              icon={InstagramIcon}
              title="Instagram DM"
              subtitle="Direct messages · Auto-reply"
              iconClass="border border-pink-100 bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 text-pink-600"
              compact
            >
              <img
                src="/images/interakt-clone/instagram-dm-automation-large.webp"
                alt="Instagram DM automatically replying to a comment with a reward"
                className="max-h-[300px] w-full object-contain"
                loading="lazy"
              />
            </ChannelColumn>
          </div>
        )}

        {SHOW_LIVE_ANIMATION && (
        <div ref={stageRef} className="relative w-full">
          <div className="mb-5 flex justify-center px-4 sm:mb-6 sm:px-6">
            <div className="relative flex h-11 min-w-[300px] max-w-full items-center justify-center border-2 border-black bg-white px-5 sm:h-12 sm:min-w-[400px] sm:px-8">
              {FLOW_STEPS.map((item, i) => (
                <span
                  key={item.step}
                  data-status-line
                  className={`absolute inset-x-0 flex items-center justify-center gap-2 px-3 text-center sm:gap-2.5 ${i === 0 ? '' : 'opacity-0'}`}
                >
                  <span className="text-[11px] font-bold tabular-nums text-[#64748B] sm:text-xs">
                    Step {item.step}
                  </span>
                  <span className="text-[#CBD5E1]" aria-hidden>
                    ·
                  </span>
                  <span className="text-sm font-semibold text-indigo-600 sm:text-[15px]">{item.text}</span>
                </span>
              ))}
              <span
                data-final-status
                className="absolute inset-x-0 flex items-center justify-center gap-2 px-3 text-center opacity-0 sm:gap-2.5"
              >
                <span className="text-[11px] font-bold tabular-nums text-emerald-700 sm:text-xs">Step 8</span>
                <span className="text-[#CBD5E1]" aria-hidden>
                  ·
                </span>
                <span className="text-sm font-bold text-emerald-600 sm:text-[15px]">Automation complete</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-3 md:gap-5 lg:px-8">
            {/* Email */}
            <ChannelColumn
              channel="email"
              accent="email"
              icon={Mail}
              title="Email"
              subtitle="Inbox · Auto-reply"
              iconClass="border border-blue-100 bg-blue-50 text-blue-600"
              iconStrokeWidth={1.75}
            >
              <PhoneMockup theme="email" headerLabel="Inbox">
                <EmptyPhoneState theme="email" />
                <div data-incoming className="opacity-0">
                  <InboxRow
                    sender={INCOMING.email.sender}
                    subject={INCOMING.email.subject}
                    time={INCOMING.email.time}
                    unread
                    highlight
                  />
                </div>
                <div data-ai-typing-1 className="flex items-center gap-1 border-t border-[#E8ECEF] px-0.5 py-1 opacity-0">
                  <span className="text-[8px] text-[#94A3B8]">Drafting</span>
                  <TypingDots />
                </div>
                <div data-ai-reply-1 className="opacity-0">
                  <InboxRow sender="LeadForGrow" subject={AI_REPLY_1.email} time="Now" highlight />
                </div>
                <div data-user-reply className="opacity-0">
                  <InboxRow
                    sender={USER_REPLY.email.sender}
                    subject={USER_REPLY.email.subject}
                    time={USER_REPLY.email.time}
                    unread
                    highlight
                  />
                </div>
                <div data-ai-typing-2 className="flex items-center gap-1 border-t border-[#E8ECEF] px-0.5 py-1 opacity-0">
                  <span className="text-[8px] text-[#94A3B8]">Drafting</span>
                  <TypingDots />
                </div>
                <div data-ai-reply-2 className="opacity-0">
                  <InboxRow sender="LeadForGrow" subject={AI_REPLY_2.email} time="Now" highlight />
                  <p data-done-tag className="mt-1 px-0.5 text-[8px] font-medium text-emerald-600 opacity-0">
                    ✓ Sent automatically
                  </p>
                </div>
              </PhoneMockup>
            </ChannelColumn>

            {/* WhatsApp */}
            <ChannelColumn
              channel="whatsapp"
              accent="whatsapp"
              icon={WhatsAppLogo}
              title="WhatsApp"
              subtitle="Business chat · Auto-reply"
              iconClass="bg-transparent"
              iconSize="h-10 w-10"
            >
              <PhoneMockup theme="whatsapp" headerLabel="WhatsApp Business">
                <EmptyPhoneState theme="whatsapp" />
                <div data-incoming className="max-w-[88%] opacity-0">
                  <div className="rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
                    <p className="text-[10px] leading-relaxed text-[#111827]">{INCOMING.whatsapp}</p>
                    <p className="mt-0.5 text-right text-[8px] text-[#667781]">10:25 AM</p>
                  </div>
                </div>
                <div data-ai-typing-1 className="flex max-w-[70%] self-end rounded-lg bg-[#D9FDD3] px-2.5 py-1.5 opacity-0">
                  <TypingDots />
                </div>
                <div data-ai-reply-1 className="flex max-w-[90%] self-end opacity-0">
                  <div className="rounded-lg rounded-tr-none bg-[#D9FDD3] px-2.5 py-1.5 shadow-sm">
                    <p className="text-[10px] leading-relaxed text-[#111827]">{AI_REPLY_1.whatsapp}</p>
                    <p className="mt-0.5 text-right text-[8px] text-[#667781]">10:25 AM</p>
                  </div>
                </div>
                <div data-user-reply className="max-w-[88%] opacity-0">
                  <div className="rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
                    <p className="text-[10px] leading-relaxed text-[#111827]">{USER_REPLY.whatsapp}</p>
                    <p className="mt-0.5 text-right text-[8px] text-[#667781]">10:31 AM</p>
                  </div>
                </div>
                <div data-ai-typing-2 className="flex max-w-[70%] self-end rounded-lg bg-[#D9FDD3] px-2.5 py-1.5 opacity-0">
                  <TypingDots />
                </div>
                <div data-ai-reply-2 className="flex flex-col items-end opacity-0">
                  <div className="max-w-[90%] rounded-lg rounded-tr-none bg-[#D9FDD3] px-2.5 py-1.5 shadow-sm">
                    <p className="text-[10px] leading-relaxed text-[#111827]">{AI_REPLY_2.whatsapp}</p>
                    <p className="mt-0.5 text-right text-[8px] text-[#667781]">10:31 AM</p>
                  </div>
                  <p data-done-tag className="mt-1 text-[9px] font-medium text-emerald-600 opacity-0">
                    ✓ Replied Automatically
                  </p>
                </div>
              </PhoneMockup>
            </ChannelColumn>

            {/* Instagram */}
            <ChannelColumn
              channel="instagram"
              accent="instagram"
              icon={InstagramIcon}
              title="Instagram DM"
              subtitle="Direct messages · Auto-reply"
              iconClass="border border-pink-100 bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 text-pink-600"
            >
              <PhoneMockup theme="instagram" headerLabel="Messages">
                <EmptyPhoneState theme="instagram" />
                <div data-incoming className="flex gap-1.5 opacity-0">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400" />
                  <div className="rounded-2xl rounded-tl-sm bg-[#262626] px-2.5 py-1.5">
                    <p className="text-[10px] leading-relaxed text-white">{INCOMING.instagram}</p>
                  </div>
                </div>
                <div data-ai-typing-1 className="flex self-end rounded-2xl bg-[#262626] px-2.5 py-1.5 opacity-0">
                  <TypingDots light />
                </div>
                <div data-ai-reply-1 className="flex self-end opacity-0">
                  <div className="max-w-[92%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] px-2.5 py-1.5">
                    <p className="text-[10px] leading-relaxed text-white">{AI_REPLY_1.instagram}</p>
                  </div>
                </div>
                <div data-user-reply className="flex gap-1.5 opacity-0">
                  <div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400" />
                  <div className="rounded-2xl rounded-tl-sm bg-[#262626] px-2.5 py-1.5">
                    <p className="text-[10px] leading-relaxed text-white">{USER_REPLY.instagram}</p>
                  </div>
                </div>
                <div data-ai-typing-2 className="flex self-end rounded-2xl bg-[#262626] px-2.5 py-1.5 opacity-0">
                  <TypingDots light />
                </div>
                <div data-ai-reply-2 className="flex flex-col items-end opacity-0">
                  <div className="max-w-[92%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] px-2.5 py-1.5">
                    <p className="text-[10px] leading-relaxed text-white">{AI_REPLY_2.instagram}</p>
                  </div>
                  <p data-done-tag className="mt-1 text-[9px] font-medium text-emerald-600 opacity-0">
                    ✓ Replied Automatically
                  </p>
                </div>
              </PhoneMockup>
            </ChannelColumn>
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap justify-center gap-1.5 px-4 sm:gap-2 sm:px-6">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step}
                data-workflow
                className="rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-[9px] font-medium text-emerald-700 shadow-sm opacity-0 sm:text-[10px]"
              >
                ✓ {step}
              </div>
            ))}
          </div>
        </div>
        )}

        {SHOW_LIVE_ANIMATION && (
          <p className="mt-6 px-4 text-center text-xs text-[#94A3B8] sm:px-6">
            Scroll to control the automation timeline
          </p>
        )}
      </div>
    </section>
  );
}
