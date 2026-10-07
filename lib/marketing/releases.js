/**
 * Customer-facing release history, written from the repo's commit log (dates are commit dates).
 * Used by /changelog (every entry) and /product-updates (entries marked `highlight`).
 * Add new entries at the top. Keep wording to what shipped — no version numbers, no figures.
 */
export const RELEASES = [
  {
    date: '2026-10-03',
    title: 'A cleaner, calmer app',
    tag: 'Design',
    highlight: true,
    image: '/images/hero/crm.webp',
    summary: 'The whole CRM got a new look: one consistent set of buttons, tables and headers, a reorganised sidebar and a Ctrl/⌘ K page search.',
    items: [
      'New sidebar with grouped sections and quick links to Dashboard, Leads and Inbox',
      'Ctrl / ⌘ K opens a page search from anywhere',
      'Inbox side panels can be collapsed, and the reply box folds away until you need it',
      'Leads table keeps the name column visible while you scroll sideways',
      'Bills download as a proper tax invoice with GSTIN, amount in words and page numbers',
    ],
  },
  {
    date: '2026-10-01',
    title: 'Meeting automations that do what they say',
    tag: 'Meetings',
    items: [
      'Pick approved WhatsApp templates for confirmations, reminders and no-shows',
      'Choose reminder times: 1 day, 3 hours, 1 hour, 30 or 15 minutes before',
      'Mark meetings Completed or No-show; each can start its own automation',
      'No-shows receive a link to rebook',
      'New “Weekly report” email design for broadcasts',
    ],
  },
  {
    date: '2026-09-30',
    title: 'Designed emails in Broadcasts',
    tag: 'Broadcasts',
    highlight: true,
    image: '/images/site/product/email-builder.svg',
    summary: 'Send colourful, mobile-friendly emails without writing HTML — or paste your own from Canva, Mailchimp or Beefree.',
    items: [
      'More than 20 ready-made designs, including festival offers, review requests and win-back',
      'Edit text, images, colours and buttons with a live desktop and phone preview',
      'Paste or upload your own HTML',
      'Save designs to “My templates” for the whole team',
      'Designed emails in your inbox now look the way the sender built them',
    ],
  },
  {
    date: '2026-09-30',
    title: 'Faster everywhere',
    tag: 'Performance',
    items: [
      'The app opens without the long loading animation',
      'Fonts and images load from our own domain and are much smaller',
      'Background refreshes pause while the tab is hidden',
    ],
  },
  {
    date: '2026-09-29',
    title: 'Leak Radar',
    tag: 'CRM',
    highlight: true,
    image: '/images/site/product/revenue-leak.svg',
    summary: 'A live list of enquiries that are slipping — customers waiting for a reply, leads with no follow-up, overdue tasks — each with a one-tap fix.',
    items: [
      'One card per lead with reply, send template, follow-up task, reassign or snooze',
      'Salespeople see their own leaks; managers see the team view',
      'Recovery ledger shows what was saved after acting',
      'Optional daily five-line email brief',
      'WhatsApp opt-out is now enforced on every send; START opts back in',
    ],
  },
  {
    date: '2026-09-25',
    title: 'First-response tracking and stronger webhook security',
    tag: 'Inbox',
    items: [
      'Each conversation records when the customer first wrote and when a person first replied',
      'Automated messages are labelled separately from replies written by your team',
      'Messages from Meta are only accepted with a valid signature',
    ],
  },
  {
    date: '2026-09-24',
    title: 'Smarter AI knowledge base',
    tag: 'AI',
    highlight: true,
    image: '/images/site/product/ai-copilot.svg',
    summary: 'Add PDFs, Word files, FAQs and product catalogs as knowledge sources. AI reply suggestions use your last messages and the most relevant passages.',
    items: [
      'Upload PDF and DOCX, build FAQs and product lists right in the form',
      'Search by meaning when semantic search is enabled',
      'Bring your own OpenAI key — stored encrypted',
      'Mail sent from your webmail now appears in the CRM',
      'Invoices can carry your company stamp and signatory',
    ],
  },
  {
    date: '2026-09-23',
    title: 'Instagram and Facebook comments in the inbox',
    tag: 'Inbox',
    items: [
      'Public comments on your posts arrive as their own conversations',
      'Reply to a comment, or send a private reply, from the inbox',
      'Email folders, triage actions and channel filters',
    ],
  },
  {
    date: '2026-09-21',
    title: 'Inbox queues',
    tag: 'Inbox',
    highlight: true,
    image: '/images/site/product/unified-inbox.svg',
    summary: 'Needs reply, Mine, Unassigned and All — each with a live count — replace a row of filters, so everyone knows who is waiting.',
    items: [
      'Done button removes a conversation from its queue; a new message brings it back',
      'Assign to me, or to a teammate, straight from the list',
      'Search any lead by name or number and start a WhatsApp chat with an approved template',
      'Notifications show the real channel logo and who wrote',
    ],
  },
  {
    date: '2026-09-20',
    title: 'Comment automations for Instagram and Facebook',
    tag: 'Automation',
    items: [
      'Reply to keyword comments publicly and by private message',
      'Choose all posts, one post, or the next post you publish',
      'Optional AI-written replies per channel',
      'Warm-up limits and automatic pause if Meta blocks sending',
      'Email threads shown as cards; dark mode across the app',
    ],
  },
  {
    date: '2026-09-18',
    title: 'Facebook Messenger',
    tag: 'Channels',
    items: [
      'Messenger conversations and Page comments in the unified inbox',
      'WhatsApp Flows can now run on Facebook too',
      'New Channels page to switch each channel’s features on or off',
    ],
  },
  {
    date: '2026-09-13',
    title: 'New WhatsApp Flows editor',
    tag: 'Automation',
    items: [
      'Name a flow before you build it; compact node cards and a panel beside the selected step',
      'Set a start node for testing, and colour-code cards',
      'Insert a template from the gallery; export responses as CSV',
    ],
  },
  {
    date: '2026-09-12',
    title: 'WhatsApp template library',
    tag: 'Templates',
    items: [
      'Templates grouped by category, with Active and Deleted tabs',
      'Restore a deleted template',
    ],
  },
  {
    date: '2026-09-04',
    title: 'Email signatures',
    tag: 'Email',
    items: [
      'Rich signature editor with images, colours and ready-made layouts',
      'Several signatures per mailbox, picked as you write',
    ],
  },
];
