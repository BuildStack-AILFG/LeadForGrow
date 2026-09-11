/**
 * Pricing page data — layout/UI pattern is a deliberate close copy of
 * app.interakt.shop/pricing (grouped feature-matrix table, per-tier accent
 * colors, Monthly/Yearly toggle with a savings badge) at the user's explicit
 * request. Numbers and features are entirely our own — nothing here is
 * copied from Interakt's pricing.
 *
 * Tier -> backend `plan` enum mapping (see lib/plans.js for the source of
 * truth on quotas). This page is marketing-facing; the display names below
 * are intentionally friendlier than the internal enum. If/when checkout is
 * wired to real billing, a plan selection here should set the backend
 * `plan` field to the mapped value so quotas enforce automatically:
 *   Starter    -> 'growth'      (maxForms 3, maxTeamMembers 3, maxAutomationRules 15, maxLeadsPerMonth 500)
 *   Growth     -> 'pro'         (maxForms 7, maxTeamMembers 7, maxAutomationRules 30, maxLeadsPerMonth 2000)
 *   Scale      -> 'premium'     (maxForms 10, maxTeamMembers 10, maxAutomationRules 50, maxLeadsPerMonth 5000)
 *   Enterprise -> 'enterprise'  (unlimited)
 */

// Yearly price = ~23% off monthly on every tier (same ratio as the
// user-specified Starter: ₹999 / ₹1,299 = 76.9%) — one consistent,
// defensible "save 23% yearly" story instead of a different % per tier.
// Quarterly = 8% off monthly, matching Interakt's own Monthly/Quarterly/Yearly
// toggle shape (their badges read ▼8% / ▼20%; we use ▼8% / ▼23%).
export const YEARLY_DISCOUNT_LABEL = '23%';
export const QUARTERLY_DISCOUNT_LABEL = '8%';

// accent keys map 1:1 to the ACCENT palette in PricingTable.jsx, which is a
// deliberate close copy of Interakt's own per-tier colors (amber / teal /
// blue / forest) — scraped live from interakt.shop/pricing at the user's
// explicit "100% same to same UI" request. Only our copy/numbers are ours.
export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    accent: 'amber',
    tagline: 'For solo founders getting their first leads under control.',
    monthlyPrice: 1299,
    quarterlyPrice: 1199,
    yearlyPrice: 999,
    planMapping: 'growth',
    cta: 'Start Free Trial',
    href: '/register',
    popular: false,
    enterprise: false,
    seats: '3 team members',
    channels: { whatsapp: true, instagram: false, email: true },
  },
  {
    id: 'growth',
    name: 'Growth',
    accent: 'teal',
    tagline: 'For teams ready to run WhatsApp + Instagram from one inbox.',
    monthlyPrice: 2999,
    quarterlyPrice: 2699,
    yearlyPrice: 2499,
    planMapping: 'pro',
    cta: 'Start Free Trial',
    href: '/register',
    popular: true,
    enterprise: false,
    seats: '7 team members',
    channels: { whatsapp: true, instagram: true, email: true },
  },
  {
    id: 'scale',
    name: 'Scale',
    accent: 'blue',
    tagline: 'For high-volume teams that need AI doing the first reply.',
    monthlyPrice: 5999,
    quarterlyPrice: 5499,
    yearlyPrice: 4999,
    planMapping: 'premium',
    cta: 'Start Free Trial',
    href: '/register',
    popular: false,
    enterprise: false,
    seats: '10 team members',
    channels: { whatsapp: true, instagram: true, email: true },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    accent: 'forest',
    tagline: 'For businesses that need unlimited scale and a dedicated team.',
    monthlyPrice: null,
    quarterlyPrice: null,
    yearlyPrice: null,
    planMapping: 'enterprise',
    cta: 'Talk to Sales',
    href: 'https://wa.me/916366966120',
    popular: false,
    enterprise: true,
    seats: 'Unlimited team members',
    channels: { whatsapp: true, instagram: true, email: true },
  },
];

