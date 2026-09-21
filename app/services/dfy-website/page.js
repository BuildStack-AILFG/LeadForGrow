import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Professional DFY Website Design Services for Agencies in India",
  description: "Get a premium, high-converting agency website built for you by LeadForGrow experts. Launch in 7 days with native lead capture and automation.",
  keywords: ["DFY website design", "agency website builder service", "done for you landing pages", "high converting website design India", "lead generation website service"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/services/dfy-website'
  }
};

export default function DFYWebsitePage() {
  const benefits = [
    {
      title: "Expert Blueprint Design",
      text: "We don't just 'build a site'. We design a lead-generation framework based on conversion data from 500+ successful agencies."
    },
    {
      title: "Zero Setup Friction",
      text: "Stop wasting months learning a builder. Our experts handle the layout, forms, and automation setup so you can go live in 7 days."
    },
    {
      title: "Psychology-Driven Copy",
      text: "Our team writes high-converting copy that speaks directly to your clients' pain points and positions you as the only solution."
    },
    {
      title: "Full Tech Integration",
      text: "Your site comes pre-connected to our CRM, email engine, and WhatsApp automation. No technical 'stitching' required."
    }
  ];

  const whoIsThisFor = [
    "Busy Agency Owners who need a pro site yesterday",
    "Professionals (Consultants, Doctors) wanting elite branding",
    "Businesses migrating from slow Wordpress themes",
    "Growth teams who want a 'Battle-Tested' funnel"
  ];

  const whyItMatters = [
    "A DIY website often looks 'cheap' and actively turns away high-ticket clients.",
    "Your time is best spent closing deals, not fighting with drag-and-drop margins.",
    "Speed to market is a competitive advantage; we launch while your competitors are still planning.",
    "LeadForGrow experts know exactly which buttons and sections drive the most enquiries."
  ];

  const faq = [
    {
      q: "How long does the DFY Website process take?",
      a: "Our standard delivery time is 7-10 business days. This includes the initial strategy call, content creation, design implementation, and technical automation setup."
    },
    {
      q: "Do I need to provide the copy and images?",
      a: "While you can provide specific brand assets, our team is equipped to write goal-oriented copy and source/generate high-quality imagery for your project as part of the service."
    },
    {
      q: "Will I be able to edit the site myself later?",
      a: "Yes! Once we deliver the site, you have full access to our no-code builder. You can change text, swap images, or add new sections with zero technical knowledge."
    },
    {
      q: "Is the hosting and domain included?",
      a: "The DFY service includes the setup of your hosting and domain binding. The ongoing hosting costs are covered by your LeadForGrow platform subscription."
    },
    {
      q: "Do you offer custom revisions?",
      a: "Yes. We include two rounds of comprehensive revisions to ensure the final product perfectly aligns with your brand vision and business goals."
    }
  ];

  return (
    <MarketingLayout 
      title="You Focus on Revenue. We Build the Engine." 
      subtitle="Stop fighting with DIY builders. Get a battle-tested, high-converting website built by our conversion experts in under 7 days."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Order My DFY Website"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Agency Paradox": Too Busy to Scale Your Own Brand</h2>
          <p>
            The most common problem we see with successful agencies in India is that they are so focused on delivering results for clients that their own digital presence is a mess. You're using an outdated Wordpress theme, your contact form is broken, and you haven't updated your case studies in a year.
          </p>
          <p>
            <strong>Your website is your silent salesman.</strong> If it looks dated or functions poorly, it's whispering to your prospects that you might be unreliable. The LeadForGrow DFY Website service is designed to break this paradox. We build your elite digital home so you can continue focusing on client fulfillment.
          </p>
        </div>

        <div>
          <h2>Not Just a 'Site'—A Revenue Framework</h2>
          <p>
            When you hire a generic web designer, they ask: "What colors do you like?" When you hire the LeadForGrow DFY team, we ask: "What is your target cost-per-lead?"
          </p>
          <p>
            Our approach is 100% data-driven. We use the same conversion frameworks that have generated thousands of leads for our platform users. We don't just place images; we architect a journey that leads the visitor from 'Curious' to 'Qualified Enquirer'.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The DFY Delivery Blueprint: From Strategy to Success</h3>
          <p>
            We've refined our process to be fast, efficient, and results-oriented. Here is what happens when you partner with our experts:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Strategic Discovery Call</h4>
              <p className="text-xl">We dive deep into your target audience, your high-ticket offers, and your sales process to ensure the site's architecture matches your business model.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Professional Conversion Copywriting</h4>
              <p className="text-xl">Our copywriters write persuasive, benefit-driven headlines and body text that overcome objections and drive the visitor toward your call-to-action.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Rapid Implementation & UX Design</h4>
              <p className="text-xl">Our designers build your site on the high-performance LeadForGrow infrastructure, ensuring it is mobile-responsive and lightning-fast.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Full Technical Automation Handover</h4>
              <p className="text-xl">We don't just design; we connect. Your forms, CRM tracking, and initial automated follow-ups are all active and tested before we go live.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Why Indian Business Owners Trust Our Expert Team</h2>
          <p>
            Hiring a local freelancer can be a gamble, and hiring a global agency can be prohibitively expensive. LeadForGrow offers the perfect middle ground: <strong>Enterprise expertise at a growth-friendly price.</strong>
          </p>
          <p>
            Because we use our own platform to build your site, we have an unfair advantage. We can deploy complex logic and secure hosting that would cost thousands elsewhere, included in our streamlined DFY service. You get a site that doesn't just look world-class—it functions like a tech giant's site.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20">
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Stop planning and start launching.</p>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
            Give your business the high-performance digital engine it deserves. Let our experts build it for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
              Get Started with DFY
            </a>
            <a href="/contact" className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-12 py-5 rounded-3xl text-xl font-bold transition hover:bg-slate-50">
              Speak to a Consultant
            </a>
          </div>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Website Design and Implementation",
        "provider": {
          "@type": "LocalBusiness",
          "name": "LeadForGrow Services"
        },
        "areaServed": "India",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "DFY Website Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Professional Agency Website Setup"
              }
            }
          ]
        }
      })}} />
    </MarketingLayout>
  );
}
