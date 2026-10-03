import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Full-Service Managed Sales Growth & Lead Generation in India",
  description: "Partner with LeadForGrow for 100% managed lead generation. We build your funnels, run your ads, and manage your CRM while you focus on closing deals.",
  keywords: ["managed growth service", "lead generation agency India", "fractional sales operations", "outsourced lead management", "business growth consultant"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/services/managed-growth'
  }
};

export default function ManagedGrowthPage() {
  const benefits = [
    {
      title: "Fractional Sales Operations",
      text: "Get the power of a full sales ops department without the cost of full-time executives. We manage the tech, so you can focus on the talent."
    },
    {
      title: "Continuous Funnel Optimization",
      text: "Our experts perform weekly A/B tests and conversion audits on your websites and forms to ensure your lead volume never drops."
    },
    {
      title: "Ad Spend Efficiency Audit",
      text: "We monitor your Google and Facebook campaign performance, reallocating budget in real-time to the sources that are closing 'Won' deals."
    },
    {
      title: "Quarterly Growth Blueprint",
      text: "Every 90 days, we deliver a comprehensive growth strategy that identifies new markets, new offers, and new channels for your business."
    }
  ];

  const whoIsThisFor = [
    "Scaling Agencies who have outgrown their own manual processes",
    "Medium-sized Enterprises (SMEs) wanting to professionalize their sales machine",
    "Businesses with ₹5L+ monthly ad spend who need expert ROI oversight",
    "Founders looking for a 'Strategic Partner' rather than just a 'Tool'"
  ];

  const whyItMatters = [
    "Hiring a full-time Sales Ops manager costs ₹15L/year+; Managed Growth gives you an entire team for a fraction of that.",
    "Technology changes fast; our experts ensure you're always using the latest AI and automation best-practices.",
    "Data-driven growth is the only way to build a predictable, scalable business model in the Indian market.",
    "LeadForGrow Managed Growth turns your sales department from a cost-center into a high-performance ROI engine."
  ];

  const faq = [
    {
      q: "What is the difference between this and just buying the LeadForGrow software?",
      a: "The software is a tool you manage yourself. Managed Growth is a partnership where our experts handle the strategy, the technical setup, the ongoing optimization, and the performance reporting FOR YOU. It's 'Done-For-You' sales operations."
    },
    {
      q: "Do you also run my Google and Meta ads?",
      a: "Yes. As part of our high-tier Managed Growth service, we oversee the technical implementation and ROI tracking of your ad campaigns to ensure they sync perfectly with your LeadForGrow CRM."
    },
    {
      q: "Is there a minimum commitment for the Managed Growth service?",
      a: "Because growth requires consistency and testing, we typically work on a 3-month or 6-month initial engagement to ensure we have the data needed to produce significant ROI impact."
    },
    {
      q: "How often do we meet for strategy reviews?",
      a: "We have a dedicated monthly strategy session along with weekly performance updates via your internal dashboard. We believe in high transparency and constant communication."
    },
    {
      q: "Can I cancel the managed service while keeping the software?",
      a: "Absolutely. At the end of our managed engagement, you keep all the systems, funnels, and automations we've built. You can then choose to manage them yourself or continue with our expert oversight."
    }
  ];

  return (
    <MarketingLayout 
      title="Stop Managing Tools. Start Managing Growth." 
      subtitle="You're a business leader, not a tech operations manager. Let our elite team handle your sales infrastructure and growth strategy while you scale your vision."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Partner for Managed Growth"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Founder's Trap": When Tech Stalls Your Growth</h2>
          <p>
            In the early stages of a business in India, the founder does everything. You set up the website, you manage the ads, you follow up the leads. But as you scale toward ₹1Cr, ₹5Cr, and beyond, this DIY approach becomes your biggest bottleneck. 
          </p>
          <p>
            <strong>Growth requires specialization.</strong> Every hour you spend fixing a tracking pixel or mapping CRM fields is an hour you aren't spending on high-level strategy or closing massive deals. LeadForGrow Managed Growth allows you to delegate the entire technical sales operation to a team of experts who eat, sleep, and breathe lead generation.
          </p>
        </div>

        <div>
          <h2>A Strategic Partnership, Not Just a Software Account</h2>
          <p>
            Managed Growth is our flagship service level. It is designed for businesses that recognize that technology alone isn't enough—you need the <strong>human expertise</strong> to wield it correctly. Our process involves a full-scale takeover of your sales operations:
          </p>
          <ul>
            <li><strong>Audit & Architecture:</strong> We map your current sales funnel and rebuild it for maximum efficiency on the LeadForGrow platform.</li>
            <li><strong>Continuous Conversion Optimization:</strong> We don't believe in 'Set and Forget'. We are constantly testing headlines, forms, and email sequences to squeeze more ROI out of your ad spend.</li>
            <li><strong>ROI Performance Oversight:</strong> We act as your fractional CFO for marketing, ensuring that every rupee you spend is tracked and assigned to a specific revenue outcome.</li>
            <li><strong>Advanced AI Implementation:</strong> We deploy the latest in AI lead-scoring and automation to ensure your team's time is only spent on the most 'Sales-Ready' leads.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The Managed Growth Difference: Data-Driven Dominance</h3>
          <p>
            While your competitors are guessing about their marketing, you'll be operating with the precision of a multi-national enterprise. Here is what we bring to the table:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Revenue-First Campaign Design</h4>
              <p className="text-xl">We build funnels that aren't just 'pretty'—they are built to close. We focus on the bottom-of-the-funnel commercial keywords that drive instant ROI.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Real-Time Resource Reallocation</h4>
              <p className="text-xl">If we see a specific ad campaign is underperforming, we don't wait for your monthly report. We kill it and move that budget to your winning campaigns instantly.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Scale-Ready Sales Infrastructure</h4>
              <p className="text-xl">We build your CRM and automation sequences to handle growth. Whether you're processing 100 leads or 10,000, your system will remain fast and reliable.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Transparence ROI Dashboards</h4>
              <p className="text-xl">No more 'Vagueness'. You get a custom dashboard that tells you your exact Customer Acquisition Cost (CAC) and Lifetime Value (LTV) in real-time.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Why Elite Indian Agencies Choose Managed Growth</h2>
          <p>
            Agencies use our Managed Growth service to act as their <strong>Strategic Fulfillment Arm</strong>. We handle the heavy lifting of the sales tech for your clients, allowing you to function as the high-level consultant. This relationship allows you to take on much larger, 'Enterprise-Level' clients without needing to hire a massive in-house operations team.
          </p>
          <p>
            You get the credit for the results, your clients get a world-class technology stack, and we handle the technical execution. It is the most efficient way to scale an agency in the modern competitive market.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Ready for a Strategic Sales Partner?</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Stop struggling with settings and start scaling with experts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
              Apply for Managed Growth
            </a>
            <a href="/contact" className="inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-12 py-5 rounded-3xl text-2xl font-bold transition hover:bg-slate-50">
              Schedule a Discovery Call
            </a>
          </div>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Managed Sales Growth and Operations",
        "provider": {
          "@type": "Organization",
          "name": "ScaleDesk Technology Private Limited"
        },
        "areaServed": "India",
        "description": "Full-service sales operation management, including funnel optimization, ad oversight, and fractional CRM management."
      })}} />
    </MarketingLayout>
  );
}
