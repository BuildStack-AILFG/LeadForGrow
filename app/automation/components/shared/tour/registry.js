/**
 * Single source of truth for every onboarding tour and page intro in the
 * product. Two purposes:
 *   1. Pages import their own entry and pass it straight to useAutoStartTour
 *      / <PageIntro>, so copy lives in one place instead of scattered
 *      across 24 page files.
 *   2. The Guide (Help Center) and the HelpLauncher read this list to power
 *      "restart a tour" — spec section 3: "ability to restart a tour".
 *
 * `kind: 'tour'` → full multi-step spotlight walkthrough (Next/Back/Skip).
 * `kind: 'intro'` → one-shot dismissible welcome card (PageIntro).
 */

export const TOURS = {
  dashboard: {
    kind: 'tour',
    id: 'dashboard',
    label: 'Dashboard tour',
    path: '/automation',
    guideHref: '/help/getting-started',
    steps: [
      {
        title: 'Welcome to LeadForGrow 👋',
        body: "This is your Dashboard — a live snapshot of your business. Revenue, leads, deals, and today's schedule, all in one place.",
      },
      {
        target: 'dashboard-kpis',
        title: 'Your key numbers',
        body: 'Leads, conversion rate, sales cycle, active deals, and pipeline value — updated in real time as your team works.',
        placement: 'bottom',
      },
      {
        target: 'dashboard-revenue',
        title: 'Revenue at a glance',
        body: 'Track revenue trends over any time range. This chart fills in automatically once bills start getting paid.',
        placement: 'bottom',
      },
      {
        target: 'dashboard-ask-ai',
        title: 'Ask AI anything',
        body: 'Stuck on a number or not sure what to do next? Ask AI reads your live data and answers in plain language.',
        placement: 'bottom',
      },
      {
        title: "You're all set 🎉",
        body: 'Explore Leads next to bring in your first contact, or open the Guide any time from Support in the sidebar.',
      },
    ],
  },

  leads: {
    kind: 'tour',
    id: 'leads',
    label: 'Leads tour',
    path: '/automation/leads',
    guideHref: '/help/leads',
    steps: [
      {
        title: 'All your leads live here',
        body: 'Every enquiry — from your website, WhatsApp, or a phone call — lands here first. Add, import, filter, and move them through your sales process.',
      },
      {
        target: 'leads-add-btn',
        title: 'Add your first lead',
        body: 'Add one by hand, or import a whole list from a CSV file in one go.',
        placement: 'bottom',
      },
      {
        target: 'leads-search',
        title: 'Find what you need fast',
        body: 'Search by name, phone, or email — great for a daily "who do I need to call today?" check.',
        placement: 'bottom',
      },
      {
        target: 'leads-pipeline-toggle',
        title: 'Switch to Pipeline view',
        body: 'See every lead as a card you can drag between stages — useful when you want the visual, sales-board view instead of a table.',
        placement: 'bottom',
      },
      {
        title: 'Ready to grow your list 🎉',
        body: 'Want new leads to trigger a WhatsApp welcome automatically? Set that up in Automation Rules next.',
      },
    ],
  },

  automationRules: {
    kind: 'tour',
    id: 'automation-rules',
    label: 'Automation Rules tour',
    path: '/automation/automation-rules',
    guideHref: '/help/automation-rules',
    steps: [
      {
        title: 'Welcome to Automation Rules 👋',
        body: 'This is where LeadForGrow automatically performs actions for you when something happens to a lead — for example: new lead → send WhatsApp message → notify your team → create a follow-up task.',
      },
      {
        target: 'automation-create-btn',
        title: "Let's build your first automation",
        body: 'Start here. Pick a ready-made template — like an instant welcome message or missed-lead recovery — or build one from scratch.',
        placement: 'bottom',
      },
      {
        target: 'automation-list',
        title: 'Your automations, at a glance',
        body: 'Every rule you create shows up here with its status, trigger, and how many times it has run. Flip the switch to pause one instantly.',
        placement: 'right',
      },
      {
        target: 'automation-settings-panel',
        title: 'Fine-tune the details',
        body: 'Select any automation to edit its channel, message, and template — this is also where you activate it once it looks right.',
        placement: 'left',
      },
      {
        title: "You're ready 🎉",
        body: "You've seen the foundation of LeadForGrow automation. Start from a template above whenever you're ready — it takes under a minute.",
      },
    ],
  },
};

