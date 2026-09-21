import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "High-Converting Website & Funnel Builder for Agencies in India",
  description: "Launch professional, lead-capture-optimized websites in minutes with LeadForGrow. 50+ templates, native forms, and no dev dependency. Start free.",
  keywords: ["website funnel builder", "landing page builder India", "agency website templates", "conversion rate optimization", "lead capture website"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/product/builder'
  }
};

export default function BuilderPage() {
  const benefits = [
    {
      title: "50+ Goal-Oriented Templates",
      text: "Designed specifically for agency niches. Our layouts don't just look pretty; they are engineered for maximum lead capture."
    },
    {
      title: "Native Lead Capture",
      text: "Stop fighting with third-party plugins. Our forms and widgets are built directly into the engine for 100% reliable tracking."
    },
    {
      title: "Zero Dev Dependency",
      text: "Launch complex funnels and websites in minutes with our intuitive drag-and-drop builder. No coding required, ever."
    },
    {
      title: "Lightning Fast Performance",
      text: "Google-standard speed that boosts your SEO ranking and keeps impatient visitors from bouncing off your page."
    }
  ];

  const whoIsThisFor = [
    "Busy Founders who need to launch fast",
    "Scaling Agencies managing multiple client funnels",
    "Sales Teams tired of low-converting landing pages",
    "Digital Marketers who want complete creative control"
  ];

  const whyItMatters = [
    "Most websites are just 'online brochures'—they look great but leak revenue every day.",
    "A slow or confusing website is the fastest way to lose a hot lead to a competitor.",
    "Dev dependencies create bottlenecks that slow down your agency's growth.",
    "LeadForGrow bridges the gap between beautiful design and brutal efficiency."
  ];

  const faq = [
    {
      q: "Do I need any coding skills to use the builder?",
      a: "No, LeadForGrow is a 100% no-code platform. You can drag and drop elements, change colors, and swap images without ever touching a line of code. If you can use a mouse, you can build a high-converting funnel."
    },
    {
      q: "Can I use my own custom domain?",
      a: "Absolutely. You can connect your existing domain (e.g., youragency.com) to any website or funnel you build on our platform. We even handle the SSL certificate setup for you."
    },
    {
      q: "Are the templates mobile-responsive?",
      a: "Yes. Every template in our library is built with a 'Mobile-First' approach. Since over 70% of lead traffic comes from mobile devices in India, we ensure your site looks perfect on every screen size."
    },
    {
      q: "How does the native lead capture work?",
      a: "Unlike Wordpress, where you need separate plugins for forms, LeadForGrow forms are built natively into the builder. This means faster load times, zero data loss, and instant sync with your CRM dashboard."
    },
    {
      q: "Is there a limit to how many pages or funnels I can build?",
      a: "Your capacity depends on your selected plan. However, even our entry-level tiers are designed to support a growing business's needs without restrictive artificial limits."
    }
  ];

  return (
    <MarketingLayout 
      title="Stop Building 'Just' Websites. Build Conversion Engines." 
      subtitle="Most websites look good but leak leads. LeadForGrow websites are engineered to capture, qualify, and close every visitor."
      heroImage="/images/hero/builder.png"
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Build a Conversion-Ready Website"
    >
      <section className="space-y-16">
        <div>
          <h2>The Problem with "Online Brochures"</h2>
          <p>
            In today's fast-paced digital economy, having a "pretty" website isn't enough. Most business owners and agencies in India make the mistake of building an online brochure—a site that tells people who they are but never asks them for an enquiry.
          </p>
          <p>
            When a potential client visits your site, they are usually looking for a solution to a problem. If your site doesn't immediately show them how you solve it and provide a clear, friction-free way to contact you, they will leave and never come back. This is known as "Visitor Leakage," and it's costing you money every hour.
          </p>
        </div>

        <div>
          <h2>LeadForGrow: Engineered for Capture, Not Just Design</h2>
          <p>
            We realized that high-performance teams don't have time to wait 4 weeks for a developer to change a button or launch a landing page. That's why we built the LeadForGrow Funnel & Website Builder. It's designed to bring the power of top-tier conversion rate optimization (CRO) to your fingertips.
          </p>
          <p>
            Our builder doesn't start with a blank white page; it starts with <strong>proven frameworks</strong>. Whether you need an appointment booking funnel for a hospital, a lead gen site for a real estate agent, or a multi-client portal for your agency, we have the blueprint ready for you.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>Why Our Builder Outperforms WordPress and Wix</h3>
          <p>
            While generic builders are great for personal blogs, they lack the specialized infrastructure needed for serious lead generation. Here is how LeadForGrow gives you the edge:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Optimized for Speed-to-Lead</h4>
              <p className="text-lg">Every millisecond counts. Our pages load instantly nationwide, ensuring you don't lose impatient leads who might bounce on a slower site.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Native Form Integration</h4>
              <p className="text-lg">No more broken plugins. Our capture widgets are hard-coded into the engine, ensuring 100% data delivery to your CRM dashboard every single time.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. A/B Testing Built-In</h4>
              <p className="text-lg">Don't guess what works. Easily test different headlines or button colors to see which version captures more leads for your business.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Effortless Domain Management</h4>
              <p className="text-lg">Connect your professional domain in one click. We handle the technical DNS and SSL heavy lifting so you look like a pro instantly.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Empowering Indian Agencies to Scale Fulfillment</h2>
          <p>
            For agencies, the bottleneck is often fulfillment. Building a custom site for every new client is a massive time-sink. With LeadForGrow, you can create <strong>Snapshots</strong>—templated funnels that you can deploy for a new client in under 5 minutes.
          </p>
          <p>
            This allows you to scale from managing 5 clients to 50 clients without increasing your headcount. You provide a world-class technology stack to your clients, branded as your own, and focus on what truly matters: generating results.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-16 text-center">
          <p className="text-2xl font-light italic">
            "We used to spend hours every week managing WordPress updates and fixing broken contact forms. LeadForGrow replaced our entire web stack and helped us launch client funnels 4x faster. It's the best investment we've made for our agency."
          </p>
          <p className="mt-6 font-bold text-slate-900 dark:text-white">— Rohan M., Digital Marketing Agency Owner, Bangalore</p>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow Website Builder",
        "operatingSystem": "Web-based",
        "applicationCategory": "DesignApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        }
      })}} />
    </MarketingLayout>
  );
}
