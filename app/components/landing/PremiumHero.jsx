'use client';

import { useState } from 'react';
import { Anton } from 'next/font/google';
import { ArrowUpRight, MessageCircle, MousePointer2 } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, GmailIcon } from '@/app/automation/components/chat/BrandIcons';
import { MetaIcon, ZapierIcon, ShopifyIcon, SlackColorIcon } from '@/app/components/pricing/IntegrationBrandIcons';

const anton = Anton({ subsets: ['latin'], weight: '400' });

// Bare platform logos (no card chrome), cascading right-and-down with only a
// slight lean. Real brands keep their real color in both themes; "Web Chat"
// has no official brand mark, so it inverts with the theme like plain text
// would.
const LEFT_CARDS = [
  { key: 'meta', left: '5%', top: '5.2%', rotate: -6, color: '#1877F2', icon: <MetaIcon className="h-full w-full" /> },
  { key: 'web', left: '12.8%', top: '11.2%', rotate: -5, color: '#111827', darkColor: '#F5F6F2', icon: <MessageCircle className="h-full w-full" /> },
  { key: 'wa', left: '20.6%', top: '17.2%', rotate: -4, color: '#25D366', icon: <WhatsAppIcon className="h-full w-full" /> },
  { key: 'ig', left: '28.4%', top: '21.2%', rotate: -2, color: '#E1306C', icon: <InstagramIcon className="h-full w-full" /> },
  // Fans back the other way, so the stack opens out at the end. Gmail's mark
  // is already multi-color (no currentColor), so it needs no color override.
  { key: 'email', left: '36.2%', top: '24.2%', rotate: 24, color: null, icon: <GmailIcon className="h-full w-full" /> },
];

// Small motion marks scattered around the composition.
function Spark({ left, top, size = '3cqw', rotate = 0, color = '#1D4B3E' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="absolute transition-[stroke] duration-500"
      style={{ left, top, width: size, height: size, transform: `rotate(${rotate}deg)` }}
      fill="none"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M13 2.5 10 8" />
      <path d="M20.5 6.5 15.5 10" />
      <path d="M22 15.5l-5.5-1.5" />
    </svg>
  );
}

// Bare integration logos, same treatment as the left cluster. Same tools as the pricing page's integrations list; some of them
// are connected per client requirement (see `onRequest` in pricingData.js).
const RIGHT_CARDS = [
  { key: 'zapier', left: '0%', top: '0%', rotate: -6, color: '#FF4A00', icon: <ZapierIcon className="h-full w-full" /> },
  // Slack's real 4-color mark is baked into its own paths, not currentColor.
  { key: 'slack', left: '30%', top: '16%', rotate: -3, color: null, icon: <SlackColorIcon className="h-full w-full" /> },
  { key: 'shopify', left: '60%', top: '32%', rotate: 8, color: '#95BF47', icon: <ShopifyIcon className="h-full w-full" /> },
];

/**
 * Card-stack hero, desktop/tablet composition (>=768px). Positions are
 * hero-relative percentages measured off the approved mockup.
 */
function LeftCardStack({ dark }) {
  return (
    <>
      {LEFT_CARDS.map((c, i) => (
        <div
          key={c.key}
          className="absolute lfg-card-float flex items-center justify-center"
          style={{ left: c.left, top: c.top, width: '8.6cqw', height: '13.5cqw', animationDelay: `${i * 0.18}s` }}
        >
          <div
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)] transition-colors duration-500"
            style={{
              width: '7cqw',
              height: '7cqw',
              color: (dark && c.darkColor) || c.color || undefined,
              transform: `rotate(${c.rotate}deg)`,
            }}
          >
            {c.icon}
          </div>
        </div>
      ))}
    </>
  );
}

