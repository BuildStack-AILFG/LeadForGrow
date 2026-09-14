'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  TrendingUp,
  Users,
} from 'lucide-react';

const JOURNEY_STEPS = [
  {
    id: 'capture',
    progress: 'Lead Captured',
    title: 'Lead Captured',
    description: 'A customer discovers your business and sends a message.',
  },
  {
    id: 'reply',
    progress: 'Auto Reply',
    title: 'Instant AI Reply',
    description: 'LeadForGrow reads the message and replies instantly.',
  },
  {
    id: 'contact',
    progress: 'CRM Update',
    title: 'CRM Creates Contact',
    description: 'Every conversation becomes an organized customer profile.',
  },
  {
    id: 'qualify',
    progress: 'AI Qualification',
    title: 'AI Qualification',
    description: 'The AI scores the lead and identifies buying intent.',
  },
  {
    id: 'assign',
    progress: 'Team Assignment',
    title: 'Smart Assignment',
    description: 'The right salesperson receives the lead instantly.',
  },
  {
    id: 'followup',
    progress: 'Follow-up',
    title: 'Follow-up Automation',
    description: 'No opportunity is forgotten.',
  },
  {
    id: 'meeting',
    progress: 'Meeting',
    title: 'Meeting Booked',
    description: 'The customer books a meeting automatically.',
  },
  {
    id: 'pipeline',
    progress: 'Pipeline',
    title: 'Pipeline Updated',
    description: 'Every action updates your sales pipeline automatically.',
  },
  {
    id: 'analytics',
    progress: 'Analytics',
    title: 'Analytics Updated',
    description: 'LeadForGrow tracks every conversation and business metric in real time.',
  },
  {
    id: 'growth',
    progress: 'Deal Won',
    title: 'Business Keeps Growing',
    description: "While you're focused on your business, LeadForGrow keeps every conversation moving.",
  },
];

const FINAL_LABELS = [
  'Captured',
  'Replied',
  'Qualified',
  'Assigned',
  'Followed Up',
  'Scheduled',
  'Converted',
  'Analyzed',
];

function InstagramIcon({ className }) {
  // Full-color Instagram brand gradient mark.
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <radialGradient id="lfg-ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FFD776" />
          <stop offset="10%" stopColor="#F9AA47" />
          <stop offset="25%" stopColor="#EF5E5A" />
          <stop offset="50%" stopColor="#D93175" />
          <stop offset="75%" stopColor="#B6339A" />
          <stop offset="100%" stopColor="#7A3FC8" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#lfg-ig-grad)" />
      <rect x="5.75" y="5.75" width="12.5" height="12.5" rx="4" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.35" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="17.35" cy="6.65" r="1.05" fill="#fff" />
    </svg>
  );
}

function GmailIcon({ className }) {
  // Official Gmail envelope mark.
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M2 6.5A2.5 2.5 0 0 1 4.5 4H5l7 5 7-5h.5A2.5 2.5 0 0 1 22 6.5V18a2 2 0 0 1-2 2h-2V9.7l-6 4.3-6-4.3V20H4a2 2 0 0 1-2-2V6.5Z" />
      <path fill="#34A853" d="M4 20h2V9.7l-4-2.85V18a2 2 0 0 0 2 2Z" />
      <path fill="#FBBC04" d="M18 20h2a2 2 0 0 0 2-2V6.85l-4 2.85V20Z" />
      <path fill="#EA4335" d="m6 9.7 6 4.3 6-4.3V4h-.5L12 9 5 4h-.5A2.5 2.5 0 0 0 2 6.5v.35L6 9.7Z" />
      <path fill="#C5221F" d="M22 6.5v.35L18 9.7V4h.5A2.5 2.5 0 0 1 22 6.5Z" />
    </svg>
  );
}

function WhatsAppIcon({ className }) {
  // Official WhatsApp mark.
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden>
      <path
        fill="#25D366"
        d="M16.02 3C8.83 3 3 8.82 3 16c0 2.3.62 4.55 1.8 6.53L3 29l6.66-1.74A12.98 12.98 0 0 0 16.02 29C23.2 29 29 23.18 29 16S23.2 3 16.02 3Z"
      />
      <path
        fill="#FFFFFF"
        d="M22.55 19.5c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.63.14-.19.28-.72.9-.88 1.09-.16.19-.32.2-.6.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.67-1.57-1.96-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 2.72 1.14 2.91c.14.19 1.99 3.04 4.83 4.26.67.29 1.2.46 1.61.58.68.22 1.29.19 1.78.12.54-.08 1.66-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33Z"
      />
    </svg>
  );
}

