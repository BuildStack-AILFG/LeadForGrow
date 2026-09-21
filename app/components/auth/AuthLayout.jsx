'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { AUTH, BRAND } from '@/lib/marketing/designTokens';

const PANELS = {
  login: {
    headline: 'Pick up exactly where you left off.',
    sub: 'Your pipeline, inbox, and automations — synced and ready.',
    features: ['Real-time lead sync', 'Team activity feed', 'One-click follow-ups'],
    gradient: 'from-[#122e26] via-[#163c32] to-[#0d2620]',
    accent: 'text-[#8FC4AE]',
  },
  register: {
    headline: 'Turn enquiries into revenue — automatically.',
    sub: 'Join teams who respond in minutes, not days.',
    features: ['Free 14-day trial', 'No credit card required', 'Setup in under 10 minutes'],
    gradient: 'from-[#064E3B] via-[#163c32] to-[#122e26]',
    accent: 'text-[#BAE0CF]',
  },
  forgot: {
    headline: 'We\'ll get you back in.',
    sub: 'Secure password recovery with email verification.',
    features: ['Encrypted reset links', 'Links expire in 1 hour', '24/7 account support'],
    gradient: 'from-slate-900 via-[#0d2620] to-slate-900',
    accent: 'text-[#8FC4AE]',
  },
  verify: {
    headline: 'One more step to secure your account.',
    sub: 'Email verification keeps your workspace safe.',
    features: ['Prevents unauthorized access', 'Enables team invites', 'Unlocks full platform'],
    gradient: 'from-[#0d2620] via-[#163c32] to-[#122e26]',
    accent: 'text-[#8FC4AE]',
  },
  magic: {
    headline: 'Sign in without a password.',
    sub: 'Magic links are secure, single-use, and expire quickly.',
    features: ['No password to remember', 'Works on any device', 'Enterprise-grade security'],
    gradient: 'from-[#163c32] via-[#122e26] to-cyan-950',
    accent: 'text-cyan-300',
  },
  invite: {
    headline: 'You\'ve been invited to collaborate.',
    sub: 'Accept your invite to join the team workspace.',
    features: ['Role-based permissions', 'Shared pipeline access', 'Team inbox included'],
    gradient: 'from-[#122e26] via-green-900 to-[#0d2620]',
    accent: 'text-green-300',
  },
  twofa: {
    headline: 'Extra protection for your account.',
    sub: 'Two-factor authentication adds a layer only you can unlock.',
    features: ['Authenticator app support', 'Backup codes provided', 'Required for admins'],
    gradient: 'from-slate-900 via-[#0d2620] to-slate-900',
    accent: 'text-[#8FC4AE]',
  },
  locked: {
    headline: 'Account temporarily locked.',
    sub: 'Too many failed attempts. Contact support or wait 30 minutes.',
    features: ['Automatic unlock after cooldown', 'Support can assist', 'Your data remains safe'],
    gradient: 'from-red-950 via-slate-900 to-[#0d2620]',
    accent: 'text-red-300',
  },
  expired: {
    headline: 'Your session has ended.',
    sub: 'Sign in again to continue where you left off.',
    features: ['Sessions expire for security', 'Unsaved work is preserved', 'Quick re-authentication'],
    gradient: 'from-amber-950 via-slate-900 to-[#0d2620]',
    accent: 'text-amber-300',
  },
};

export function AuthIllustrationPanel({ variant = 'login' }) {
  const panel = PANELS[variant] || PANELS.login;

  return (
    <div className={`hidden lg:flex relative overflow-hidden bg-gradient-to-br ${panel.gradient} flex-col justify-between p-12 xl:p-16`}>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-[15%] right-[10%] w-72 h-72 rounded-full bg-[#8FC4AE]/20 blur-3xl" />
        <div className="absolute bottom-[20%] left-[5%] w-96 h-96 rounded-full bg-[#1D4B3E]/10 blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Link href="/" className="relative z-10 inline-flex items-center gap-3">
        <img src="/image.png" alt="" className="w-11 h-11" />
        <span className="text-2xl font-bold text-white font-[family-name:var(--font-plus-jakarta)]">
          Lead<span className={panel.accent}>For</span>Grow
        </span>
      </Link>

      <div className="relative z-10 max-w-lg">
        <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-5 font-[family-name:var(--font-plus-jakarta)]">
          {panel.headline}
        </h2>
        <p className="text-lg text-[#BAE0CF]/80 mb-10 leading-relaxed">{panel.sub}</p>
        <ul className="space-y-4">
          {panel.features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-[#BAE0CF]/90 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-[#8FC4AE] shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-[#BAE0CF]/50">
        Trusted by agencies and growth teams across India
      </p>
    </div>
  );
}

export function AuthFormShell({ children, title, subtitle, backLink }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 min-h-screen lg:min-h-0">
      <div className="lg:hidden mb-10 flex items-center gap-3">
        <img src="/image.png" alt="" className="w-10 h-10" />
        <span className="text-xl font-bold font-[family-name:var(--font-plus-jakarta)]">
          Lead<span className="text-[#163c32]">For</span>Grow
        </span>
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-500">
        {backLink}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mb-2 font-[family-name:var(--font-plus-jakarta)]">{title}</h1>
          {subtitle && <p className="text-[#64748B] text-sm sm:text-base">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export { AUTH, BRAND };
