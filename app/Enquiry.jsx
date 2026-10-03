'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Cookie, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { CONTACT_FORM_TOKEN, getFormSubmitUrl } from '@/lib/publicForms';
import { getConsentPayloadForForms, getConsentState } from '@/lib/consent/client';
import { ENGAGED_AFTER_SECONDS, hasScrolledEnough, shouldAutoOpen } from '@/lib/enquiryPopup';
import BookDemoModal, { openBookDemoPopup } from '@/app/components/landing/BookDemoModal';

// How long to leave a visitor alone. Remembered in localStorage (shared by every tab and later visit) as
// an expiry timestamp — it used to be sessionStorage, so every new tab/window re-opened the popup.
const DISMISS_STORAGE_KEY = 'lfg_enquiry_popup_dismissed_until';
const SUBMITTED_STORAGE_KEY = 'lfg_enquiry_form_submitted_until';
const DISMISS_DAYS = 7;
const SUBMITTED_DAYS = 30;
const WHATSAPP_URL = 'https://wa.me/918810873052?text=Hi%20LeadForGrow%2C%20I%20would%20like%20to%20know%20more.';

/** True while this visitor is still inside a "don't show again until" window. Never throws (storage can be blocked). */
function isSnoozed(key) {
  if (typeof window === 'undefined') return false;
  try {
    const until = Number(localStorage.getItem(key));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function snoozeFor(key, days) {
  try {
    localStorage.setItem(key, String(Date.now() + days * 24 * 60 * 60 * 1000));
  } catch {
    /* storage blocked — the popup may reappear next time, acceptable */
  }
}

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

const MENU_ITEMS = [
  { id: 'form', label: 'Contact form', icon: 'mail' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { id: 'demo', label: 'Book a demo', icon: 'phone' },
  { id: 'cookies', label: 'Cookie settings', icon: 'cookie' },
];

// Sign-in / account-recovery flows: a sales popup here is just friction.
const AUTH_PATHS = [
  '/login', '/register', '/forgot-password', '/reset-password', '/rotate-password',
  '/two-factor', '/verify-email', '/session-expired', '/account-locked', '/invite',
];

export default function LeadForGrowWidget({ onBookDemo }) {
  const pathname = usePathname();
  // This is a MARKETING widget mounted in the root layout, so it must stay out of the logged-in apps,
  // customer-facing pages (/s/ sites, chatbot iframe) and the editor. `hidden` has to suppress the
  // auto-open timer and the modal too, not just the floating launcher button.
  const hidden =
    pathname.startsWith('/automation') ||
    pathname.startsWith('/agency') ||
    pathname.startsWith('/lfgadmin') ||
    pathname.startsWith('/editor') ||
    AUTH_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/s/') ||
    pathname.includes('/chatbot-iframe');

  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => isSnoozed(SUBMITTED_STORAGE_KEY));
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [consentDecided, setConsentDecided] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setSuccess(false);
    snoozeFor(DISMISS_STORAGE_KEY, DISMISS_DAYS);
  }, []);

  // 1) "Engaged" = the visitor has really been reading: ENGAGED_AFTER_SECONDS of VISIBLE time, or scrolled
  //    half the page. (It used to pop 10 s after load — before they'd seen anything.)
  useEffect(() => {
    if (hidden || engaged) return undefined;

    let visibleSeconds = 0;
    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return; // background tabs don't count
      visibleSeconds += 1;
      if (visibleSeconds >= ENGAGED_AFTER_SECONDS) setEngaged(true);
    }, 1000);

    const onScroll = () => {
      if (hasScrolledEnough({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        docHeight: document.documentElement.scrollHeight,
      })) setEngaged(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearInterval(tick);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hidden, engaged]);

  // 2) Never stack on top of the cookie banner: wait until the visitor has answered it.
  useEffect(() => {
    const sync = () => setConsentDecided(getConsentState() !== null);
    sync();
    window.addEventListener('lfg-consent-changed', sync);
    return () => window.removeEventListener('lfg-consent-changed', sync);
  }, []);

  // 3) Open — at most once per page load, and never inside a snooze window.
  useEffect(() => {
    const open = shouldAutoOpen({
      engaged,
      consentDecided,
      hidden,
      snoozed: isSnoozed(DISMISS_STORAGE_KEY) || isSnoozed(SUBMITTED_STORAGE_KEY),
      isSubmitted,
      formOpen,
      menuOpen,
      alreadyAutoOpened: autoOpened,
    });
    if (!open) return undefined;
    // small pause so it doesn't land in the same instant as the cookie choice
    const t = setTimeout(() => { setAutoOpened(true); setFormOpen(true); }, 1200);
    return () => clearTimeout(t);
  }, [engaged, consentDecided, hidden, isSubmitted, formOpen, menuOpen, autoOpened]);

  useEffect(() => {
    if (!formOpen || hidden) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeForm();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [formOpen, hidden, closeForm]);

  const handleBookDemo = () => {
    setMenuOpen(false);
    if (onBookDemo) {
      onBookDemo();
      return;
    }
    const popup = openBookDemoPopup();
    if (popup) {
      popup.focus();
      return;
    }
    setIsBookDemoOpen(true);
  };

  const handleMenuAction = (id) => {
    setMenuOpen(false);

    if (id === 'form') {
      setFormOpen(true);
      return;
    }
    if (id === 'whatsapp') {
      window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    if (id === 'demo') {
      handleBookDemo();
      return;
    }
    if (id === 'cookies') {
      window.dispatchEvent(new CustomEvent('lfg-open-cookie-settings'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData(e.target);
    const payload = {
      token: CONTACT_FORM_TOKEN,
      name: formData.get('name')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      phone: formData.get('phone')?.toString().trim(),
      message: formData.get('message')?.toString().trim() || '',
      serviceInterest: 'Website Enquiry Widget',
      ...getConsentPayloadForForms(),
    };

    try {
      const resp = await fetch(getFormSubmitUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await resp.json();

      if (res.success) {
        setIsSubmitted(true);
        setSuccess(true);
        snoozeFor(SUBMITTED_STORAGE_KEY, SUBMITTED_DAYS);
        e.target.reset();
        setTimeout(() => setFormOpen(false), 3000);
      } else {
        toast.error(res.error || 'Failed to send. Please try again.');
      }
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderMenuIcon = (icon) => {
    if (icon === 'whatsapp') {
      return <WhatsAppLogo className="h-6 w-6" />;
    }
    if (icon === 'mail') {
      return (
        <span className="flex h-9 w-9 items-center justify-center text-emerald-700">
          <Mail className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    }
    if (icon === 'phone') {
      return (
        <span className="flex h-9 w-9 items-center justify-center text-emerald-700">
          <Phone className="h-5 w-5" strokeWidth={2} />
        </span>
      );
    }
    return (
      <span className="flex h-9 w-9 items-center justify-center text-emerald-700">
        <Cookie className="h-5 w-5" strokeWidth={2} />
      </span>
    );
  };

  return (
    <>
      {!hidden && (
      <>
      {/* Help hub — bottom right */}
      <div className="fixed bottom-6 right-5 z-[90] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
        {menuOpen && (
          <div className="w-[min(100vw-2.5rem,300px)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)]">
            <div className="border-b border-[#E2E8F0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Need help?</p>
              <p
                className="mt-1 text-[17px] font-bold tracking-tight text-[#111827]"
                style={{ fontFamily: 'var(--font-plus-jakarta)' }}
              >
                Talk to LeadForGrow
              </p>
            </div>
            <ul className="py-1">
              {MENU_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleMenuAction(item.id)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-[#111827] transition-colors hover:bg-[#FAFDFA]"
                  >
                    {renderMenuIcon(item.icon)}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close help menu' : 'Open help menu'}
          aria-expanded={menuOpen}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111827] text-white shadow-[0_8px_28px_rgba(15,23,42,0.22)] transition-transform hover:scale-105 hover:bg-black"
        >
          {menuOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <MessageCircle className="h-6 w-6" strokeWidth={2} />}
        </button>
      </div>
      </>
      )}

      {/* Contact form modal */}
      {formOpen && !hidden && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[#111827]/50 backdrop-blur-sm"
            onClick={closeForm}
            aria-label="Close contact form"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
            className="relative flex max-h-[min(640px,92dvh)] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl"
          >
            <div className="relative shrink-0 border-b border-emerald-100 bg-gradient-to-r from-[#FAFDFA] to-white px-6 py-5">
              <button
                type="button"
                onClick={closeForm}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#111827]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Get in touch</p>
              <h3
                id="enquiry-title"
                className="mt-1 pr-8 text-xl font-extrabold tracking-tight text-[#111827]"
                style={{ fontFamily: 'var(--font-plus-jakarta)' }}
              >
                Contact Us
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">Share your details and we&apos;ll get back to you soon.</p>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {success ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-2xl">
                    ✅
                  </div>
                  <h4 className="text-lg font-bold text-[#111827]">Thank you!</h4>
                  <p className="mt-2 text-sm text-[#64748B]">We&apos;ll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    required
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <textarea
                    name="message"
                    placeholder="How can we help?"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full rounded-xl bg-[#111827] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSending ? 'Sending...' : 'Submit Enquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <BookDemoModal open={isBookDemoOpen} onClose={() => setIsBookDemoOpen(false)} />
    </>
  );
}
