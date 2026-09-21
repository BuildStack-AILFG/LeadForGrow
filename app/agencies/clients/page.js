import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Effortless Multi-Client Lead Management for Scaling Agencies",
  description: "Tweak multiple client accounts from a single master login. LeadForGrow's multi-tenant architecture eliminates login fatigue and boosts agency efficiency.",
  keywords: ["manage multiple client accounts", "agency multi-tenant CRM", "centralized lead management software", "client account isolation", "scaling marketing agency operations"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/agencies/clients'
  }
};

export default function AgencyClientsPage() {
  const benefits = [
    {
      title: "One Login, Total Control",
      text: "Stop toggling between 50 browser tabs. Access every client sub-account from a single, secure master login."
    },
    {
      title: "Complete Data Isolation",
      text: "Each client exists in their own secure silo. No risk of data mixing, overlapping leads, or unauthorized access."
    },
    {
      title: "Global Team Assignment",
      text: "Assign your account managers to specific client accounts while you maintain a high-level overview of the entire agency."
    },
    {
      title: "Consolidated Billing & Usage",
      text: "Track exactly how many leads and funnels each client is using. Transparent data for transparent billing."
    }
  ];

  const whoIsThisFor = [
    "Agencies managing 5 to 500+ different client brands",
    "Account Managers overseeing multiple service funnels",
    "Fulfillment teams who need to switch contexts quickly",
    "Agency Owners looking for a bird's-eye view of growth"
  ];

  const whyItMatters = [
    "Login fatigue is a real productivity killer; LeadForGrow saves your team hours of wasted time every week.",
    "Data privacy is your #1 legal responsibility; our multi-tenant setup ensures 100% compliance.",
    "As you scale, you can't be everywhere at once; centralized management gives you the oversight you need.",
    "Your agency is only as strong as your weakest system; LeadForGrow provides the foundation for elite scale."
  ];

  const faq = [
    {
      q: "Can I give my clients access to their own account?",
      a: "Yes. You can invite your clients as users to their specific sub-account only. They will see their own leads and reports without ever knowing your other clients exist."
    },
    {
      q: "Is there a limit to how many client sub-accounts I can create?",
      a: "Depending on your agency plan, you can create up to hundreds of sub-accounts. Our architecture is built to grow alongside your agency's success."
    },
    {
      q: "Does each client need their own LeadForGrow subscription?",
      a: "No. You manage their accounts under your master Agency plan. You can then bundle the software cost into your management fee for a higher-margin service."
    },
    {
      q: "Can I move a funnel from one client account to another?",
      a: "Yes! Our 'Snapshot' feature allows you to copy winning funnels, forms, and automations between accounts with a single click. This is the ultimate tool for agency fulfillment scaling."
    },
    {
      q: "How secure is the data isolation between clients?",
      a: "We use enterprise-grade multi-tenant logic. Each sub-account has a unique ID and database isolation layer, ensuring that even within the same agency, data never crosses boundaries."
    }
  ];

  return (
    <MarketingLayout 
      title="Scale Your Agency Without Scaling the Chaos." 
      subtitle="Stop fighting with passwords and tab-fatigue. Manage every client, lead, and automation from one unified agency command center."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Manage My Clients"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Agency Tab" Problem: Why You're Losing 10 Hours a Week</h2>
          <p>
            The old way of managing multiple clients in an agency in India involves a spreadsheet of passwords, 50 open Chrome tabs, and constant context-switching. You log out of Client A's WordPress, log into Client B's CRM, check Client C's WhatsApp group, and repeat.
          </p>
          <p>
            <strong>This inefficiency is the silent killer of agency profit margins.</strong> LeadForGrow's multi-tenant architecture was built to eliminate this friction. We provide a single master dashboard where you can toggle between 5, 50, or 500 client accounts in two clicks—no logout required.
          </p>
        </div>

        <div>
          <h2>Operational Excellence Through High-Level Oversight</h2>
          <p>
            As an agency owner, you need to know which client accounts are healthy and which need attention. LeadForGrow's centralized management platform provides an "Agency Scorecard" that gives you the bird's-eye view you've been missing:
          </p>
          <ul>
            <li><strong>Lead Velocity Audit:</strong> See which clients are getting the most enquiries and which campaigns need optimization.</li>
            <li><strong>Response Time Monitoring:</strong> Track how fast each client's sales team (or your own fulfillment team) is responding to hot leads.</li>
            <li><strong>System Health Check:</strong> Ensure that every form, automation, and funnel is functional across your entire client portfolio.</li>
            <li><strong>Resource Allocation:</strong> Know where your team is spending the most time and adjust their workload to maximize agency efficiency.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The LeadForGrow Multi-Tenant Architecture</h3>
          <p>
            We didn't just build a 'Folder' system. We built an enterprise-grade logic layer for serious agencies.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Instant Account Toggling</h4>
              <p className="text-xl">Move between client accounts instantly from a dropdown menu. Every setting, lead, and automation is isolated but accessible to you in seconds.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Hierarchical Team Permissions</h4>
              <p className="text-xl">Grant your Account Managers access to specific clients while keeping your master 'Admin' dashboard for yourself and your partners.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Universal Snapshot Library</h4>
              <p className="text-xl">Build a library of 'Winning Playbooks'. When a new client in a specific niche joins your agency, deploy your entire funnel and CRM setup in one click.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Isolated Reporting Engines</h4>
              <p className="text-xl">Each sub-account generates their own automated reports. Your clients only see their own data, but you get a rolled-up view of your entire agency performance.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Building a Scalable Agency Brand in India</h2>
          <p>
            The most successful agencies in the Indian market aren't just selling 'Marketing'. They are selling <strong>Business Systems</strong>. By using LeadForGrow's multi-client management platform, you're providing your clients with a world-class technology stack that they can't get elsewhere.
          </p>
          <p>
            When you show a prospect your dashboard—where you can manage their entire sales funnel with professional isolation and oversight—your authority skyrockets. You look like a global operation, even if you're a lean team of three. This level of systemized management is what allows you to charge premium monthly retainers and keep clients for the long term.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Stop managing tabs. Start managing growth.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Give your agency the command center it deserves.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Scale My Agency Dashboard
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow Multi-Client Dashboard",
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
