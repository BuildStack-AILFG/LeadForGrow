'use client';

import { useState } from 'react';
import { Webhook } from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, GmailIcon } from '@/app/automation/components/chat/BrandIcons';
import {
  MetaIcon, GoogleCalendarIcon, RazorpayIcon, StripeIcon, TwilioIcon, ZapierIcon, GoogleSheetsIcon,
  ShopifyIcon, HubSpotIcon, SalesforceIcon, CalendlyIcon, SlackIcon, ZohoIcon,
} from '@/app/components/pricing/IntegrationBrandIcons';
import { INTEGRATIONS } from '@/app/components/pricing/pricingData';

const ICONS = {
  whatsapp: WhatsAppIcon, instagram: InstagramIcon, email: GmailIcon, meta: MetaIcon, googleCalendar: GoogleCalendarIcon,
  razorpay: RazorpayIcon, stripe: StripeIcon, twilio: TwilioIcon, zapier: ZapierIcon, webhooks: Webhook,
  googleSheets: GoogleSheetsIcon, shopify: ShopifyIcon, hubspot: HubSpotIcon, salesforce: SalesforceIcon,
  calendly: CalendlyIcon, slack: SlackIcon, zoho: ZohoIcon,
};

/** What each integration does in LeadForGrow. Tools connected per client requirement get a neutral line. */
const DETAILS = {
  WhatsApp: ['Messaging', 'Chat, templates, broadcasts and flows on the official WhatsApp Business API.'],
  Instagram: ['Messaging', 'DMs and post comments in the inbox, with comment-to-DM automations.'],
  Gmail: ['Messaging', 'Send and receive from Gmail or any IMAP / SMTP mailbox, threaded per customer.'],
  'Meta Lead Ads': ['Lead sources', 'Leads from Facebook and Instagram lead forms arrive in your CRM as they are submitted.'],
  'Google Calendar': ['Scheduling', 'Booked meetings land on your calendar with the guest invited.'],
  Razorpay: ['Payments', 'Payment links on bills, marked paid automatically when the customer pays.'],
  Stripe: ['Payments', 'Connect your Stripe account for card payments.'],
  Twilio: ['Calling', 'Click-to-call and missed-call recovery through your Twilio account.'],
  Webhooks: ['Developer', 'Send leads in from any website or app, and start workflows from outside events.'],
};

const CATEGORIES = ['All', 'Messaging', 'Lead sources', 'Payments', 'Scheduling', 'Calling', 'Developer', 'Business apps'];
const TINTABLE = new Set(['whatsapp', 'instagram']);

export default function IntegrationDirectory() {
  const [cat, setCat] = useState('All');
  const items = INTEGRATIONS.map((i) => {
    const [category, text] = DETAILS[i.name] || ['Business apps', `Connect ${i.name} with LeadForGrow — set up for your workspace with our team.`];
    return { ...i, category, text };
  });
  const shown = cat === 'All' ? items : items.filter((i) => i.category === cat);

  return (
    <div>
      <div role="tablist" aria-label="Filter integrations" className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              cat === c ? 'bg-[#0B1712] text-white' : 'border border-[#E4E7E1] bg-white text-[#0B1712] hover:border-[#1D4B3E]/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => {
          const Icon = ICONS[i.icon] || Webhook;
          return (
            <li key={i.name} className="flex gap-4 rounded-xl border border-[#E4E7E1] bg-white p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F2]" style={{ color: i.color }}>
                <Icon className="h-6 w-6" size={24} {...(TINTABLE.has(i.icon) ? { colored: true } : {})} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#0B1712]">{i.name}</h3>
                  <span className="text-xs text-[#6B7280]">{i.category}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#4B5563]">{i.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
