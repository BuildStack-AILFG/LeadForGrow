export const FEATURE_CATEGORIES = ['All', 'Platform', 'Automation'];

export const BLOG_AUTHORS = {
  'saurabh-singh': {
    slug: 'saurabh-singh',
    name: 'S.Singh',
    role: 'Co-Founder & CTO',
    bio: 'Leads product and engineering at LeadForGrow — writing about CRM, automation, and AI for revenue teams.',
    initials: 'SS',
  },
  'leadforgrow-team': {
    slug: 'leadforgrow-team',
    name: 'LeadForGrow Team',
    role: 'Product & Customer Success',
    bio: 'Practical guides from the team building LeadForGrow — helping you capture, qualify, and close more leads.',
    initials: 'LF',
  },
};

export const featureArticles = [
  {
    slug: 'crm-sales-pipeline',
    category: 'Platform',
    author: 'saurabh-singh',
    title: 'CRM & Sales Pipeline',
    excerpt:
      'Track every lead from first enquiry to closed deal with a visual pipeline built for fast-moving sales teams.',
    readTime: '5 min read',
    intro:
      'Spreadsheets and scattered chats make it impossible to know which deals are moving and which are going cold. LeadForGrow CRM gives you one place to capture, qualify, and close leads—without enterprise complexity.',
    sections: [
      {
        heading: 'See your entire sales funnel at a glance',
        body: 'Drag leads across stages like New, Contacted, Qualified, Proposal, and Won. Every status change is logged so you always know what happened and when.',
      },
      {
        heading: 'Built for Indian sales teams',
        body: 'Most of your conversations happen on WhatsApp and phone calls. LeadForGrow keeps CRM records tied to those channels so context is never lost between tools.',
      },
      {
        heading: 'Close faster with automation hooks',
        body: 'When a lead moves stage, trigger follow-ups, assign owners, or notify your team automatically. Your pipeline becomes an engine—not a static board.',
      },
    ],
    highlights: [
      'Unlimited contacts on every plan',
      'Custom pipeline stages',
      'Lead source tracking',
      'Activity history per contact',
    ],
  },
  {
    slug: 'unified-inbox',
    category: 'Platform',
    author: 'leadforgrow-team',
    title: 'Unified Inbox',
    excerpt:
      'Manage WhatsApp, Instagram, Email, and website chat from one inbox—so no lead slips through the cracks.',
    readTime: '4 min read',
    intro:
      'Your customers message you everywhere. Switching between apps slows replies and kills conversions. LeadForGrow Unified Inbox brings every conversation into one workspace your team can actually manage.',
    sections: [
      {
        heading: 'One inbox for every channel',
        body: 'WhatsApp Business, Instagram DMs, email threads, and web chat—all visible in a single timeline. Reply from one place without losing channel context.',
      },
      {
        heading: 'Never miss a message again',
        body: 'Unread counts, assignment status, and conversation history keep your team aligned. Handoffs between sales reps stay clean and documented.',
      },
      {
        heading: 'AI-assisted replies when you need speed',
        body: 'Draft smart responses based on conversation context, then send or edit before delivery. Respond in seconds, not hours.',
      },
    ],
    highlights: [
      'Multi-channel message view',
      'Contact profiles linked to CRM',
      'Team visibility on open chats',
      'Fast search across conversations',
    ],
  },
  {
    slug: 'ai-reply-assistant',
    category: 'Platform',
    author: 'saurabh-singh',
    title: 'AI Reply Assistant',
    excerpt:
      'Let AI draft replies, answer FAQs, and keep conversations moving—while your team stays in control.',
    readTime: '5 min read',
    intro:
      'Speed wins deals, but generic auto-replies frustrate buyers. LeadForGrow AI Reply Assistant understands context and drafts human-sounding responses your team can approve, edit, or send instantly.',
    sections: [
      {
        heading: 'Smart drafts, not robotic spam',
        body: 'The assistant reads incoming messages and suggests replies tailored to intent—pricing questions, demo requests, support queries, and more.',
      },
      {
        heading: 'Human approval when it matters',
        body: 'Set rules for when AI can auto-send and when a human must review. Sensitive flows stay under your control.',
      },
      {
        heading: 'Works across your channels',
        body: 'Use AI assistance inside WhatsApp, Instagram, email, and web chat workflows so every touchpoint feels consistent and professional.',
      },
    ],
    highlights: [
      'Context-aware reply suggestions',
      'FAQ and intent detection',
      'Approval rules per workflow',
      'Faster first response time',
    ],
  },
  {
    slug: 'website-lead-capture',
    category: 'Platform',
    author: 'leadforgrow-team',
    title: 'Website Lead Capture',
    excerpt:
      'Turn website visitors into CRM leads instantly with forms, chat widgets, and landing page integrations.',
    readTime: '4 min read',
    intro:
      'Traffic without capture is wasted spend. LeadForGrow helps you collect enquiries from your website and route them straight into your CRM and automation flows—no manual copy-paste.',
    sections: [
      {
        heading: 'Forms that feed your pipeline',
        body: 'Build lead capture forms and embed them on landing pages, product pages, or campaign URLs. Every submission creates a CRM record automatically.',
      },
      {
        heading: 'Instant follow-up on submission',
        body: 'Trigger WhatsApp or email acknowledgements the moment someone fills a form. Prospects hear from you while interest is highest.',
      },
      {
        heading: 'Track where leads come from',
        body: 'Attribute enquiries to campaigns, pages, and sources so you know what is actually driving revenue.',
      },
    ],
    highlights: [
      'Embeddable lead forms',
      'Auto CRM record creation',
      'Instant confirmation messages',
      'Source and campaign tracking',
    ],
  },
  {
    slug: 'analytics-reports',
    category: 'Platform',
    author: 'saurabh-singh',
    title: 'Analytics & Reports',
    excerpt:
      'Measure response times, conversion rates, and team performance with dashboards built for sales leaders.',
    readTime: '4 min read',
    intro:
      'You cannot improve what you cannot see. LeadForGrow Analytics turns inbox activity, pipeline movement, and automation results into clear metrics your team can act on.',
    sections: [
      {
        heading: 'Pipeline and conversion insights',
        body: 'Track how many leads enter each stage, where drop-offs happen, and which sources produce the highest close rates.',
      },
      {
        heading: 'Team performance visibility',
        body: 'See response times, assigned leads, and activity per rep. Identify bottlenecks before they cost you revenue.',
      },
      {
        heading: 'Automation ROI',
        body: 'Measure how many conversations were handled by workflows and AI versus manual effort—so you know what is scaling.',
      },
    ],
    highlights: [
      'Real-time dashboard views',
      'Lead source performance',
      'Team response metrics',
      'Advanced analytics on Growth plan',
    ],
  },
  {
    slug: 'team-inbox-assignment',
    category: 'Platform',
    author: 'leadforgrow-team',
    title: 'Team Inbox & Assignment',
    excerpt:
      'Assign leads, balance workload, and collaborate as a team without stepping on each other.',
    readTime: '4 min read',
    intro:
      'When multiple people handle enquiries, chaos follows—duplicate replies, missed messages, and unclear ownership. LeadForGrow Team Inbox gives every lead an owner and every rep a clear queue.',
    sections: [
      {
        heading: 'Automatic lead assignment',
        body: 'Route new enquiries round-robin, by source, or by rules you define. Leads land with the right person immediately.',
      },
      {
        heading: 'Shared visibility, clear ownership',
        body: 'Managers see all open conversations. Reps focus on their assigned leads. Everyone knows who is handling what.',
      },
      {
        heading: 'Scale beyond solo selling',
        body: 'Growth and Enterprise plans support multiple team members with team inbox, assignment rules, and collaboration built in.',
      },
    ],
    highlights: [
      'Round-robin assignment',
      'Per-rep lead queues',
      'Manager oversight dashboard',
      'Up to 5 team members on Growth',
    ],
  },
  {
    slug: 'whatsapp-automation',
    category: 'Automation',
    author: 'saurabh-singh',
    title: 'WhatsApp Automation',
    excerpt:
      'Connect WhatsApp Business API, send template messages, and automate follow-ups at scale.',
    readTime: '5 min read',
    intro:
      'WhatsApp is where Indian customers expect fast replies. LeadForGrow WhatsApp Automation connects your official Business API number to CRM, inbox, and workflow engines—so you respond 24/7 without burning out your team.',
    sections: [
      {
        heading: 'Official WhatsApp Business API',
        body: 'Integrate with Meta-approved WhatsApp Business API for reliable delivery, template messages, and compliant business communication.',
      },
      {
        heading: 'Automated follow-ups that feel personal',
        body: 'Trigger messages when leads go cold, after form submissions, or when pipeline stages change. Use templates and dynamic fields for relevance.',
      },
      {
        heading: 'Inbox + automation in one flow',
        body: 'When a human needs to step in, the full conversation history is already in CRM. Automation handles speed; your team handles complexity.',
      },
    ],
    highlights: [
      'Template message support',
      'Workflow-triggered sends',
      'Unified inbox integration',
      'AI reply assistance on WhatsApp',
    ],
  },
  {
    slug: 'instagram-automation',
    category: 'Automation',
    author: 'leadforgrow-team',
    title: 'Instagram Automation',
    excerpt:
      'Capture and respond to Instagram DMs automatically—turn social engagement into qualified pipeline.',
    readTime: '4 min read',
    intro:
      'Instagram DMs are full of buying intent, but they are easy to miss when volume spikes. LeadForGrow Instagram Automation connects your business account so every DM becomes a trackable lead.',
    sections: [
      {
        heading: 'DMs flow into your CRM',
        body: 'New Instagram conversations create contact records automatically. Tags, notes, and pipeline stages apply just like any other channel.',
      },
      {
        heading: 'Instant responses to common questions',
        body: 'Auto-reply to pricing, availability, and booking enquiries while your team focuses on high-intent conversations.',
      },
      {
        heading: 'Consistent brand voice',
        body: 'Combine automation with AI drafts so responses stay on-brand across Instagram, WhatsApp, and email.',
      },
    ],
    highlights: [
      'Instagram DM integration',
      'Auto lead creation',
      'AI-assisted DM replies',
      'Cross-channel customer view',
    ],
  },
  {
    slug: 'email-automation',
    category: 'Automation',
    author: 'saurabh-singh',
    title: 'Email Automation',
    excerpt:
      'Send timely email follow-ups, nurture sequences, and notifications tied to your sales pipeline.',
    readTime: '4 min read',
    intro:
      'Email still closes deals—especially for B2B and high-ticket sales. LeadForGrow Email Automation connects your inbox to workflows so follow-ups happen on schedule, not when someone remembers.',
    sections: [
      {
        heading: 'Pipeline-triggered emails',
        body: 'Send proposals, reminders, and check-ins when leads hit specific stages or go inactive for a set number of days.',
      },
      {
        heading: 'Unified with chat channels',
        body: 'See email alongside WhatsApp and Instagram in one contact timeline. No more guessing what was said on which channel.',
      },
      {
        heading: 'Nurture at scale',
        body: 'Build multi-step sequences for leads not ready to buy today—keep them warm until they are.',
      },
    ],
    highlights: [
      'Email inbox integration',
      'Scheduled follow-up sequences',
      'Stage-based triggers',
      'CRM-linked email history',
    ],
  },
  {
    slug: 'ai-automation-workflows',
    category: 'Automation',
    author: 'leadforgrow-team',
    title: 'AI Automation Workflows',
    excerpt:
      'Build no-code workflows that qualify leads, route conversations, and trigger actions across every channel.',
    readTime: '6 min read',
    intro:
      'Manual follow-up does not scale. LeadForGrow AI Automation Workflows let you design if-this-then-that logic—lead comes in, AI qualifies, assigns an owner, sends a reply, and books a meeting—without writing code.',
    sections: [
      {
        heading: 'Visual workflow builder',
        body: 'Create automations with triggers (new lead, message received, stage change) and actions (send message, assign rep, update CRM, notify team).',
      },
      {
        heading: 'AI qualification built in',
        body: 'Growth plans include AI lead qualification—score intent from messages and route hot leads to senior reps automatically.',
      },
      {
        heading: 'Basic to advanced as you grow',
        body: 'Starter includes basic automation workflows. Upgrade to Growth for advanced logic, API webhooks, and multi-step sequences.',
      },
    ],
    highlights: [
      'No-code workflow builder',
      'Multi-channel triggers',
      'AI lead qualification (Growth)',
      'API & webhooks (Growth)',
    ],
  },
];

export function getFeatureBySlug(slug) {
  return featureArticles.find((article) => article.slug === slug);
}

export function getAuthor(slug) {
  return BLOG_AUTHORS[slug] || BLOG_AUTHORS['leadforgrow-team'];
}

export function getArticlesByAuthor(authorSlug) {
  return featureArticles.filter((a) => a.author === authorSlug);
}

export function getRelatedArticles(slug, limit = 3) {
  const current = getFeatureBySlug(slug);
  if (!current) return [];
  return featureArticles
    .filter((a) => a.slug !== slug && (a.category === current.category || a.author === current.author))
    .slice(0, limit);
}
