import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Become a LeadForGrow Agency Partner & Certified Expert",
  description: "Join the LeadForGrow partner program. Get exclusive training, priority support, and revenue share opportunities while scaling your agency with our elite tech.",
  keywords: ["agency partner program", "marketing certified expert India", "SaaS referral partner", "agency growth community", "certified lead management expert"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/agencies/partner'
  }
};

export default function PartnerPage() {
  const benefits = [
    {
      title: "Priority Partner Support",
      text: "Skip the queue. As a partner, you get a dedicated account manager and Slack access to our technical operations team for all client queries."
    },
    {
      title: "Exclusive Expert Certification",
      text: "Earning the 'LeadForGrow Certified Expert' badge instantly builds trust with new clients and validates your technical authority in marketing."
    },
    {
      title: "Revenue Share Opportunities",
      text: "Earn ongoing commissions for every new agency or business you refer to the platform. Build a second stream of passive recurring revenue."
    },
    {
      title: "Market-Specific Lead Referrals",
      text: "We often receive inquiries from businesses looking for expert help. We pass these high-quality leads directly to our certified agency partners."
    }
  ];

  const whoIsThisFor = [
    "High-Performance Agencies scaling their operations",
    "Digital Consultants wanting a certified stamp of authority",
    "Marketing Educators training the next generation of pros",
    "SAAS Enablers looking for a profitable referral partnership"
  ];

  const whyItMatters = [
    "Scaling an agency is easier when you have a direct line to the technology providers.",
    "Certification provides hard proof of your expertise during client pitches and discovery calls.",
    "A partnership is more than a tool; it's a growth ecosystem of training, resources, and referrals.",
    "LeadForGrow partners are the first to access new features, AI integrations, and beta updates."
  ];

  const faq = [
    {
      q: "What are the requirements to become a LeadForGrow Certified Partner?",
      a: "We currently require partners to have an active Agency plan and pass our 'Fundamentals of Sales Automation' certification. We look for partners who are committed to delivering high-quality results for their clients."
    },
    {
      q: "How does the revenue share or commission work?",
      a: "Our partners earn a percentage of the subscription fee for every account they refer or manage on behalf of their clients through their unique partner link. Detailed tier breakdowns are available in the Partner Portal."
    },
    {
      q: "Do I get a badge for my website?",
      a: "Yes. Once certified, you receive high-resolution vector logos and badges that you can use on your website, email signature, and pitch decks to demonstrate your partnership status."
    },
    {
      q: "Can I host workshops using LeadForGrow?",
      a: "Absolutely. We encourage our partners to educate the market. We can provide educational materials, demo accounts, and even co-host webinars for our top-tier certified experts."
    },
    {
      q: "Is there a cost to join the Partner Program?",
      a: "There is no separate 'Entry Fee'. The program is open to our Agency plan members who demonstrate a high level of proficiency and commitment to the platform's best practices."
    }
  ];

  return (
    <MarketingLayout 
      title="Don't Just Use the Platform. Help Us Lead the Market." 
      subtitle="Join an elite ecosystem of agencies and experts redefining the sales landscape in India. Get the training, support, and recognition you deserve."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Apply for Partnership"
    >
      <section className="space-y-20">
        <div>
          <h2>The Power of "Certified" Authority</h2>
          <p>
            In the crowded marketing agency space in India, everyone claims to be an "expert." But how do you prove it? The LeadForGrow Partner Program is designed to give you the <strong>Technical Stamp of Approval</strong> that separates you from the amateurs.
          </p>
          <p>
            When you're a Certified Partner, you aren't just a service provider; you're a validated expert in the LeadForGrow operating system. This certification acts as a powerful conversion tool during your sales process, giving your clients the confidence that their data and results are in the hands of a professional.
          </p>
        </div>

        <div>
          <h2>Exclusive Resources for High-Growth Agencies</h2>
          <p>
            Hustle will only take your agency so far. To scale past 7 figures, you need insider access and specialized resources. Our Partner Program provides exactly that:
          </p>
          <ul>
            <li><strong>The Partner Playbooks:</strong> Internal training on how to sell high-ticket retainers using our technology.</li>
            <li><strong>Beta Feature Access:</strong> Be the first to use our experimental AI and automation tools before they go public.</li>
            <li><strong>Co-Marketing Opportunities:</strong> We love featuring our successful partners in our case studies and on our blog, giving you massive backlinks and authority.</li>
            <li><strong>Direct Tech Support:</strong> Get your technical questions answered in minutes, not days, by our senior infrastructure team.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800 transition-all">
          <h3>The LeadForGrow Partner ROI Blueprint</h3>
          <p>
            Partnership isn't just about a badge; it's about building a more profitable and stable agency business.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Higher Retention Rates</h4>
              <p className="text-xl">When you implement certified sales systems for your clients, they get better results and stay with you longer. Our partners report 2x higher retention than non-partners.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. New High-Margin Revenue Streams</h4>
              <p className="text-xl">Beyond your management fees, our revenue-share program allows you to earn recurring SaaS dividends on the platform your clients use indefinitely.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Priority Lead Referrals</h4>
              <p className="text-xl">We trust our partners. When our sales team hears from a business that needs 'Full-Service Help' in a specific niche, the first place we look is our Certified Partner Directory.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Community of Elite Peers</h4>
              <p className="text-xl">Join our private channel of top agency owners. Solve problems faster, find white-label partners, and stay ahead of market trends together.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Scaling the Future of Sales in India</h2>
          <p>
            We are on a mission to professionalize the lead management landscape for Indian SMEs. We can't do that alone. We need expert agencies like yours to act as the boots on the ground, implementing world-class systems for businesses across the country.
          </p>
          <p>
            By becoming a partner, you are aligning with the most advanced sales automation platform built for agencies. You're future-proofing your business against the AI-wave by becoming a master of the tools that control the AI. Let's grow together.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-5xl font-bold text-slate-900 dark:text-white mb-8">Elevate your agency's status.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Become a LeadForGrow Certified Expert and unlock your next level of growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-6 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
              Apply for Partnership
            </a>
            <a href="/contact" className="inline-block bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white px-12 py-6 rounded-3xl text-2xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Learn More About Tiers
            </a>
          </div>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Certification and Partnership Program",
        "provider": {
          "@type": "Organization",
          "name": "LeadForGrow",
          "url": "https://www.leadforgrow.com"
        },
        "description": "Exclusive training, certification, and referral program for marketing agencies and sales consultants."
      })}} />
    </MarketingLayout>
  );
}