function RightCardStack() {
  return (
    <div className="absolute inset-0">
      {RIGHT_CARDS.map((c, i) => (
        <div
          key={c.key}
          className="absolute flex items-center justify-center lfg-card-float"
          style={{ left: c.left, top: c.top, width: '40%', height: '62%', animationDelay: `${i * 0.18}s` }}
        >
          <div
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.3)]"
            style={{ width: '70%', height: '70%', color: c.color, transform: `rotate(${c.rotate}deg)` }}
          >
            {c.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

function DesktopHero({ onGetStarted, onBookDemo }) {
  const [isDark, setIsDark] = useState(true);

  return (
    <div
      onClick={() => setIsDark((v) => !v)}
      className={`relative mx-auto hidden max-w-[1200px] cursor-pointer overflow-hidden rounded-[32px] border-[6px] border-black transition-colors duration-500 md:block sm:border-[8px] ${
        isDark ? 'bg-[#0B1712]' : 'bg-[#F2F1EC]'
      }`}
      style={{ containerType: 'inline-size' }}
    >
      <div className="relative w-full" style={{ aspectRatio: '1662 / 785' }}>
        {/* Left card cluster — portrait cards cascading right-and-down */}
        <LeftCardStack dark={isDark} />

        {/* Headline — staggered lines at the mockup's measured offsets, with
            "Leads" set largest and the other two stepped down from it. */}
        <h1
          className={`${anton.className} absolute leading-[0.85] tracking-tight transition-colors duration-500 ${
            isDark ? 'text-[#F5F6F2]' : 'text-[#111111]'
          }`}
          style={{ left: '40%', top: '14.6%', width: '46%', fontSize: '8.1cqw' }}
        >
          Leads
        </h1>
        <h1
          className={`${anton.className} absolute leading-[0.85] tracking-[-0.01em] transition-colors duration-500 ${
            isDark ? 'text-[#F5F6F2]' : 'text-[#111111]'
          }`}
          style={{ left: '50.7%', top: '33.8%', width: '46%', fontSize: '6.3cqw' }}
        >
          That turn
        </h1>
        <h1
          className={`${anton.className} absolute leading-[0.85] tracking-tight transition-colors duration-500`}
          style={{
            left: '41%',
            top: '48.4%',
            width: '56%',
            fontSize: '6.8cqw',
            color: isDark ? '#34D399' : '#1D4B3E',
            textShadow: isDark
              ? '0 0 18px #0B1712, 0 0 18px #0B1712, 0 0 30px #0B1712'
              : '0 0 18px #F2F1EC, 0 0 18px #F2F1EC, 0 0 30px #F2F1EC',
          }}
        >
          Into Revenue
        </h1>

        {/* Cursor — below the card stack, with a motion spark to its left */}
        <MousePointer2
          className={`absolute h-[2.7cqw] w-[2.7cqw] drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-colors duration-500 ${
            isDark ? 'fill-white text-white' : 'fill-black text-black'
          }`}
          style={{ left: '15.5%', top: '42.9%', transform: 'rotate(-2deg)' }}
        />
        <Spark left="12.8%" top="39.5%" size="3cqw" rotate={240} color={isDark ? '#34D399' : '#1D4B3E'} />

        {/* Toggle — a real dark-mode switch, scoped to this rectangle only */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsDark((v) => !v);
          }}
          aria-pressed={isDark}
          aria-label="Toggle preview theme"
          className="absolute flex items-center rounded-full bg-[#1D4B3E] shadow-[0_10px_22px_rgba(29,75,62,0.35)] transition-colors duration-300 active:scale-95"
          style={{ left: '62.5%', top: '17%', width: '9.6cqw', height: '5.4cqw', padding: '0.7cqw', transform: 'rotate(-16deg)' }}
        >
          <span
            className="aspect-square h-full rounded-full bg-white transition-transform duration-300 ease-out"
            style={{ transform: isDark ? 'translateX(0)' : 'translateX(4.2cqw)' }}
          />
        </button>
        <Spark left="72.6%" top="13.2%" size="3cqw" color={isDark ? '#34D399' : '#1D4B3E'} />

        {/* Right icon cluster — beside the lower headline */}
        <div className="absolute" style={{ left: '78%', top: '50%', width: '21%', height: '25%' }}>
          <RightCardStack />
        </div>
        <Spark left="96.9%" top="53.5%" size="2.6cqw" rotate={-30} color={isDark ? '#34D399' : '#1D4B3E'} />

        {/* Subtext */}
        <p
          className={`absolute text-center leading-snug transition-colors duration-500 ${
            isDark ? 'text-[#9CA3A0]' : 'text-[#57594F]'
          }`}
          style={{ left: '50%', top: '67.5%', width: 'min(40cqw, 560px)', transform: 'translateX(-50%)', fontSize: '1.5cqw' }}
        >
          The first business to reply wins the deal. LeadForGrow makes sure it's always you.
        </p>

        {/* CTA + demo link */}
        <div
          className="absolute flex flex-col items-center gap-3"
          style={{ left: '50%', top: '80.9%', transform: 'translateX(-50%)' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGetStarted?.();
            }}
            className={`flex items-center justify-between gap-6 rounded-full pl-8 pr-2 font-bold transition-colors duration-300 hover:-translate-y-0.5 ${
              isDark ? 'bg-white text-[#0B1712]' : 'bg-black text-white'
            }`}
            style={{ width: 'clamp(300px, 27.4cqw, 400px)', height: 'clamp(58px, 5.4cqw, 72px)', fontSize: 'clamp(16px, 1.7cqw, 18px)' }}
          >
            Get started
            <span
              className="flex shrink-0 items-center justify-center rounded-full transition-colors duration-300"
              style={{ width: 'clamp(44px, 5.2cqw, 52px)', height: 'clamp(44px, 5.2cqw, 52px)', backgroundColor: isDark ? '#34D399' : '#1D4B3E' }}
            >
              <ArrowUpRight className={`-mt-1 h-1/2 w-1/2 transition-colors duration-300 ${isDark ? 'text-[#0B1712]' : 'text-white'}`} />
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBookDemo?.();
            }}
            className={`text-[13px] font-semibold underline underline-offset-4 transition-colors duration-300 ${
              isDark ? 'text-[#9CA3A0] hover:text-white' : 'text-[#57594F] hover:text-[#111111]'
            }`}
          >
            or book a live demo
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileHero({ onGetStarted, onBookDemo }) {
  const [isDark, setIsDark] = useState(true);

  const mobileCards = [
    { key: 'meta', left: '0%', top: '6%', rotate: -10, color: '#1877F2', icon: <MetaIcon className="h-full w-full" /> },
    { key: 'web', left: '19%', top: '0%', rotate: -5, color: '#111827', darkColor: '#F5F6F2', icon: <MessageCircle className="h-full w-full" /> },
    { key: 'wa', left: '38%', top: '4%', rotate: 3, color: '#25D366', icon: <WhatsAppIcon className="h-full w-full" /> },
    { key: 'ig', left: '57%', top: '2%', rotate: 8, color: '#E1306C', icon: <InstagramIcon className="h-full w-full" /> },
    { key: 'email', left: '76%', top: '8%', rotate: 16, color: null, icon: <GmailIcon className="h-full w-full" /> },
  ];

  return (
    <div
      onClick={() => setIsDark((v) => !v)}
      className={`relative mx-auto cursor-pointer overflow-hidden rounded-[28px] border-[5px] border-black px-6 py-10 transition-colors duration-500 md:hidden ${
        isDark ? 'bg-[#0B1712]' : 'bg-[#F2F1EC]'
      }`}
    >
      {/* Toggle — same scoped dark-mode switch as desktop, shrunk down */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDark((v) => !v);
        }}
        aria-pressed={isDark}
        aria-label="Toggle preview theme"
        className="absolute right-5 top-5 flex h-6 w-11 items-center rounded-full bg-[#1D4B3E] p-1 transition-colors duration-300 active:scale-95"
      >
        <span
          className="aspect-square h-full rounded-full bg-white transition-transform duration-300 ease-out"
          style={{ transform: isDark ? 'translateX(0)' : 'translateX(1.25rem)' }}
        />
      </button>

      <h1
        className={`${anton.className} text-center leading-[0.85] tracking-tight transition-colors duration-500 ${isDark ? 'text-[#F5F6F2]' : 'text-[#111111]'}`}
        style={{ fontSize: '15vw' }}
      >
        Leads
      </h1>
      <h1
        className={`${anton.className} mt-1 text-center leading-[0.85] tracking-tight transition-colors duration-500 ${isDark ? 'text-[#F5F6F2]' : 'text-[#111111]'}`}
        style={{ fontSize: '8vw' }}
      >
        That turn
      </h1>
      <h1
        className={`${anton.className} text-center leading-[0.85] tracking-tight transition-colors duration-500`}
        style={{ fontSize: '15vw', color: isDark ? '#34D399' : '#1D4B3E' }}
      >
        Into Revenue
      </h1>

      <div className="relative mx-auto mt-8 h-[100px] w-[260px]">
        {mobileCards.map((c, i) => (
          <div
            key={c.key}
            className="absolute flex h-[70px] w-[70px] items-center justify-center drop-shadow-[0_8px_14px_rgba(0,0,0,0.3)] transition-colors duration-500 lfg-card-float"
            style={{
              left: c.left,
              top: c.top,
              color: (isDark && c.darkColor) || c.color || undefined,
              transform: `rotate(${c.rotate}deg)`,
              animationDelay: `${i * 0.18}s`,
            }}
          >
            {c.icon}
          </div>
        ))}
      </div>

      <p
        className={`mx-auto mt-8 max-w-[320px] text-center text-[15px] leading-snug transition-colors duration-500 ${
          isDark ? 'text-[#9CA3A0]' : 'text-[#57594F]'
        }`}
      >
        The first business to reply wins the deal. LeadForGrow makes sure it's always you.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGetStarted?.();
          }}
          className={`flex w-full max-w-[320px] items-center justify-between gap-4 rounded-full py-4 pl-7 pr-2 text-base font-bold transition-colors duration-300 ${
            isDark ? 'bg-white text-[#0B1712]' : 'bg-black text-white'
          }`}
        >
          Get started
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-300"
            style={{ backgroundColor: isDark ? '#34D399' : '#1D4B3E' }}
          >
            <ArrowUpRight className={`-mt-0.5 h-5 w-5 transition-colors duration-300 ${isDark ? 'text-[#0B1712]' : 'text-white'}`} />
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBookDemo?.();
          }}
          className={`text-[13px] font-semibold underline underline-offset-4 transition-colors duration-300 ${
            isDark ? 'text-[#9CA3A0] hover:text-white' : 'text-[#57594F] hover:text-[#111111]'
          }`}
        >
          or book a live demo
        </button>
      </div>
    </div>
  );
}

export default function PremiumHero({ onGetStarted, onBookDemo }) {
  return (
    <section className="bg-white px-3 pt-24 sm:px-4 sm:pt-28">
      <DesktopHero onGetStarted={onGetStarted} onBookDemo={onBookDemo} />
      <MobileHero onGetStarted={onGetStarted} onBookDemo={onBookDemo} />
    </section>
  );
}
