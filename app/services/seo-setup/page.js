import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Foundational SEO Setup & Technical Optimization for Agencies in India",
  description: "Ensure your agency and client sites rank on the first page of Google. Our LeadForGrow experts handle the technical schema, speed, and keyword mapping for you.",
  keywords: ["foundational SEO setup", "technical SEO audit India", "agency SEO services", "schema markup implementation", "local SEO for small business"],
  alternates: {
    canonical: 'https://leadforgrow.online/services/seo-setup'
  }
};

export default function SEOSetupPage() {
  const benefits = [
    {
      title: "Technical SEO Sanitization",
      text: "We audit and fix your URL structures, sitemaps, and robots.txt to ensure Google's crawlers can index every important page of your site."
    },
    {
      title: "Smart Schema Implementation",
      text: "We inject JSON-LD markup (LocalBusiness, Product, FAQ) that helps your site stand out in search results with rich snippets and star ratings."
    },
    {
      title: "High-Intent Keyword Mapping",
      text: "We don't target 'traffic'; we target 'revenue'. Our experts identify the commercial keywords your customers are actually searching for."
    },
    {
      title: "Core Web Vitals Optimization",
      text: "Google ranks fast sites. We optimize your images, scripts, and server response times to ensure you pass the Core Web Vitals test."
    }
  ];

  const whoIsThisFor = [
    "Local Service Businesses (Hospitals, Law Firms) needing organic calls",
    "Agencies wanting to provide SEO as a premium value-add for clients",
    "E-commerce brands looking to reduce their reliance on paid ads",
    "Scaling Startups that need a rock-solid technical foundation"
  ];

  const whyItMatters = [
    "Paid ads stop working the second you stop paying; SEO builds a long-term asset that grows on its own.",
    "Technical errors are the #1 reason why beautiful websites fail to rank on Google's first page.",
    "First-page visibility is a massive signal of authority and trust to your prospective clients.",
    "LeadForGrow SEO experts ensure your growth is built on a sustainable, organic engine."
  ];

  const faq = [
    {
      q: "How soon can I expect to see results from the SEO Setup?",
      a: "SEO is a marathon, not a sprint. While the foundational setup happens in days, Google typically takes 30-90 days to fully re-index and re-rank your site based on the new optimizations. However, technical fixes often show small 'authority bumps' within two weeks."
    },
    {
      q: "Which keywords do you target?",
      a: "We focus on 'Commercial Intent' keywords. For an agency, this might be 'lead generation for hospitals' rather than just 'what is lead generation'. We want to find people who are ready to buy."
    },
    {
      q: "What is Schema Markup and why do I need it?",
      a: "Schema is a specific code language that tells search engines exactly what your content means. It helps you get 'Rich Results' like FAQ accordions directly in Google Search, which can increase your click-through rate by up to 30%."
    },
    {
      q: "Does LeadForGrow handle backlink building?",
      a: "This specific setup service focuses on 'On-Page' and 'Technical' SEO. While we provide advice on authority building, our core mission is to ensure your own site is a 'Search Engine Magnet' before you start external outreach."
    },
    {
      q: "Will this work for my local business in India?",
      a: "Absolutely. We specialize in Local SEO for the Indian market, ensuring your business shows up in the 'Local 3-Pack' for keywords like '[Service] near me' or '[Service] in [City]'."
    }
  ];

  return (
    <MarketingLayout 
      title="Rank Where Your Customers Are Searching." 
      subtitle="Foundational SEO is the difference between being a 'Invisible Brand' and a 'Market Leader'. Let our experts build your organic growth engine."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Boost My Search Ranking"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Ghost Website" Problem: Why Nobody Finds You</h2>
          <p>
            You've built a beautiful website, you have a great product, but you're only getting traffic when you pay for ads. This is the "Ghost Website" problem. In the eyes of Google, your site lacks the technical signals and keyword relevance required to earn a first-page position.
          </p>
          <p>
            <strong>If you aren't on Page 1, you don't exist.</strong> Over 90% of search traffic stays on the first page of Google. The LeadForGrow SEO Setup service is designed to move you from the shadows to the spotlight by implementing the exact technical standards that Google's algorithm loves.
          </p>
        </div>

        <div>
          <h2>The Four Pillars of High-Ranking Technical SEO</h2>
          <p>
            We don't believe in 'SEO Magic'. We believe in engineering. Our setup process focuses on the four technical pillars that define your organic authority:
          </p>
          <ul>
            <li><strong>The Crawlability Pillar:</strong> Ensuring your site's structure is logical, your sitemaps are clean, and there are no 'Dead Ends' for Google's indexing bots.</li>
            <li><strong>The Relevance Pillar:</strong> Mapping your high-value pages to the specific keywords that buyers use when they're ready to solve a problem.</li>
            <li><strong>The Authority Pillar:</strong> implementing 'Trust Signals' like Schema markup, internal linking, and metadata that tell Google you are an expert in your field.</li>
            <li><strong>The Performance Pillar:</strong> Optimizing for Core Web Vitals (Speed, Responsiveness, Stability) to ensure a perfect user experience that Google rewards with higher rankings.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The LeadForGrow SEO ROI Framework</h3>
          <p>
            SEO isn't just about 'Ranking #1'; it's about generating leads at a lower cost than paid ads. Our experts focus on a revenue-first approach.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Semantic Keyword Strategy</h4>
              <p className="text-xl">We identify 'Cluster' keywords that surround your main service, helping you dominate an entire topic rather than just a single search term.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Rich Snippet Optimization</h4>
              <p className="text-xl">We set up the code needed to get star ratings, prices, and FAQ accordions directly into your search result listing, stealing attention from competitors.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Mobile-First SEO Audit</h4>
              <p className="text-xl">Since most Indian searchers are on mobile, we prioritize mobile rendering and touch-UX to ensure you pass Google's Mobile-First Indexing requirements.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Lead-Capture Path Optimization</h4>
              <p className="text-xl">An SEO visit is useless if they don't enquire. We audit your landing pages to ensure the 'Organic Journey' ends in a LeadForGrow form submission.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Building Long-Term Authority for Agencies</h2>
          <p>
            For agencies, SEO is the ultimate credibility builder. When you tell a prospect you're a marketing expert, the first thing they do is Google you. If you rank #1 for 'Lead Generation Agency [City]', the sale is already half-won.
          </p>
          <p>
            We help you build this "In-House Authority." We handle the technical heavy lifting—the parts that most marketers find tedious or complex—so you can focus on the high-level content strategy that drives your business forward. One solid SEO foundation can feed your agency with high-quality leads for years to come.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Stop paying for every single click.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Build a sustainable, organic lead engine that grows in value every day.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Audit My Search Visibility
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Technical and Foundational SEO Optimization",
        "provider": {
          "@type": "LocalBusiness",
          "name": "LeadForGrow SEO Lab"
        },
        "areaServed": "India",
        "description": "Comprehensive technical SEO audit, schema implementation, keyword mapping and core web vitals optimization."
      })}} />
    </MarketingLayout>
  );
}
