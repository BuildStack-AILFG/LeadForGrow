'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Menu, User, X } from 'lucide-react';

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

const platformDropdown = [
  { label: 'CRM & Pipeline', href: '/products/crm' },
  { label: 'Unified Inbox', href: '/products/unified-inbox' },
  { label: 'AI Assistant', href: '/products/ai' },
  { label: 'Automation', href: '/products/automation' },
  { label: 'Integrations', href: '/products/integrations' },
  { label: 'Pricing', href: '/pricing' },
];

const solutionsDropdown = [
  { label: 'Startups', href: '/solutions/startups' },
  { label: 'Agencies', href: '/solutions/agencies' },
  { label: 'Real Estate', href: '/solutions/real-estate' },
  { label: 'Healthcare', href: '/solutions/healthcare' },
  { label: 'Education', href: '/solutions/education' },
  { label: 'Enterprise', href: '/solutions/enterprise' },
];

const loggedInNav = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/automation' },
  { label: 'Leads', href: '/automation/leads' },
  { label: 'Blogs', href: '/blog' },
];

function DropdownMenu({ items, isOpen }) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-0 pt-2 w-56 z-50">
      <div className="rounded-xl border border-[#E2E8F0]/80 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(15,23,42,0.1)] py-1.5 overflow-hidden">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="block px-4 py-2 text-sm font-medium text-[#374151] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function LandingNavbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
                onMouseEnter={() => setOpenDropdown('platform')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <NavDropdownTrigger isOpen={openDropdown === 'platform'}>Platform</NavDropdownTrigger>
                <DropdownMenu items={platformDropdown} isOpen={openDropdown === 'platform'} />
              </div>
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('solutions')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <NavDropdownTrigger isOpen={openDropdown === 'solutions'}>Solutions</NavDropdownTrigger>
                <DropdownMenu items={solutionsDropdown} isOpen={openDropdown === 'solutions'} />
              </div>
              <NavLink href="/pricing">Pricing</NavLink>
              <NavLink href="/blog">Resources</NavLink>
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
        <div className="lg:hidden mx-auto mt-2 max-w-[1100px] rounded-xl border border-white/70 bg-white/90 backdrop-blur-xl shadow-lg p-4">
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
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Platform</p>
                {platformDropdown.map((item) => (
                  <a key={item.label} href={item.href} className="block px-3 py-2 text-sm text-[#374151] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>{item.label}</a>
                ))}
                <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Solutions</p>
                {solutionsDropdown.map((item) => (
                  <a key={item.label} href={item.href} className="block px-3 py-2 text-sm text-[#374151] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>{item.label}</a>
                ))}
                <a href="/pricing" className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                <a href="/blog" className="block px-3 py-2 text-sm font-medium text-[#1a1a1a] rounded-lg hover:bg-white/80" onClick={() => setIsMenuOpen(false)}>Resources</a>
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