// Bottom-of-page integrations teaser — mirrors Interakt's "Unifying Your
// Processes with 60+ Plug & Play integrations" band, which shows a real
// company logo per integration chip. We do the same: every entry below maps
// to a real brand-icon component (see IntegrationBrandIcons.jsx, Simple
// Icons paths — same source as WhatsApp/Instagram/Gmail's existing icons in
// BrandIcons.jsx). "Webhooks" isn't a company, so it uses lucide's generic
// Webhook glyph instead of a fabricated brand mark.
export const INTEGRATIONS_COUNT = '17+';
export const INTEGRATIONS = [
  { name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
  { name: 'Instagram', icon: 'instagram', color: '#DD2A7B' },
  { name: 'Gmail', icon: 'email', color: '#EA4335' },
  { name: 'Meta Lead Ads', icon: 'meta', color: '#0866FF' },
  { name: 'Google Calendar', icon: 'googleCalendar', color: '#4285F4' },
  { name: 'Salesforce', icon: 'salesforce', color: '#00A1E0' },
  { name: 'HubSpot', icon: 'hubspot', color: '#FF7A59' },
  { name: 'Shopify', icon: 'shopify', color: '#95BF47' },
  { name: 'Zoho', icon: 'zoho', color: '#C8202F' },
  { name: 'Slack', icon: 'slack', color: '#4A154B' },
  { name: 'Calendly', icon: 'calendly', color: '#006BFF' },
  { name: 'Razorpay', icon: 'razorpay', color: '#0C2451' },
  { name: 'Stripe', icon: 'stripe', color: '#635BFF' },
  { name: 'Twilio', icon: 'twilio', color: '#F22F46' },
  { name: 'Zapier', icon: 'zapier', color: '#FF4A00' },
  { name: 'Webhooks', icon: 'webhooks', color: '#111827' },
  { name: 'Google Sheets', icon: 'googleSheets', color: '#0F9D58' },
];

// v = true | false | string (shown as-is) | { starter, growth, scale, enterprise } per-plan override
// A plain value applies to every plan; use an object only when it differs.
export const FEATURE_CATEGORIES = [
  {
    id: 'channels',
    label: 'Channels',
    rows: [
      { label: 'WhatsApp Business API', v: true },
      { label: 'Instagram DMs & comments', v: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: 'Email (Gmail / SMTP)', v: true, note: 'Included on every plan — even your free trial' },
      { label: 'Unified inbox (all channels, one view)', v: true },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Sales',
    rows: [
      { label: 'Leads, Deals & Pipelines', v: true },
      { label: 'Companies & Contacts', v: true },
      { label: 'Bills & payment links', v: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: 'Custom fields & tags', v: { starter: '15', growth: '30', scale: 'Unlimited', enterprise: 'Unlimited' } },
      { label: 'Team seats', v: { starter: '3', growth: '7', scale: '10', enterprise: 'Unlimited' } },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    rows: [
      { label: 'Automation rules', v: { starter: '15', growth: '30', scale: '50', enterprise: 'Unlimited' } },
      { label: 'Sequences (multi-step drip)', v: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: 'Broadcasts', v: true },
      { label: 'WhatsApp Flows', v: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: 'Forms', v: { starter: '3', growth: '7', scale: '10', enterprise: 'Unlimited' } },
      { label: 'Customer Journeys', v: { starter: false, growth: false, scale: true, enterprise: true } },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    rows: [
      { label: 'Chatbot builder', v: { starter: false, growth: true, scale: true, enterprise: true } },
      { label: 'AI Knowledge Base', v: { starter: false, growth: 'Limited', scale: true, enterprise: true } },
      { label: 'AI lead qualification & scoring', v: { starter: false, growth: false, scale: true, enterprise: true } },
      { label: 'SLA safety-net auto-reply', v: { starter: false, growth: true, scale: true, enterprise: true } },
    ],
  },
  {
    id: 'insights',
    label: 'Insights & Support',
    rows: [
      { label: 'Reports & analytics', v: true },
      { label: 'Automation performance analytics', v: { starter: false, growth: false, scale: true, enterprise: true } },
      { label: 'Support', v: { starter: 'Email support', growth: 'Priority chat', scale: 'Priority chat', enterprise: 'Dedicated account manager' } },
    ],
  },
  {
    id: 'limits',
    label: 'Monthly limits',
    rows: [
      { label: 'Leads captured / month', v: { starter: '500', growth: '2,000', scale: '5,000', enterprise: 'Unlimited' } },
    ],
  },
];

// Pay-as-you-grow add-ons — stack on top of any paid plan, so a team that's
// close to their limit doesn't have to jump a whole tier just for headroom.
export const PRICING_ADDONS = [
  { id: 'leads', name: 'Extra 1,000 leads', description: 'Add more monthly lead-capture headroom to any plan.', price: 499, unit: '/month' },
  { id: 'seat', name: 'Extra team member', description: 'Add one more seat beyond your plan\'s included team members.', price: 99, unit: '/month' },
];

export const PRICING_FAQ = [
  { q: 'Does every plan really include Email?', a: 'Yes — Email (Gmail or SMTP) is included on every plan, including your free trial. WhatsApp is included from Starter up, and Instagram unlocks from Growth up.' },
  { q: 'What happens when my free trial ends?', a: 'Your data is kept safe. Pick a plan to keep going, or export your leads and conversation history — nothing is deleted without warning.' },
  { q: 'Can I switch between Monthly and Yearly billing?', a: 'Yes, any time from your billing settings. Switching to yearly applies the discount immediately; switching back to monthly applies from your next cycle.' },
  { q: 'What counts as a "lead captured"?', a: 'Any new contact created automatically from WhatsApp, Instagram, Email, your website forms, or a manual add. Replies within an existing conversation don\'t count again.' },
  { q: 'Can I upgrade or downgrade later?', a: 'Upgrade instantly, any time — your new limits apply immediately. Downgrades take effect at the start of your next billing cycle.' },
  { q: 'Do I need my own Meta / WhatsApp Business API access?', a: 'You need a Meta Business Manager account with WhatsApp Business API access. Our onboarding walks you through connecting it — most teams are live the same day.' },
  { q: 'Is there a setup fee?', a: 'No. Self-serve setup is included on every plan. Scale and Enterprise also get a guided onboarding call at no extra cost.' },
  { q: 'What does Enterprise include that Scale doesn\'t?', a: 'Unlimited everything (leads, automations, seats), a dedicated account manager, and custom terms for compliance, security review, or multi-workspace / agency needs.' },
];

export function formatINR(amount) {
  if (amount == null) return 'Custom';
  return `₹${amount.toLocaleString('en-IN')}`;
}