export const INTROS = [
  { id: 'deals', path: '/automation/deals', tone: 'blue', icon: 'Handshake',
    title: 'This is where revenue gets tracked.',
    body: 'A Deal represents money in motion — from first quote to signed and paid. Create one from scratch, or convert a qualified lead.',
    guideHref: '/help/deals-pipeline' },
  { id: 'deal-pipeline', path: '/automation/pipelines', tone: 'blue', icon: 'Columns3',
    title: 'Your sales process, as a board.',
    body: 'Every deal is a card in a column. Drag a card to move it forward — customize the stages any time to match how your team actually sells.',
    guideHref: '/help/deals-pipeline' },
  { id: 'bills', path: '/automation/bills', tone: 'violet', icon: 'Receipt',
    title: 'Bill customers without leaving LeadForGrow.',
    body: 'Create a bill, send it over WhatsApp or email, and get paid via a Razorpay link — all tracked in one place.',
    guideHref: '/help/create-bill' },
  { id: 'tasks', path: '/automation/tasks', tone: 'amber', icon: 'CheckSquare',
    title: 'Nothing falls through the cracks.',
    body: 'Tasks tied to your leads and deals, created by you or automatically by a rule (like "no response in 24h").',
    guideHref: '/help/tasks' },
  { id: 'companies', path: '/automation/companies', tone: 'blue', icon: 'Building2',
    title: 'Group everything by business.',
    body: 'If you sell B2B, a Company groups every contact, lead, and deal tied to that business in one timeline.',
    guideHref: '/help/companies-contacts' },
  { id: 'contacts', path: '/automation/contacts', tone: 'blue', icon: 'UserCircle',
    title: 'The people behind your deals.',
    body: 'A Contact is a specific person — useful when a company has several people you talk to.',
    guideHref: '/help/companies-contacts' },
  { id: 'inbox', path: '/automation/chat', tone: 'emerald', icon: 'Inbox',
    title: 'Every conversation, one inbox.',
    body: 'WhatsApp, Instagram, and email messages all land here. Reply from whichever channel the customer used — they never know the difference.',
    guideHref: '/help/inbox-basics' },
  { id: 'sequences', path: '/automation/sequences', tone: 'violet', icon: 'Route',
    title: 'Multi-step follow-ups, on autopilot.',
    body: "A Sequence sends a fixed series of messages over days — perfect for post-visit check-ins or nurturing leads who haven't converted yet.",
    guideHref: '/help/sequences' },
  { id: 'whatsapp-flows', path: '/automation/whatsapp-flows', tone: 'emerald', icon: 'Workflow',
    title: 'Let WhatsApp do the talking.',
    body: 'Automated conversations — booking, service selection, quotes — that run entirely inside WhatsApp, no human typing required.',
    guideHref: '/help/whatsapp-flows' },
  { id: 'broadcasts', path: '/automation/broadcasts', tone: 'emerald', icon: 'Send',
    title: 'Message many customers at once.',
    body: 'Send an approved WhatsApp template to a filtered list — a promotion, an announcement, a reminder — tracked per recipient.',
    guideHref: '/help/send-broadcast' },
  { id: 'journeys', path: '/automation/journeys', tone: 'violet', icon: 'Map',
    title: 'Map the whole customer relationship.',
    body: 'Unlike a Sequence, a Journey branches — different customers take different paths based on what they actually do.',
    guideHref: '/help/customer-journeys' },
  { id: 'meetings', path: '/automation/meetings', tone: 'blue', icon: 'CalendarClock',
    title: 'Let leads book time with you directly.',
    body: 'Share your booking link and skip the back-and-forth. Confirmations and reminders go out automatically.',
    guideHref: '/help/meetings' },
  { id: 'templates', path: '/automation/templates', tone: 'amber', icon: 'FileText',
    title: 'Reusable message templates.',
    body: 'Write a message once — a quote, a follow-up, a thank-you — and reuse it anywhere across email and chat.',
    guideHref: '/help/create-template' },
  { id: 'whatsapp-templates', path: '/automation/whatsapp-templates', tone: 'emerald', icon: 'MessageCircleMore',
    title: 'Meta-approved WhatsApp templates.',
    body: 'WhatsApp requires templates to be pre-approved before you can message someone outside a 24-hour window. Build and submit them here.',
    guideHref: '/help/create-template' },
  { id: 'chatbot', path: '/automation/chatbot', tone: 'violet', icon: 'Bot',
    title: 'An assistant that never sleeps.',
    body: 'Answers FAQs and qualifies leads automatically, using the same knowledge base as the rest of your AI features.',
    guideHref: '/help/chatbot' },
  { id: 'forms', path: '/automation/forms', tone: 'blue', icon: 'FileInput',
    title: 'Capture leads from your website.',
    body: 'Build a form, embed it anywhere, and every submission becomes a Lead automatically — no code required.',
    guideHref: '/help/forms' },
  { id: 'call-recovery', path: '/automation/call-integration', tone: 'rose', icon: 'PhoneCall',
    title: 'Turn missed calls into leads.',
    body: 'Every missed call is logged here automatically. Pair it with an automation to text the caller back within minutes.',
    guideHref: '/help/call-recovery' },
  { id: 'reports', path: '/automation/reports', tone: 'blue', icon: 'BarChart3',
    title: 'What is happening in your business.',
    body: 'Revenue, conversion rate, and pipeline health over any date range — good for a weekly check-in.',
    guideHref: '/help/reports-analytics' },
  { id: 'automation-analytics', path: '/automation/automation-analytics', tone: 'violet', icon: 'Activity',
    title: 'Is your automation actually working?',
    body: 'See how many times each rule ran and how many messages it sent. Turn off what nobody triggers.',
    guideHref: '/help/reports-analytics' },
  { id: 'events', path: '/automation/events', tone: 'slate', icon: 'CalendarDays',
    title: 'The raw activity log.',
    body: 'A timeline of everything that happened — form fills, page views, message sends. Useful for answering "why didn\'t this lead get a message?"',
    guideHref: '/help/reports-analytics' },
  { id: 'ai-knowledge', path: '/automation/ai/knowledge', tone: 'violet', icon: 'Brain',
    title: 'What does your AI know?',
    body: 'Every AI reply — chatbot, auto-reply, assistant — answers using only what you put here. No entry, no answer.',
    guideHref: '/help/ai-knowledge' },
  { id: 'ai-settings', path: '/automation/settings/ai', tone: 'violet', icon: 'Sparkles',
    title: 'How should your AI behave?',
    body: 'Control tone, boundaries, and exactly when an AI conversation should hand off to a human teammate.',
    guideHref: '/help/ai-settings' },
  { id: 'team', path: '/automation/settings/team-permissions', tone: 'slate', icon: 'UserCog',
    title: 'Bring your team in.',
    body: 'Invite teammates, assign roles, and control who can see billing and reports.',
    guideHref: '/help/team-management' },
  { id: 'integrations', path: '/automation/settings/integrations', tone: 'slate', icon: 'Plug',
    title: 'Connect the tools you already use.',
    body: 'WhatsApp Business, email, Razorpay, and calendar sync all get connected from here.',
    guideHref: '/help/integrations' },
  { id: 'settings', path: '/automation/settings', tone: 'slate', icon: 'Settings',
    title: 'Your workspace, configured.',
    body: 'Business details, branding, and general preferences that apply across bills, reports, and the rest of the product.',
    guideHref: '/help/account-settings' },
];

export function getTourList() {
  return Object.values(TOURS);
}

export function findTourForPath(pathname) {
  return Object.values(TOURS).find((t) => t.path === pathname) || null;
}

export function findIntroForPath(pathname) {
  return INTROS.find((i) => i.path === pathname) || null;
}
