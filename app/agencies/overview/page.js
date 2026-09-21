import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Elite Operating System for Marketing Agencies in India",
  description: "Scale your agency to 50+ clients with the LeadForGrow operating system. Unified dashboard, white-label options, and automated fulfillment. Start your agency journey today.",
  keywords: ["agency operating system", "marketing agency software India", "manage multiple clients platform", "white label lead management", "agency fulfillment automation"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/agencies/overview'
  }
};

export default function AgencyOverviewPage() {
  const benefits = [
    {
      title: "Unified Multi-Tenant Dashboard",
      text: "Stop toggling between 50 different logins. Manage every client funnel, form, and lead from one master brandable dashboard."
    },
    {
      title: "Snapshot Deployment",
      text: "Build a winning funnel once and deploy it for 10 new clients in 60 seconds. Standardize your fulfillment and scale your margins."
    },
    {
      title: "White-Label Brand Control",
      text: "Remove our name and put yours. Your clients see your logo, your domain, and your support links. You are the tech giant."
    },
    {
      title: "Automated Client Reporting",
      text: "Generate professional lead ROI reports automatically every month. Prove your value without ever touching a spreadsheet."
    }
  ];

  const whoIsThisFor = [
    "Digital Marketing Agencies scaling past 5 clients",
    "Solo Freelancers wanting to productize their services",
    "Lead Gen Specialists who need a multi-tenant CRM",
    "SAAS Resellers building their own white-label brand"
  ];

  const whyItMatters = [
    "Managing 10 clients on 10 different Wordpress sites is a nightmare that will eventually break your agency.",
    "Bespoke fulfillment is the enemy of profit; standardization is the key to scaling to 7 figures.",
    "Clients don't buy 'Ads'; they buy 'Leads and Revenue'. LeadForGrow provides the proof they need.",
    "Your agency's value is in your systems, and LeadForGrow is the ultimate system for marketing experts."
  ];

  const faq = [
    {
      q: "How does the multi-tenant architecture work?",
      a: "Each client you add gets their own isolated 'Sub-Account'. This means their leads, automations, and websites are completely private, but you can access them all from your single master login."
    },
    {
      q: "Can I truly white-label the entire platform?",
      a: "Yes. With our white-label tier, you can host the platform on your own domain (e.g., app.youragency.com), use your own logo, and customize the color scheme to match your agency branding."
    },
    {
      q: "What is a 'Snapshot'?",
      a: "A snapshot is a bridge of all your settings—funnels, forms, stages, and automations. If you have a winning setup for Dentists, you can 'Snap' it and deploy it into a new client's account instantly."
    },
    {
      q: "Does this replace my existing Wordpress or Wix sites?",
      a: "It can. Our builder is much faster and more integrated for lead gen. However, you can also keep your existing sites and just use LeadForGrow for the forms, CRM, and automation layers."
    },
    {
      q: "How many clients can I manage on the platform?",
      a: "LeadForGrow is built to scale with you. Our agency plans are designed to handle everything from a boutique firm with 5 clients to a large-scale operations house with 500+ clients."
    }
  ];

  return (
    <MarketingLayout 
      title="The Operating System for the Modern Agency." 
      subtitle="Stop fighting with scattered tools and manual fulfillment. One unified platform to build, manage, and scale your clients to the moon."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Scale My Agency"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Agency Grind": Why Most Firms Peak at 10 Clients</h2>
          <p>
            In the early days of an agency in India, you survive on hustle. You manually check client forms, you spend weekends fixing broken plugins, and you manage communication via a chaotic web of WhatsApp groups. But as you grow, this "hustle" becomes your ceiling.
          </p>
          <p>
            <strong>If you don't have systems, you don't have an agency; you have a job.</strong> Most firms peak at 10 clients because their manual fulfillment processes simply can't handle any more volume. LeadForGrow was built by agency owners for agency owners to break this ceiling.
          </p>
        </div>

        <div>
          <h2>From "Service Provider" to "Technology Partner"</h2>
          <p>
            When you sell 'services', you are a commodity. When you sell 'results backed by proprietary tech', you are a strategic partner. LeadForGrow allows you to provide your clients with an elite, white-labeled technology suite that they can't get anywhere else.
          </p>
          <ul>
            <li><strong>The Fulfillment Layer:</strong> Deploy high-converting funnels in minutes, not weeks, using our NICHE SNAPSHOTS.</li>
            <li><strong>The Value Layer:</strong> Give your clients a professional CRM where they can see their leads and track their own sales performance.</li>
            <li><strong>The Retention Layer:</strong> When a client's entire sales process lives inside your platform, they stay with you for years, not months.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The LeadForGrow Agency Scaling Framework</h3>
          <p>
            We've identified the four core pillars that allow an agency to scale without increasing overhead. Our platform is built to automate all four:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Standardized Niche Snapshots</h4>
              <p className="text-xl">Stop reinventing the wheel. Build a high-performance system for one niche (Real Estate, Medical, Legal) and duplicate it for every new client in under a minute.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Centralized Client Management</h4>
              <p className="text-xl">One login to rule them all. Toggle between client accounts with zero friction. Monitor health, lead volume, and team response times from a single dashboard.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Automated Proof-of-Work</h4>
              <p className="text-xl">Your clients get beautiful, brandable reports delivered to their inbox automatically. You look like a data-driven genius while you focus on high-level strategy.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Perceived Technology Value</h4>
              <p className="text-xl">Your own white-labeled app makes your agency look 10x larger and more professional. It justifies your premium pricing and builds massive client trust.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Dominating the Indian B2B Market</h2>
          <p>
            The Indian agency landscape is shifting. Clients are no longer impressed by 'Creative'. They are impressed by 'Control'. They want to know exactly how many leads they got and what happened to them.
          </p>
          <p>
            LeadForGrow gives you that control. By providing a unified system for capture, CRM, and automation, you are solving the client's biggest problem: <strong>The Lead Gap</strong>. You aren't just an ads person; you are the architect of their sales growth.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Ready to exit the 'Agency Grind'?</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Build a scalable, profitable, and system-driven agency with LeadForGrow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
              Start Your Agency Account
            </a>
            <a href="/contact" className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-12 py-5 rounded-3xl text-2xl font-bold transition hover:bg-slate-50">
              Speak to our Agency Team
            </a>
          </div>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow Agency Operating System",
        "operatingSystem": "Web-based",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        }
      })}} />
    </MarketingLayout>
  );
}
