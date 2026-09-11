'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Youtube, Linkedin, Facebook } from 'lucide-react';
import { FOOTER_SECTIONS, FOOTER_SOCIAL, FOOTER_LEGAL } from '@/lib/marketing/footerLinks';
import { MARKETING } from '@/lib/marketing/designTokens';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';

const HIDE_PREFIXES = ['/automation', '/agency', '/s/', '/chatbot-iframe', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/magic-link', '/invite', '/two-factor', '/session-expired', '/account-locked', '/user/login', '/user/register'];

// Simple Icons "X" mark — lucide only ships the legacy bird glyph, so this is
// drawn by hand to match the real brand mark shown in the reference footer.
function XIcon({ className = '', style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  whatsapp: { Icon: WhatsAppIcon, color: '#25D366' },
  youtube: { Icon: Youtube, color: '#FF0000' },
  linkedin: { Icon: Linkedin, color: '#0A66C2' },
  x: { Icon: XIcon, color: '#000000' },
  facebook: { Icon: Facebook, color: '#1877F2' },
};

export default function EnterpriseFooter({ forceShow = false }) {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (!forceShow && HIDE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <footer className="bg-[#1D4B3E] text-white">
      <div className={`${MARKETING.containerWide} py-14 lg:py-16`}>
        {/* Top: brand block + link columns */}
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <img src="/image.png" alt="" className="h-9 w-10 object-contain brightness-0 invert" />
              <span className="text-xl font-bold font-[family-name:var(--font-plus-jakarta)] text-white">
                LeadForGrow
              </span>
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              The revenue operating system for teams who refuse to let leads slip through the cracks.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.id}>
                <h3 className="mb-4 text-sm font-bold text-white">{section.title}</h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: copyright + legal + social */}
        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs text-white/60">© {year} LeadForGrow. All rights reserved.</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {FOOTER_LEGAL.map((l) => (
                <Link key={l.href} href={l.href} className="text-xs text-white/60 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {FOOTER_SOCIAL.map((s) => {
              const entry = SOCIAL_ICONS[s.id];
              if (!entry) return null;
              const { Icon, color } = entry;
              return (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition-transform hover:scale-105"
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
