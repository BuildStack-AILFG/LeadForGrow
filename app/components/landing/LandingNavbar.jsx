'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  Menu,
  User,
  X,
  LayoutGrid,
  Workflow,
  Bot,
  Inbox,
  Plug,
  CreditCard,
  Rocket,
  Briefcase,
  UtensilsCrossed,
  Home,
  HeartPulse,
  GraduationCap,
  Building2,
  BookOpen,
  LifeBuoy,
  Mail,
} from 'lucide-react';

const productItems = [
  { label: 'CRM & Pipeline', desc: 'Every lead in one place, zero spreadsheet chaos', href: '/products/crm', icon: LayoutGrid },
  { label: 'Automation', desc: 'No-code workflows across WhatsApp, email & CRM', href: '/products/automation', icon: Workflow },
  { label: 'AI Assistant', desc: 'AI trained on your business, not generic chat', href: '/products/ai', icon: Bot },
  { label: 'Unified Inbox', desc: 'WhatsApp, Instagram & Email in one inbox', href: '/products/unified-inbox', icon: Inbox },
  { label: 'Integrations', desc: 'Connect the tools you already use', href: '/products/integrations', icon: Plug },
  { label: 'Pricing', desc: 'Simple, transparent pricing for every stage', href: '/pricing', icon: CreditCard },
];

const solutionItems = [
  { label: 'Startups', desc: 'Move fast without a sales ops team', href: '/solutions/startups', icon: Rocket },
  { label: 'Agencies', desc: 'White-label CRM for client management', href: '/solutions/agencies', iconSrc: '/images/interakt-clone/nav-icons/marketing-agency.svg' },
  { label: 'Restaurants', desc: 'Reservations, catering & delivery enquiries', href: '/solutions/restaurants', iconSrc: '/images/interakt-clone/nav-icons/restaurants-food.svg' },
  { label: 'Real Estate', desc: 'Qualify enquiries and nurture buyers', href: '/solutions/real-estate', iconSrc: '/images/interakt-clone/nav-icons/real-estate.svg' },
  { label: 'Healthcare', desc: 'Appointment booking and patient follow-up', href: '/solutions/healthcare', iconSrc: '/images/interakt-clone/nav-icons/health-wellness.svg' },
  { label: 'Education', desc: 'Admissions enquiry management & nurture', href: '/solutions/education', iconSrc: '/images/interakt-clone/nav-icons/edutech.svg' },
  { label: 'Enterprise', desc: 'Security, SSO, and dedicated support', href: '/solutions/enterprise', icon: Building2 },
];

/**
 * Matches Interakt's real Solutions mega-menu shape exactly: a "By Channels"
 * tab strip on the left (their real menu also has RCS/Voice tabs — dropped
 * here since LeadForGrow doesn't support RCS or AI voice calling, and
 * keeping the tab with no honest content behind it would be a dead end) that
 * swaps the feature list in the middle column, plus a "By Industry" column
 * and a promo panel — scraped live via `data-lzl-src`/DOM inspection of
 * interakt.shop's own nested-menu markup.
 */
const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', iconSrc: '/images/interakt-clone/nav-icons/channel-whatsapp.svg' },
  { key: 'instagram', label: 'Instagram', iconSrc: '/images/interakt-clone/nav-icons/channel-instagram.svg' },
];

const CHANNEL_FEATURES = {
  whatsapp: [
    { label: 'No Code Chatbot Builder', href: '/products/chatbot' },
    { label: 'WhatsApp Business API', href: '/products/whatsapp-api' },
    { label: 'WhatsApp Forms', href: '/products/forms' },
    { label: 'Click to WhatsApp Ads', href: '/products/ads' },
    { label: 'WhatsApp Marketing', href: '/products/broadcasts' },
    { label: 'WhatsApp Automation', href: '/products/automation' },
    { label: 'WhatsApp CRM', href: '/products/crm' },
    { label: 'WhatsApp Commerce', href: '/products/commerce' },
    { label: 'WhatsApp Chat Widget', href: '/products/chat-widget' },
    { label: 'WhatsApp Notification Library', href: '/products/templates' },
  ],
  instagram: [
    { label: 'Instagram DMs', href: '/products/unified-inbox' },
    { label: 'Instagram Comments', href: '/products/unified-inbox' },
    { label: 'Instagram Automation', href: '/products/automation' },
  ],
};

