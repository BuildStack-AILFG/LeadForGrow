import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Lead ROI & Sales Analytics for Agencies & Small Teams in India",
  description: "Track your lead conversion ratios, team response times, and marketing ROI with LeadForGrow. Simple, visual reporting built for business owners.",
  keywords: ["sales analytics software", "lead ROI tracking India", "agency reporting tool", "conversion rate analytics", "sales team performance metrics"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/product/analytics'
  }
};

export default function ProductAnalyticsPage() {
  const benefits = [
    {
      title: "Identify Winning Channels",
      text: "Instantly see which ads or pages are bringing in 'Won' deals, not just clicks. Optimize your budget where it counts."
    },
    {
      title: "Team Performance Metrics",
      text: "Track response times, contact rates, and conversion ratios for every team member. Drive real accountability."
    },
    {
      title: "Visual ROI Reporting",
      text: "No more messy spreadsheets. Simple, clear charts that show your lead pipeline health and revenue forecast."
    },
    {
      title: "Zero Complexity Data",
      text: "Designed for business owners, not data scientists. Get the answers you need in 10 seconds or less."
    }
  ];

  const whoIsThisFor = [
    "Agency Owners who need to prove results to clients",
    "Marketing Managers optimizing ad spend",
    "Business Owners who want to know 'What's working?'",
    "Sales Directors tracking team efficiency"
  ];

  const whyItMatters = [
    "If you can't measure your response time, you can't improve your conversion rate.",
    "Most businesses waste 40% of their marketing budget on non-converting leads.",
    "Blindly running ads is an expensive gamble. Analytics makes it a predictable investment.",
    "LeadForGrow gives you the 'Data Truth' you need to scale with confidence."
  ];

  const faq = [
    {
      q: "Can I see which specific marketing source generated a 'Won' lead?",
      a: "Yes. LeadForGrow uses advanced attribution tracking to tie every deal in your CRM back to its original source—be it a specific Google Ad keyword, a Facebook campaign, or a guest blog post."
    },
    {
      q: "Does the system track how fast my team replies to leads?",
      a: "Absolutely. 'Speed-to-Lead' is one of our core metrics. You can see the average response time for your entire team and drill down into individual performance to identify training needs."
    },
    {
      q: "Are these reports suitable for sharing with my agency clients?",
      a: "Yes. Our reports are designed to be clean, visual, and authoritative. You can provide your clients with data-backed proof of the leads you've generated and, more importantly, the revenue impact of those leads."
    },
    {
      q: "Do I need to be a data scientist to understand the analytics?",
      a: "No. We've intentionally avoided complex 'Big Data' jargon. Our dashboard focuses on the most important metrics for business growth: Number of Leads, Cost per Lead, Response Time, and Conversion Rate."
    },
    {
      q: "Can I export my data for further analysis?",
      a: "Yes. All your analytics and lead data can be exported to CSV or synced with external sheets if you wish to perform your own deeper calculations or audit."
    }
  ];

  return (
    <MarketingLayout 
      title="Track What Converts, Not Just What Clicks." 
      subtitle="Stop guessing which marketing is working. Get real-time insights into your lead ROI and team performance with simple, clear reports."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Track What Converts"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Marketing Blind Spot": Why Impressions Don't Pay Bills</h2>
          <p>
            Most business owners and agencies in India are flying blind. They see "Clicks" and "Impressions" on their Google Ads dashboard, but they have no idea if those clicks ever turned into a real inquiry or, eventually, a closed deal. This is the marketing blind spot, and it's where profitable businesses go to die.
          </p>
          <p>
            <strong>LeadForGrow Analytics brings 100% transparency to your sales funnel.</strong> We believe you shouldn't just track traffic; you should track revenue. Our simple yet powerful reporting suite bridges the gap between your marketing spend and your actual sales outcomes.
          </p>
        </div>

        <div>
          <h2>From Data Chaos to Decision Clarity</h2>
          <p>
            If you're still using Excel to calculate your ROI, you're already behind. LeadForGrow's visual reporting engine processes your data in real-time, giving you a daily "Growth Scorecard" that tells you exactly how your business is performing:
          </p>
          <ul>
            <li><strong>The Pipeline Health:</strong> See your total active leads, their source, and their current stage in the sales process.</li>
            <li><strong>The Speed Metric:</strong> Monitor your team's average response time. If it's over 5 minutes, you're losing money—our system highlights exactly where.</li>
            <li><strong>The Conversion Ratio:</strong> Know which sales rep has the highest closing rate and which marketing channel produces the highest 'quality' lead.</li>
            <li><strong>The ROI Truth:</strong> Finally answer the question: "Is my marketing budget actually bringing in more revenue than it costs?"</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>LeadForGrow Measurement Pillar: Built for Accountability</h3>
          <p>
            Accountability is the foundation of a high-performance sales culture. LeadForGrow provides the objective data needed to drive your team to win.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Individual Performance Audits</h4>
              <p className="text-xl">Identify your stars and coach your underperformers. See exactly who's following up on time and who's letting hot leads go cold.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Source-Level Attribution</h4>
              <p className="text-xl">Kill the 'Zombies'. Identify which ad campaigns are wasting your money and reallocate your budget to the channels that actually close deals.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Monthly Growth Forecasting</h4>
              <p className="text-xl">Based on your historical conversion rates, LeadForGrow can help you predict next month's revenue with greater accuracy than a spreadsheet ever could.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Lead Quality Scoring</h4>
              <p className="text-xl">Automatically identify your 'Hot Leads' based on engagement and source data, so your team focuses their energy on the enquiries most likely to buy.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>The Agency "Proof of Value" Dashboard</h2>
          <p>
            As an agency, your most powerful tool for client retention is <strong>Proof</strong>. If you can show your client a beautiful, automated report that says, "We brought you 42 leads this month, 12 of which have already closed for ₹[X] lakh," they will never want to leave you.
          </p>
          <p>
            LeadForGrow's reporting is designed to be client-ready. It demonstrates your expertise as a growth partner, not just a 'Facebook Ads guy'. You become a strategic asset because you are providing the data truth that the client needs to scale their business.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20">
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Stop flying blind and start growing with data.</p>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12">
            Join the elite businesses using LeadForGrow to optimize their ROI and build a predictable sales machine.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            View Your Growth Scorecard
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow Analytics Dashboard",
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
