import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Secure Agency Hosting & Custom Domain Management in India",
  description: "Launch secure, fast, and branded agency websites with LeadForGrow. Global edge hosting, free SSL, and one-click custom domain setup. Build trust instantly.",
  keywords: ["agency website hosting", "custom domain for SaaS", "secure lead capture hosting India", "unlimited website hosting", "fast edge hosting for funnels"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/product/hosting'
  }
};

export default function HostingPage() {
  const benefits = [
    {
      title: "Professional Custom Domains",
      text: "Launch your agency or client projects on your own domain (e.g., yourname.com). Build trust instantly with a professional URL."
    },
    {
      title: "Blazing Fast Edge Hosting",
      text: "Global CDN hosting ensures your funnels load in milliseconds, no matter where your leads are located."
    },
    {
      title: "Automatic SSL & Security",
      text: "Every site comes with free SSL encryption. Protect your lead data and show the 'Secure' padlock on every browser."
    },
    {
      title: "One-Click Deployment",
      text: "No FTP, no CPanel, no technical mess. Connect your domain once and publish updates with a single click."
    }
  ];

  const whoIsThisFor = [
    "Agencies building high-end client websites",
    "Businesses who want a branded online presence",
    "Solopreneurs launching their first funnel",
    "Non-technical founders who want 'It just works' hosting"
  ];

  const whyItMatters = [
    "leads will never trust a 'free-subdomain.mystite.com' URL with their sensitive contact data.",
    "A slow hosting provider will kill your conversion rates before your page even loads.",
    "Technical setup is a huge time-sink that takes you away from closing deals.",
    "LeadForGrow handles all the 'Tech Heavy Lifting' so you can focus on building your business."
  ];

  const faq = [
    {
      q: "How many custom domains can I connect to my LeadForGrow account?",
      a: "The number of domains depends on your subscription tier. However, we've designed our agency plans to be incredibly generous, allowing you to manage multiple client subdomains and main domains from a single dashboard."
    },
    {
      q: "Do I need to buy an SSL certificate separately?",
      a: "No. LeadForGrow provides free, automated SSL certificates (Let's Encrypt) for every domain you connect. We believe security should be standard, not an upsell."
    },
    {
      q: "Will my website load fast in India and globally?",
      a: "Yes. We use a global Edge Network (CDN). This means your website content is cached in data centers throughout India and around the world, ensuring lightning-fast load times for your local prospects."
    },
    {
      q: "What happens if I already have a domain on GoDaddy or Namecheap?",
      a: "No problem. You keep your domain provider. You simply point your DNS records to our secure hosting engine. We provide clear, 3-step instructions to get you connected in under 5 minutes."
    },
    {
      q: "Is there a limit to the traffic or visitors my site can handle?",
      a: "Our hosting infrastructure is built on elastic cloud technology that scales with your traffic. Whether you have 100 visitors or 100,000, your site will remain fast and reliable."
    }
  ];

  return (
    <MarketingLayout 
      title="Professional Brands Belong on Professional Domains." 
      subtitle="Security and speed shouldn't be technical hurdles. Launch secure, fast, and branded websites without ever touching a server."
      heroImage="/images/hero/builder.png"
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Launch on Your Own Domain"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Subdomain Trap": Why Cheap Hosting Kills Lead Trust</h2>
          <p>
            In the world of professional services and B2B agencies in India, <strong>Perception is Reality</strong>. If you send a high-value prospect to a URL like <code>my-agency.free-builder.com</code>, you've already lost the deal. Professional clients expect a professional digital environment.
          </p>
          <p>
            When a lead sees the "Not Secure" warning in their browser or a generic subdomain, their first thought is: "Is my data safe with this company?" LeadForGrow Hosting is designed to eliminate this friction by providing elite, secure, and branded infrastructure for every funnel you build.
          </p>
        </div>

        <div>
          <h2>Enterprise-Grade Performance Without the IT Department</h2>
          <p>
            Traditional hosting requires you to manage servers, CPanels, FTP accounts, and security updates. It's a technical nightmare that takes you away from your core mission: growing your business. LeadForGrow Hosting is different. We've abstracted the complexity into a single "Publish" button.
          </p>
          <ul>
            <li><strong>Global Edge Network:</strong> Your site is hosted "on the edge," meaning it's physically closer to your visitors in Mumbai, Delhi, or Bangalore for near-instant loading.</li>
            <li><strong>Hardened Security:</strong> Every site is protected from DDoS attacks and unauthorized access by default.</li>
            <li><strong>Seamless Domain Binding:</strong> Connect any domain provider (GoDaddy, Namecheap, etc.) in minutes with our automated validation system.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The LeadForGrow "Just Works" Hosting Promise</h3>
          <p>
            We believe you should spend your time building funnels, not managing DNS headers. Here is why our hosting is the preferred choice for scaling agencies:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Automatic HTTPS Encryption</h4>
              <p className="text-xl">Every lead capture form you launch is automatically encrypted. We handle the SSL renewal and installation so you never see that 'Not Secure' warning again.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Unlimited Bandwidth for Growth</h4>
              <p className="text-xl">Scale your ads with confidence. Whether you're running meta-scale campaigns or viral social threads, our infrastructure scales to meet your traffic demand.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. SEO-Optimized Infrastructure</h4>
              <p className="text-xl">Google loves fast sites. Our lightweight server-side rendering and edge delivery help you rank higher in search results than bloated, unoptimized hosting.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. High-Availability Reliability</h4>
              <p className="text-xl">Your business never sleeps, and neither does your website. We host your site on managed cloud infrastructure so your leads can find you.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>The Agency Advantage: Whitelabeled Hosting</h2>
          <p>
            As an agency, you aren't just selling 'websites'—you're selling 'reliable solutions'. When you use LeadForGrow, you can host your clients' projects on their own custom domains while managing everything from your master agency dashboard.
          </p>
          <p>
            This allows you to provide a "Hosting & Maintenance" service that adds recurring revenue to your agency bottom line without the headache of managing actual servers. You look like a tech giant to your clients, while LeadForGrow handles the heavy lifting in the background.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Professionalize your presence in one click.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Fast, secure, and branded hosting that works as hard as your sales team.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Connect Your Domain
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow Edge Hosting",
        "operatingSystem": "Web-based",
        "applicationCategory": "InfrastructureApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        }
      })}} />
    </MarketingLayout>
  );
}
