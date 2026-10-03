import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "White-Label Lead Management & CRM for Marketing Agencies",
  description: "Launch your own branded SaaS in minutes. LeadForGrow's white-label solution allows you to put your logo, domain, and colors on our elite technology.",
  keywords: ["white-label CRM for agencies", "branded lead management software", "resell SaaS marketing tools", "agency branded dashboard", "white label funnel builder India"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/agencies/white-label'
  }
};

export default function WhiteLabelPage() {
  const benefits = [
    {
      title: "100% Brand Ownership",
      text: "Replace all LeadForGrow branding with your own. Your logo, your colors, and your company name on every screen."
    },
    {
      title: "Custom Domain Mapping",
      text: "Host the entire platform on your own sub-domain (e.g., portal.youragency.com). Your clients never see our URL."
    },
    {
      title: "Branded Client Experience",
      text: "Provide your clients with a professional login area that feels like you built it from scratch. Build massive perceived value."
    },
    {
      title: "Unlock Recurring Revenue",
      text: "Stop being just a service provider. Become a technology provider and charge a monthly subscription fee for 'Your' platform."
    }
  ];

  const whoIsThisFor = [
    "Growth Agencies wanting to build proprietary brand equity",
    "SaaS Resellers looking for a ready-to-market lead gen suite",
    "Marketing Consultants productizing their expert workflows",
    "Agency Owners tired of 'Renting' other companies' brands"
  ];

  const whyItMatters = [
    "When you use a generic tool, you're building someone else's brand; with White-Label, you're building YOURS.",
    "White-labeling allows you to charge premium prices by positioning yourself as a specialized tech partner.",
    "Bespoke software development costs Lakhs; LeadForGrow gives you the same power for a tiny monthly fee.",
    "Own the client relationship by owning the tools they use every single day to manage their business."
  ];

  const faq = [
    {
      q: "Can I use my own logo and brand colors?",
      a: "Yes. Our white-label settings allow you to upload your agency logo and set a primary brand color that will be applied throughout the client dashboard."
    },
    {
      q: "Does the white-labeled app live on my own domain?",
      a: "Absolutely. You can map the entire LeadForGrow application to a custom domain of your choice, ensuring a seamless and branded experience for your clients."
    },
    {
      q: "Will LeadForGrow's name appear in the support or emails?",
      a: "No. On our White-Label tier, we remove all references to LeadForGrow. You can even customize the system-sending email address so notifications come for your agency email."
    },
    {
      q: "Is there an extra cost for the white-label feature?",
      a: "White-labeling is a premium feature included in our Agency-specific plans. It is designed for businesses who are ready to scale their brand and productize their services."
    },
    {
      q: "Can I resell the platform at any price I want?",
      a: "Yes. You have complete control over your own pricing and bundling. We provide the elite technology at a wholesale rate, and you charge your clients whatever your market will support."
    }
  ];

  return (
    <MarketingLayout 
      title="Own the Tech. Own the Client. Own the Future." 
      subtitle="Stop building someone else's brand. Launch your own world-class marketing and sales platform in under 10 minutes."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Launch My Branded App"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Software Rental" Trap: Why Agencies Lack Exit Value</h2>
          <p>
            Most agencies in India operate on a "Rental" model. You rent your client's attention from Google, and you rent your tools from third-party SaaS giants. When you stop paying, you're left with nothing. Your business has no proprietary assets, and therefore, no significant exit value.
          </p>
          <p>
            <strong>White-Labeling turns your agency into a SaaS company.</strong> It allows you to build real equity in your own brand. By providing your clients with a tool branded as YOURS, you move from being a replaceable service provider to an essential technology partner.
          </p>
        </div>

        <div>
          <h2>A Professional Edge That Justifies Premium Pricing</h2>
          <p>
            When a client sees you're using the same generic CRM as 10,000 other agencies, it's hard to justify a ₹1,00,000/month retainer. But when you provide them access to your own proprietary "Agency Growth Engine," the conversation changes.
          </p>
          <ul>
            <li><strong>The Value Perception:</strong> Your clients see that you've invested in building (or owning) your own technology stack. This signals a higher level of commitment and expertise.</li>
            <li><strong>Multi-Channel Branding:</strong> From the login screen to the automated WhatsApp reports, your brand is the only one they see.</li>
            <li><strong>Client Stickiness:</strong> It is much harder for a client to fire an agency when their entire sales pipeline and lead history live inside that agency's tool.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The Anatomy of the LeadForGrow White-Label Suite</h3>
          <p>
            We don't just put your logo in the corner. We give you a fully localized and customized instance of our world-class sales tech.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Custom Domain DNS Binding</h4>
              <p className="text-xl">Host 'Your' app on app.yourbrand.com. We handle the SSL and secure hosting so it feels like a native part of your website.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Branded Email & WhatsApp SMTP</h4>
              <p className="text-xl">Every notification sent to your clients or their leads comes from YOUR authorized accounts. Total brand continuity across every channel.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Customizable User Interface</h4>
              <p className="text-xl">Set your primary and secondary colors. Our UI adapts to your brand identity, ensuring the dashboard feels like a custom-built solution for your niche.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Proprietary Snapshot Sharing</h4>
              <p className="text-xl">Create your own library of winning funnels and lead systems. Share them with your clients as 'Your Secret Sauce' that they can't get anywhere else.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Scaling Recurring Revenue Without Increasing Overhead</h2>
          <p>
            The holy grail of agency ownership is <strong>Recurring Revenue</strong>. Traditional service retainers are hard to sell and even harder to keep. But a "Technology + Service" bundle is a no-brainer for most businesses. 
          </p>
          <p>
            LeadForGrow White-Label allows you to charge a 'Tech Access Fee' alongside your management fee. As you scale from 10 to 100 clients, your software margins stay high, while your fulfillment becomes automated. This is how you build a lean, high-profit agency that is attractive to potential buyers or investors.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Stop Renting. Start Owning.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Give your agency the proprietary tech edge it needs to dominate your niche.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Get My White-Label Account
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow White-Label Platform",
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