const resourceItems = [
  { label: 'Blog', desc: 'Guides and playbooks for growing teams', href: '/blog', icon: BookOpen },
  { label: 'Help Center', desc: 'Docs, tours, and product guides', href: '/help', icon: LifeBuoy },
  { label: 'Contact Us', desc: 'Talk to our team', href: '/contact', icon: Mail },
];

const loggedInNav = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/automation' },
  { label: 'Leads', href: '/automation/leads' },
  { label: 'Blogs', href: '/blog' },
];

function NavDropdownTrigger({ children, isOpen }) {
  return (
    <button
      type="button"
      className="group inline-flex items-center gap-1 py-1 text-[14px] font-medium text-[#1a1a1a] hover:text-black transition-colors"
    >
      {children}
      <ChevronDown
        className={`h-3.5 w-3.5 text-[#1a1a1a]/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

function MegaMenu({ items, isOpen, columns = 2 }) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
      <div
        className={`grid gap-1 rounded-2xl border border-[#E2E8F0]/80 bg-white/95 backdrop-blur-md shadow-[0_16px_48px_rgba(15,23,42,0.14)] p-3 ${
          columns === 2 ? 'grid-cols-2 w-[520px]' : 'grid-cols-1 w-[280px]'
        }`}
      >
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-[#F0FDF4] transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 overflow-hidden">
              {item.iconSrc ? (
                <img src={item.iconSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-[#111827]">{item.label}</span>
              <span className="block text-[12px] leading-snug text-[#64748B]">{item.desc}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function SolutionsMegaMenu({ isOpen }) {
  const [activeChannel, setActiveChannel] = useState('whatsapp');
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
      <div className="grid grid-cols-[160px_220px_260px_180px] rounded-2xl border border-[#E2E8F0]/80 bg-white/95 backdrop-blur-md shadow-[0_16px_48px_rgba(15,23,42,0.14)] overflow-hidden">
        <div className="border-r border-[#F1F5F9] p-3">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">By Channels</p>
          {CHANNELS.map((ch) => (
            <button
              key={ch.key}
              type="button"
              onMouseEnter={() => setActiveChannel(ch.key)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                activeChannel === ch.key ? 'bg-emerald-50' : 'hover:bg-[#F8FAFC]'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
                <img src={ch.iconSrc} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="text-[13px] font-semibold text-[#111827]">{ch.label}</span>
            </button>
          ))}
        </div>

        <div className="border-r border-[#F1F5F9] p-3">
          {CHANNEL_FEATURES[activeChannel].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#F0FDF4] hover:text-[#111827]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="border-r border-[#F1F5F9] p-3">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">By Industry</p>
          <div className="max-h-[280px] overflow-y-auto">
            {solutionItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-[#F0FDF4]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded">
                  {item.iconSrc ? (
                    <img src={item.iconSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <item.icon className="h-3.5 w-3.5 text-emerald-700" strokeWidth={1.75} />
                  )}
                </span>
                <span className="text-[13px] font-medium text-[#374151]">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-white p-4">
          <div>
            <p className="text-[13px] font-bold leading-snug text-[#111827]">
              Looking for a use case outside this?
            </p>
            <a href="/contact" className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 underline underline-offset-2">
              Book a demo →
            </a>
          </div>
          <img
            src="/edited-photo.png"
            alt="LeadForGrow dashboard"
            className="mt-3 w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function LandingNavbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) {
      setIsLoggedIn(true);
      setUserId(id);
    }
  }, []);

  const profileHref = userId ? `/user/profile/${userId}` : '/login';

  const NavLink = ({ href, children, onClick }) => (
    <a
      href={href}
      onClick={onClick}
      className="inline-flex items-center py-1 text-[14px] font-medium text-[#1a1a1a] hover:text-black transition-colors"
    >
      {children}
    </a>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-5 sm:px-6">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 rounded-xl border border-white/70 bg-white/55 px-4 py-2.5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-5 lg:px-6">
        <a href="/" className="shrink-0 ml-5">
          <span className="landing-logo text-[17px] sm:text-[18px]">
            LeadForGrow<span className="text-[9px] align-super text-[#1a1a1a]/60">™</span>
          </span>
        </a>

        <nav className="hidden lg:flex flex-1 items-center justify-center gap-7 xl:gap-9">
          {isLoggedIn ? (
            loggedInNav.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))
          ) : (
            <>
              <NavLink href="/">Home</NavLink>
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('products')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <NavDropdownTrigger isOpen={openDropdown === 'products'}>Products</NavDropdownTrigger>
                <MegaMenu items={productItems} isOpen={openDropdown === 'products'} columns={2} />
              </div>
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('solutions')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <NavDropdownTrigger isOpen={openDropdown === 'solutions'}>Solutions</NavDropdownTrigger>
                <SolutionsMegaMenu isOpen={openDropdown === 'solutions'} />
              </div>
              <NavLink href="/pricing">Pricing</NavLink>
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('resources')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <NavDropdownTrigger isOpen={openDropdown === 'resources'}>Resources</NavDropdownTrigger>
                <MegaMenu items={resourceItems} isOpen={openDropdown === 'resources'} columns={1} />
              </div>
              <NavLink href="/contact">Contact</NavLink>
            </>
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <a
              href={profileHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-5 py-2 text-[14px] font-semibold text-white hover:bg-black transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </a>
          ) : (
            <>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2 text-[14px] font-medium text-[#1a1a1a] border border-[#E8E8E8] hover:bg-[#FAFAFA] transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-2 text-[14px] font-semibold text-white hover:bg-emerald-800 transition-colors"
              >
                Start free trial
              </a>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-[#1a1a1a] hover:bg-white/60 transition-colors"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden mx-auto mt-2 max-w-[1100px] max-h-[75vh] overflow-y-auto rounded-xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-lg p-4">
          <div className="space-y-1">
            {isLoggedIn ? (
              <>
                {loggedInNav.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] rounded-lg hover:bg-white/80"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <a
                  href={profileHref}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] text-white px-4 py-2.5 text-sm font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </a>
              </>
            ) : (
              <>
                <a href="/" className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>Home</a>

                {[
                  { key: 'products', label: 'Products', items: productItems },
                  { key: 'solutions', label: 'Solutions', items: solutionItems },
                  { key: 'resources', label: 'Resources', items: resourceItems },
                ].map((group) => (
                  <div key={group.key}>
                    <button
                      type="button"
                      onClick={() => setOpenMobileGroup(openMobileGroup === group.key ? null : group.key)}
                      className="flex w-full items-center justify-between px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]"
                    >
                      {group.label}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${openMobileGroup === group.key ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openMobileGroup === group.key &&
                      group.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          className="block px-3 py-2 text-sm text-[#374151] rounded-lg hover:bg-white/80"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </a>
                      ))}
                  </div>
                ))}

                <a href="/pricing" className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                <a href="/contact" className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>Contact</a>
                <div className="mt-3 flex gap-2 pt-3 border-t border-[#E8E8E8]">
                  <a href="/login" className="flex-1 text-center rounded-xl bg-white border border-[#E8E8E8] px-4 py-2.5 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Login</a>
                  <a href="/register" className="flex-1 text-center rounded-xl bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold" onClick={() => setIsMenuOpen(false)}>Start trial</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