function CrmShell({ title, children, className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.08)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[#EEF2F6] bg-[#FAFBFC] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 text-[#64748B]" aria-hidden>
      <span className="typing-dot" />
      <span className="typing-dot typing-dot-delay-1" />
      <span className="typing-dot typing-dot-delay-2" />
    </span>
  );
}

export default function CustomerJourneySection({ onGetStarted, onBookDemo }) {
  const wrapperRef = useRef(null);
  const pinRef = useRef(null);
  const stageRef = useRef(null);
  const ctxRef = useRef(null);

  useLayoutEffect(() => {
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

      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      const scrollLen = mobile ? 5200 : 5800;

      ctxRef.current = gsap.context(() => {
        const q = gsap.utils.selector(stage);
        const progressItems = q('[data-progress-item]');
        const progressFill = q('[data-progress-fill]')[0];
        const scenes = q('[data-journey-scene]');
        const finalScene = q('[data-journey-final-visual]')[0];
        const finalLeft = q('[data-journey-final-copy]')[0];
        const finalCta = q('[data-journey-cta]')[0];
        const finalLabels = q('[data-final-label]');

        const stepNumEl = q('[data-journey-step-num]')[0];
        const stepTitleEl = q('[data-journey-step-title]')[0];
        const stepDescEl = q('[data-journey-step-desc]')[0];
        const stepPanel = q('[data-journey-panel]')[0];

        gsap.set(stepPanel, { autoAlpha: 1, y: 0 });
        gsap.set(scenes, { opacity: 0, scale: 0.98 });
        gsap.set(scenes[0], { opacity: 1, scale: 1 });
        gsap.set(finalScene, { autoAlpha: 0, scale: 0.92 });
        gsap.set(finalLeft, { autoAlpha: 0, y: 14 });
        gsap.set(finalCta, { opacity: 0, y: 16 });
        gsap.set(finalLabels, { opacity: 0, y: 10, scale: 0.9 });
        if (progressFill) gsap.set(progressFill, { scaleY: 1 / JOURNEY_STEPS.length, transformOrigin: 'top center' });

        const seg = 1 / 11;

        function getStepIndex(progress) {
          if (progress >= seg * 10) return -1;
          for (let i = JOURNEY_STEPS.length - 1; i >= 0; i -= 1) {
            const threshold = i === 0 ? seg * 0.05 : seg * i;
            if (progress >= threshold) return i;
          }
          return 0;
        }

        function applyProgress(index) {
          progressItems.forEach((el) => {
            const stepIndex = Number(el.dataset.stepIndex);
            if (Number.isNaN(stepIndex)) return;
            el.classList.toggle('journey-progress-active', stepIndex === index);
            el.classList.toggle('journey-progress-done', index >= 0 && stepIndex < index);
          });
          if (progressFill && index >= 0) {
            gsap.set(progressFill, { scaleY: (index + 1) / JOURNEY_STEPS.length });
          }
        }

        function applyStepContent(index) {
          if (index < 0 || !JOURNEY_STEPS[index]) return;
          const step = JOURNEY_STEPS[index];
          if (stepNumEl) {
            stepNumEl.textContent = `STEP ${String(index + 1).padStart(2, '0')}`;
          }
          if (stepTitleEl) stepTitleEl.textContent = step.title;
          if (stepDescEl) stepDescEl.textContent = step.description;
        }

        applyProgress(0);
        applyStepContent(0);

        scenes.forEach((scene) => {
          q('[data-animate]', scene).forEach((el) => {
            const hidden = el.dataset.animateHidden !== 'false';
            if (hidden) gsap.set(el, { opacity: 0, y: el.dataset.animateY ? Number(el.dataset.animateY) : 12 });
          });
        });

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
              const idx = getStepIndex(self.progress);
              if (idx >= 0) {
                applyProgress(idx);
                applyStepContent(idx);
                gsap.set(stepPanel, { autoAlpha: 1, y: 0 });
                gsap.set(finalLeft, { autoAlpha: 0 });
              } else {
                progressItems.forEach((el) => {
                  const stepIndex = Number(el.dataset.stepIndex);
                  if (Number.isNaN(stepIndex)) return;
                  el.classList.add('journey-progress-done');
                  el.classList.remove('journey-progress-active');
                });
                if (progressFill) gsap.set(progressFill, { scaleY: 1 });
                gsap.set(stepPanel, { autoAlpha: 0, y: -8 });
              }
            },
          },
        });

        function showScene(index, position) {
          scenes.forEach((el, i) => {
            tl.to(el, { opacity: i === index ? 1 : 0, scale: i === index ? 1 : 0.98, duration: 0.06, ease: 'power2.out' }, position);
          });
        }

        function animateIn(sceneIndex, selector, position, stagger = 0.015) {
          const scene = scenes[sceneIndex];
          if (!scene) return;
          scene.querySelectorAll(selector).forEach((el, i) => {
            tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.05, ease: 'power2.out' }, position + i * stagger);
          });
        }

        // Step 1 — Lead Captured
        showScene(0, seg * 0.05);
        animateIn(0, '[data-s1-channel]', seg * 0.08);
        tl.to(q('[data-s1-wa-expand]')[0], { opacity: 1, scale: 1, duration: 0.06 }, seg * 0.35);
        animateIn(0, '[data-s1-msg]', seg * 0.42, 0.02);

        // Step 2 — Instant AI Reply
        showScene(1, seg * 1);
        animateIn(1, '[data-s2-incoming]', seg * 1.05);
        tl.to(q('[data-s2-typing]')[0], { opacity: 1, duration: 0.04 }, seg * 1.2);
        tl.to(q('[data-s2-typing]')[0], { opacity: 0, duration: 0.02 }, seg * 1.35);
        tl.to(q('[data-s2-reply]')[0], { opacity: 1, y: 0, duration: 0.05 }, seg * 1.38);
        tl.to(q('[data-s2-time-old]')[0], { opacity: 0, duration: 0.04 }, seg * 1.45);
        tl.to(q('[data-s2-time-new]')[0], { opacity: 1, duration: 0.04 }, seg * 1.45);

        // Step 3 — CRM Contact
        showScene(2, seg * 2);
        animateIn(2, '[data-s3-field]', seg * 2.08, 0.012);

        // Step 4 — AI Qualification
        showScene(3, seg * 3);
        tl.to(q('[data-s4-score]')[0], { opacity: 1, scale: 1, duration: 0.06, ease: 'back.out(1.5)' }, seg * 3.1);
        animateIn(3, '[data-s4-tag]', seg * 3.18, 0.012);
        tl.to(q('[data-s4-badge]')[0], { opacity: 1, y: 0, duration: 0.05 }, seg * 3.35);

        // Step 5 — Assignment
        showScene(4, seg * 4);
        animateIn(4, '[data-s5-agent]', seg * 4.08);
        tl.to(q('[data-s5-notif]')[0], { opacity: 1, x: 0, duration: 0.05 }, seg * 4.2);
        tl.to(q('[data-s5-assigned]')[0], { opacity: 1, scale: 1, duration: 0.05 }, seg * 4.32);

        // Step 6 — Follow-up
        showScene(5, seg * 5);
        q('[data-s6-step]').forEach((el, i) => {
          tl.to(el, { opacity: 1, x: 0, duration: 0.04, ease: 'power2.out' }, seg * 5.08 + i * 0.025);
        });

        // Step 7 — Meeting
        showScene(6, seg * 6);
        animateIn(6, '[data-s7-cal]', seg * 6.1, 0.015);
        tl.to(q('[data-s7-confirmed]')[0], { opacity: 1, scale: 1, duration: 0.05 }, seg * 6.35);

        // Step 8 — Pipeline
        showScene(7, seg * 7);
        tl.to(q('[data-s8-card]')[0], { left: '0%', duration: 0.12, ease: 'power2.inOut' }, seg * 7.1);
        tl.to(q('[data-s8-card]')[0], { left: '25%', duration: 0.1, ease: 'power2.inOut' }, seg * 7.22);
        tl.to(q('[data-s8-card]')[0], { left: '50%', duration: 0.1, ease: 'power2.inOut' }, seg * 7.34);
        tl.to(q('[data-s8-card]')[0], { left: '75%', duration: 0.1, ease: 'power2.inOut' }, seg * 7.46);

        // Step 9 — Analytics
        showScene(8, seg * 8);
        animateIn(8, '[data-s9-metric]', seg * 8.08, 0.012);
        q('[data-s9-bar]').forEach((el, i) => {
          tl.to(el, { scaleY: 1, duration: 0.05, ease: 'power2.out' }, seg * 8.25 + i * 0.012);
        });

        // Step 10 — Growth
        showScene(9, seg * 9);
        animateIn(9, '[data-s10-channel]', seg * 9.08, 0.015);
        animateIn(9, '[data-s10-flow]', seg * 9.2, 0.012);

        // Final
        tl.to(stepPanel, { autoAlpha: 0, duration: 0.04 }, seg * 10);
        tl.to(scenes, { opacity: 0, scale: 0.94, duration: 0.06 }, seg * 10);
        tl.to(finalLeft, { autoAlpha: 1, y: 0, duration: 0.06, ease: 'power2.out' }, seg * 10.05);
        tl.to(finalScene, { autoAlpha: 1, scale: 1, duration: 0.08, ease: 'power2.out' }, seg * 10.05);
        finalLabels.forEach((el, i) => {
          tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.03, ease: 'back.out(2)' }, seg * 10.12 + i * 0.012);
        });
        tl.to(finalCta, { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, seg * 10.55);
        tl.to({}, { duration: 0.08 }, 1);
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
    <section ref={wrapperRef} className="customer-journey-wrapper relative w-full bg-[#F8FAFC]">
      <div ref={pinRef} className="relative min-h-[93vh] w-full">
        <div
          ref={stageRef}
          className="grid min-h-[93vh] w-full grid-cols-1 lg:grid-cols-2 lg:grid-rows-1"
        >
          {/* LEFT — story panel */}
          <div className="relative flex flex-col justify-center border-b border-[#E2E8F0] bg-gradient-to-br from-white via-[#FAFDFA] to-[#EEF8ED]/80 px-5 py-6 sm:px-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-8 xl:px-10">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  The Customer Journey
                </p>
                <span className="hidden rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1 text-[10px] font-semibold text-emerald-800 sm:inline-block">
                  Scroll to explore
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-[132px_minmax(0,1fr)] lg:gap-7">
                {/* Progress rail */}
                <nav className="relative hidden lg:block" aria-label="Journey progress">
                  <div className="absolute bottom-2 left-[9px] top-2 w-[2px] overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div data-progress-fill className="h-full w-full origin-top scale-y-0 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                  </div>
                  <ol className="relative space-y-0">
                    {JOURNEY_STEPS.map((step, i) => (
                      <li
                        key={step.id}
                        data-progress-item
                        data-step-index={i}
                        className={`journey-progress-item relative flex min-h-[30px] items-center gap-2.5 py-0.5 ${i === 0 ? 'journey-progress-active' : ''}`}
                      >
                        <span className="journey-progress-dot relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#CBD5E1] bg-white transition-all duration-300">
                          <span className="journey-progress-dot-inner h-1.5 w-1.5 rounded-full bg-transparent transition-colors duration-300" />
                        </span>
                        <span className="journey-progress-label text-[11px] font-medium leading-tight text-[#94A3B8] transition-colors duration-300">
                          {step.progress}
                        </span>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* Mobile progress */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
                  {JOURNEY_STEPS.map((step, i) => (
                    <span
                      key={step.id}
                      data-progress-item
                      data-step-index={i}
                      className={`journey-progress-item shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${i === 0 ? 'journey-progress-active border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#E2E8F0] bg-white text-[#94A3B8]'}`}
                    >
                      {step.progress}
                    </span>
                  ))}
                </div>

                {/* Step content card */}
                <div className="relative min-h-[168px] sm:min-h-[180px]">
                  <div className="absolute inset-0 rounded-2xl border border-[#E2E8F0]/90 bg-white/90 shadow-[0_8px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm" />

                  <div className="relative px-5 py-5 sm:px-6 sm:py-6">
                    <div data-journey-panel className="relative">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3 py-1">
                        <span
                          data-journey-step-num
                          className="text-[10px] font-bold tabular-nums tracking-wider text-emerald-700"
                        >
                          STEP 01
                        </span>
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-semibold text-emerald-800/80">
                          of {String(JOURNEY_STEPS.length).padStart(2, '0')}
                        </span>
                      </div>
                      <h2
                        data-journey-step-title
                        className="mt-4 text-[1.45rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0F172A] sm:text-[1.6rem]"
                        style={{ fontFamily: 'var(--font-plus-jakarta)' }}
                      >
                        {JOURNEY_STEPS[0].title}
                      </h2>
                      <p
                        data-journey-step-desc
                        className="mt-3 max-w-md text-[14px] leading-[1.6] text-[#64748B]"
                      >
                        {JOURNEY_STEPS[0].description}
                      </p>
                    </div>

                    <div
                      data-journey-final-copy
                      className="invisible absolute inset-x-5 top-5 opacity-0 sm:inset-x-6 sm:top-6"
                    >
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Complete</span>
                      </div>
                      <h2
                        className="mt-5 text-[1.65rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0F172A] sm:text-[1.85rem]"
                        style={{ fontFamily: 'var(--font-plus-jakarta)' }}
                      >
                        Your business runs.
                        <br />
                        <span className="text-emerald-700">LeadForGrow does the rest.</span>
                      </h2>
                      <div data-journey-cta className="pointer-events-auto mt-7 flex flex-wrap gap-3 opacity-0">
                        <button
                          type="button"
                          onClick={onGetStarted}
                          className="rounded-xl bg-[#1a1a1a] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-colors hover:bg-black"
                        >
                          Start Free Trial
                        </button>
                        <button
                          type="button"
                          onClick={onBookDemo}
                          className="group inline-flex items-center gap-2 rounded-xl border border-[#D4D4D4] bg-white px-5 py-3 text-[14px] font-medium text-[#1a1a1a] transition-colors hover:border-[#BDBDBD]"
                        >
                          Book a Demo
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] text-[#94A3B8] lg:text-left">
                Scroll to control the customer journey
              </p>
            </div>
          </div>

          {/* RIGHT — CRM workspace */}
          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#EEF8ED] via-[#F8FAFC] to-[#EEF2FF] p-5 sm:p-7 lg:min-h-[93vh] lg:p-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(99,102,241,0.08),transparent_50%)]" />

            {/* Scene 1 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center sm:inset-8 lg:inset-10">
              <div className="relative w-full max-w-lg">
                <div className="flex justify-center gap-3">
                  {[
                    { icon: GmailIcon, label: 'Gmail', color: 'border-blue-200 bg-blue-50 text-slate-700' },
                    { icon: WhatsAppIcon, label: 'WhatsApp', color: 'border-emerald-200 bg-emerald-50 text-slate-700' },
                    { icon: InstagramIcon, label: 'Instagram', color: 'border-pink-200 bg-pink-50 text-slate-700' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      data-s1-channel
                      data-animate
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 shadow-sm ${color}`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
                <div
                  data-s1-wa-expand
                  data-animate
                  className="mx-auto mt-6 max-w-sm scale-95 rounded-2xl border border-emerald-200 bg-white p-4 opacity-0 shadow-lg"
                >
                  <div className="mb-3 flex items-center gap-2 text-emerald-700">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs font-semibold">WhatsApp · Priya Sharma</span>
                  </div>
                  <div data-s1-msg data-animate className="rounded-xl rounded-tl-sm bg-[#ECE5DD] p-3">
                    <p className="text-sm text-[#111827]">Hi, I&apos;m interested in your CRM. Can you tell me more?</p>
                    <p className="mt-2 text-right text-[10px] font-medium text-emerald-600">Sent ✓</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scene 2 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Unified Inbox" className="w-full max-w-md">
                <div data-s2-incoming data-animate className="mb-3 rounded-xl bg-[#ECE5DD] px-3 py-2.5">
                  <p className="text-sm text-[#111827]">Hi, I&apos;m interested in your CRM. Can you tell me more?</p>
                </div>
                <div data-s2-typing data-animate className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 opacity-0">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700">Auto-reply</span>
                  <TypingDots />
                </div>
                <div data-s2-reply data-animate className="rounded-xl bg-[#D9FDD3] px-3 py-2.5">
                  <p className="text-sm text-[#111827]">
                    Hi 👋 Thanks for contacting us. I&apos;d be happy to help. Here&apos;s how LeadForGrow automates your
                    sales.
                  </p>
                  <p className="mt-1 text-right text-[10px] text-[#667781]">Delivered ✓</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#EEF2F6] pt-3">
                  <span className="text-xs text-[#64748B]">Response time</span>
                  <span className="relative text-sm font-bold tabular-nums text-emerald-600">
                    <span data-s2-time-old>12 min</span>
                    <span data-s2-time-new className="absolute right-0 top-0 opacity-0">
                      2 sec
                    </span>
                  </span>
                </div>
              </CrmShell>
            </div>

            {/* Scene 3 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Contact Profile" className="w-full max-w-sm">
                {[
                  ['Avatar', 'PS'],
                  ['Phone', '+91 98765 43210'],
                  ['Email', 'priya@company.com'],
                  ['Source', 'WhatsApp'],
                  ['Tags', 'CRM · SaaS'],
                  ['Status', 'New Lead'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    data-s3-field
                    data-animate
                    className="mb-2 flex items-center justify-between rounded-lg border border-[#EEF2F6] bg-[#FAFBFC] px-3 py-2"
                  >
                    <span className="text-xs text-[#64748B]">{label}</span>
                    <span className={`text-sm font-semibold text-[#111827] ${label === 'Avatar' ? '' : ''}`}>
                      {label === 'Avatar' ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                          {value}
                        </span>
                      ) : (
                        value
                      )}
                    </span>
                  </div>
                ))}
                <p className="mt-3 text-center text-[11px] font-medium text-emerald-600">Filled automatically — no manual typing</p>
              </CrmShell>
            </div>

            {/* Scene 4 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="AI Lead Intelligence" className="w-full max-w-sm">
                <div
                  data-s4-score
                  data-animate
                  className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 opacity-0"
                >
                  <div>
                    <p className="text-xs text-[#64748B]">Lead Score</p>
                    <p className="text-3xl font-extrabold tabular-nums text-[#111827]">82/100</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">Hot Lead 🔥</span>
                </div>
                {[
                  'Industry detected · SaaS',
                  'Company size · 50–200',
                  'Budget estimated · High',
                  'Buying intent · High',
                ].map((tag) => (
                  <div key={tag} data-s4-tag data-animate className="mb-2 rounded-lg border border-[#EEF2F6] px-3 py-2 text-sm text-[#374151]">
                    {tag}
                  </div>
                ))}
                <div data-s4-badge data-animate className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white opacity-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Qualified Automatically
                </div>
              </CrmShell>
            </div>

            {/* Scene 5 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Sales Team" className="w-full max-w-sm">
                <div data-s5-agent data-animate className="flex items-center gap-3 rounded-xl border border-[#EEF2F6] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    R
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Rahul</p>
                    <p className="text-xs text-emerald-600">● Online</p>
                  </div>
                </div>
                <div
                  data-s5-notif
                  data-animate
                  className="mt-3 translate-x-4 rounded-xl border border-amber-200 bg-amber-50 p-3 opacity-0"
                >
                  <p className="text-xs font-semibold text-amber-800">New Lead Assigned</p>
                  <p className="mt-1 text-sm text-[#374151]">Priya Sharma → Rahul</p>
                </div>
                <div
                  data-s5-assigned
                  data-animate
                  className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 opacity-0"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Rahul accepted · Lead moved</span>
                </div>
              </CrmShell>
            </div>

            {/* Scene 6 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Follow-up Workflow" className="w-full max-w-sm">
                {['1 Day', 'Email', 'WhatsApp Reminder', 'Instagram Follow-up', 'Call Reminder'].map((step, i) => (
                  <div
                    key={step}
                    data-s6-step
                    data-animate
                    className="mb-2 flex translate-x-6 items-center gap-3 rounded-lg border border-[#EEF2F6] px-3 py-2.5 opacity-0"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-[#111827]">{step}</span>
                  </div>
                ))}
              </CrmShell>
            </div>

            {/* Scene 7 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Meeting Scheduler" className="w-full max-w-sm">
                <button
                  type="button"
                  data-s7-cal
                  data-animate
                  className="mb-4 w-full rounded-xl bg-[#1a1a1a] py-2.5 text-sm font-semibold text-white"
                >
                  Book Demo
                </button>
                <div data-s7-cal data-animate className="grid grid-cols-2 gap-2">
                  {['Tomorrow', '2:30 PM', 'Thu', '11:00 AM'].map((slot) => (
                    <div key={slot} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-center text-sm text-[#64748B]">
                      {slot}
                    </div>
                  ))}
                </div>
                <div
                  data-s7-confirmed
                  data-animate
                  className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 opacity-0"
                >
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Meeting Scheduled · Tomorrow 2:30 PM</span>
                </div>
              </CrmShell>
            </div>

            {/* Scene 8 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Sales Pipeline" className="w-full max-w-lg">
                <div className="relative h-36">
                  <div className="grid h-full grid-cols-4 gap-2">
                    {['New Lead', 'Qualified', 'Demo Booked', 'Won'].map((col) => (
                      <div key={col} className="rounded-lg bg-[#F8FAFC] p-2">
                        <p className="text-[10px] font-semibold text-[#64748B]">{col}</p>
                      </div>
                    ))}
                  </div>
                  <div
                    data-s8-card
                    data-animate
                    data-animate-hidden="false"
                    className="absolute top-10 w-[22%] rounded-lg border border-emerald-200 bg-white p-2 shadow-md"
                    style={{ left: '0%' }}
                  >
                    <p className="text-xs font-semibold text-[#111827]">Priya Sharma</p>
                    <p className="text-[10px] text-emerald-600">Moving…</p>
                  </div>
                </div>
              </CrmShell>
            </div>

            {/* Scene 9 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Analytics Dashboard" className="w-full max-w-md">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Revenue', value: '₹8.2L', icon: TrendingUp },
                    { label: 'Conversion', value: '+42%', icon: BarChart3 },
                    { label: 'Response', value: '2 sec', icon: Clock },
                    { label: 'Meetings', value: '38', icon: Calendar },
                    { label: 'Won Deals', value: '12', icon: Check },
                    { label: 'Leads', value: '842', icon: Users },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} data-s9-metric data-animate className="rounded-xl border border-[#EEF2F6] bg-[#FAFBFC] p-3">
                      <Icon className="mb-1 h-4 w-4 text-emerald-600" />
                      <p className="text-[10px] text-[#64748B]">{label}</p>
                      <p className="text-lg font-bold tabular-nums text-[#111827]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-16 items-end gap-1">
                  {[40, 65, 50, 80, 70, 95, 85].map((h, i) => (
                    <div
                      key={i}
                      data-s9-bar
                      data-animate
                      data-animate-hidden="false"
                      className="flex-1 origin-bottom scale-y-0 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </CrmShell>
            </div>

            {/* Scene 10 */}
            <div data-journey-scene className="absolute inset-6 flex items-center justify-center opacity-0 sm:inset-8 lg:inset-10">
              <CrmShell title="Live Operations" className="w-full max-w-md">
                <div className="flex justify-center gap-2">
                  {['Email', 'WhatsApp', 'Instagram'].map((ch) => (
                    <span
                      key={ch}
                      data-s10-channel
                      data-animate
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
                    >
                      {ch} · Active
                    </span>
                  ))}
                </div>
                {[
                  'New lead captured',
                  'Auto-reply sent',
                  'Pipeline updated',
                  'Meeting booked',
                  'Revenue +₹42K',
                ].map((line) => (
                  <div
                    key={line}
                    data-s10-flow
                    data-animate
                    className="mt-2 flex items-center gap-2 rounded-lg border border-[#EEF2F6] px-3 py-2 text-sm text-[#374151]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {line}
                  </div>
                ))}
              </CrmShell>
            </div>

            {/* Final ecosystem */}
            <div
              data-journey-final-visual
              className="pointer-events-none absolute inset-6 flex flex-col items-center justify-center opacity-0 sm:inset-8 lg:inset-10"
            >
              <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white/80 p-8 shadow-xl backdrop-blur-sm">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 rounded-full border-2 border-dashed border-emerald-300/60" />
                </div>
                <div className="relative flex flex-wrap justify-center gap-2">
                  {FINAL_LABELS.map((label) => (
                    <span
                      key={label}
                      data-final-label
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 opacity-0"
                    >
                      ✓ {label}
                    </span>
                  ))}
                </div>
                <p className="relative mt-8 text-center text-lg font-bold text-[#111827]">
                  One connected ecosystem
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
