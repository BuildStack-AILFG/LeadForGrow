import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Best Lead Management CRM for Small Business & Agencies in India",
  description: "Scale your agency with LeadForGrow's lead management CRM. Automate follow-ups, track won/lost leads, and ensure zero enquiries are missed. Start your free trial.",
  keywords: ["lead management system", "CRM for small business", "agency lead tracking", "sales lead automation", "India lead management software"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/product/crm'
  }
};

export default function CRMPage() {
  const benefits = [
    {
      title: "Simple, Visual Pipeline",
      text: "See exactly where every lead stands. Move from 'New' to 'Won' with a single click. No complex training required."
    },
    {
      title: "Centralized Communication",
      text: "Stop hunting for WhatsApp chats or emails. Keep every note, status update, and follow-up in one secure place."
    },
    {
      title: "Team Accountability",
      text: "Easily assign leads to team members and track their response times. Know who is closing and who is missing out."
    },
    {
      title: "Designed for Speed",
      text: "Traditional CRMs are too bloated for small teams. Ours is built for fast-paced agencies who need to close deals, not fill forms."
    }
  ];

  const whoIsThisFor = [
    "Small Teams managing 50+ leads a month",
    "Agencies tired of using Excel for lead tracking",
    "Sales Managers who need a high-level overview",
    "Owner-operators who want to get organized"
  ];

  const whyItMatters = [
    "Scattered data is the silent killer of agency growth.",
    "Excel is not a CRM. It's where leads go to be forgotten and ignored.",
    "Without clear ownership, leads get double-contacted or never contacted at all.",
    "LeadForGrow gives you the same control as enterprise teams without the technical headache."
  ];

  const faq = [
    {
      q: "How is LeadForGrow different from a traditional CRM?",
      a: "Traditional CRMs like Salesforce are designed for large enterprises with complex needs. LeadForGrow is built specifically for small businesses and agencies who need to act FAST. We focus on lead speed, instant automation, and a visual interface that requires zero training."
    },
    {
      q: "Can I import my existing leads from Excel or Google Sheets?",
      a: "Yes! You can easily import your CSV data into our dashboard. We also allow you to connect your existing sheets via our smart integration layer so you don't lose any historical data."
    },
    {
      q: "Does this work for Indian businesses using WhatsApp?",
      a: "Absolutely. We understand the Indian market behavior. Our system is optimized to capture leads and trigger instant notifications so you can follow up via WhatsApp or phone within seconds of the enquiry."
    },
    {
      q: "How many team members can I add to the CRM?",
      a: "Our plans are designed to be scalable. Depending on your tier, you can add multiple team members, assign them specific roles, and track their individual conversion rates."
    },
    {
      q: "Is my data secure and private?",
      a: "We take data security seriously. All lead data is encrypted and stored in secure cloud environments. We never sell your data, and we provide multi-tenant isolation for agencies managing client accounts."
    }
  ];

  return (
    <MarketingLayout 
      title="Manage Leads Without the CRM Headache." 
      subtitle="Excel and WhatsApp chats fail as you scale. One unified dashboard for all your enquiries, ownership, and statuses."
      heroImage="/images/hero/crm.png"
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Manage Leads with Clarity"
    >
      <section className="space-y-16">
        <div>
          <h2>The Hidden Cost of "Leaky" Lead Management</h2>
          <p>
            Every day, small businesses and agencies in India lose thousands in revenue not because they lack leads, but because they lack <strong>control</strong>. You're likely managing enquiries through a chaotic mix of WhatsApp messages, scattered emails, and perhaps an Excel sheet that hasn't been updated in weeks.
          </p>
          <p>
            When a lead comes in, who follows up? How long does it take? Was the lead contacted? If your answer involves "I'll check my WhatsApp," you're leaking revenue. Research shows that 78% of customers buy from the company that responds to them first. If you aren't managing that lead in a centralized system, your competitor who is will win every time.
          </p>
        </div>

        <div>
          <h2>Why Legacy CRMs Fail Small Businesses and Agencies</h2>
          <p>
            Most traditional CRMs are built for people who spend their whole day "data entering." They are bloated, expensive, and require weeks of training. For a fast-moving agency or a busy local business, these systems become a bottleneck rather than a tool.
          </p>
          <ul>
            <li><strong>Too Complex:</strong> Too many fields, too many buttons, and a steep learning curve.</li>
            <li><strong>Too Slow:</strong> They aren't built for instant speed-to-lead response.</li>
            <li><strong>Disconnected:</strong> They don't integrate natively with your website forms and automated follow-ups.</li>
          </ul>
          <p>
            <strong>LeadForGrow is the CRM alternative built for speed.</strong> Our visual lead management system allows you to see your entire sales funnel on one screen, assign owners in one click, and track every conversion without the technical overhead.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The LeadForGrow Advantage: A Revenue-Focused CRM</h3>
          <p>
            We didn't build just another database. We built a revenue engine. Here is how LeadForGrow transforms your sales operation:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Instant Attribution</h4>
              <p className="text-lg">Know exactement which ad, which page, and which form brought in your most profitable leads. Stop guessing and start investing in what works.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Real-Time Team Alerts</h4>
              <p className="text-lg">The moment a lead is captured, your sales team gets a notification. No more checking emails at the end of the day—act while the interest is hot.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Visual Pipeline Tracking</h4>
              <p className="text-lg">Drag and drop leads between stages like 'Contacted', 'Proposal Sent', and 'Won'. It's intuitive, fast, and satisfies the need for clarity.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Built-In Follow-up Safety</h4>
              <p className="text-lg">If a lead hasn't been contacted within your set timeframe, LeadForGrow flags it. We protect your revenue from human forgetfulness.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>For Agencies: Managing Multiple Clients with Ease</h2>
          <p>
            If you're an agency, managing leads for 5, 10, or 50 clients is a nightmare without the right tech. LeadForGrow provides a <strong>multi-tenant architecture</strong> that lets you isolate client data while maintaining a single agency dashboard.
          </p>
          <p>
            You can give your clients "View-Only" access to see the results you're generating, or let their own sales teams manage the leads within your white-labeled platform. This adds massive perceived value to your agency services and builds long-term client retention.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-16">
          <blockquote>
            "LeadForGrow has completely changed how we handle enquiries. We used to lose 30% of our leads just because we forgot to follow up. Now, every single lead is tracked and assigned. Our conversion rate has jumped by 25% in just two months."
            <footer className="mt-4 font-bold text-slate-900 dark:text-white">— Vikram S., Agency Founder, Mumbai</footer>
          </blockquote>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow CRM",
        "operatingSystem": "Web-based",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "512"
        }
      })}} />
    </MarketingLayout>
  );
}
