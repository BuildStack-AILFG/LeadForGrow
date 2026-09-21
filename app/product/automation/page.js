import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Best Lead Automation & Automated Follow-up Software in India",
  description: "Set your sales on autopilot with LeadForGrow. Instant WhatsApp replies, automated email follow-ups, and smart lead routing. Protect your revenue 24/7.",
  keywords: ["lead automation software", "automated follow-ups India", "sales automation tool", "WhatsApp lead automation", "speed to lead software"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/product/automation'
  }
};

export default function ProductAutomationPage() {
  const benefits = [
    {
      title: "Instant WhatsApp & Email Replies",
      text: "The moment a lead is captured, they get a personalized welcome message. Engage them while they are still on your site."
    },
    {
      title: "Revenue Protection System",
      text: "Automated follow-ups mean you're still selling even when your team is asleep or busy. Never let a lead go cold."
    },
    {
      title: "Smart Round-Robin Assignment",
      text: "Automatically distribute leads across your team fairly or based on expertise. Speed-to-lead is your biggest competitive edge."
    },
    {
      title: "Multi-Channel Follow-up",
      text: "Combine Email and WhatsApp sequences to stay top-of-mind across all platforms without manual effort."
    }
  ];

  const whoIsThisFor = [
    "Agencies managing high-volume lead flow",
    "Sales Teams with limited manual bandwidth",
    "24/7 Operations that need after-hours coverage",
    "Businesses looking to reduce 'Speed-to-Lead' time"
  ];

  const whyItMatters = [
    "In B2B, the first responder wins the deal 70% of the time.",
    "Human memory fails. Automation never forgets a follow-up or a lead.",
    "Manual follow-ups are expensive. Automated ones are free and work 24/7.",
    "LeadForGrow acts as your 24/7 digital sales assistant that never takes a day off."
  ];

  const faq = [
    {
      q: "What exactly is 'Speed-to-Lead' and why is it important?",
      a: "Speed-to-lead is the time it takes for your sales team to respond to a new enquiry. Studies show that responding within 5 minutes increases your chances of qualifying the lead by 21x compared to waiting 30 minutes. LeadForGrow automates this response to near-zero seconds."
    },
    {
      q: "Can I customize the automated WhatsApp messages?",
      a: "Yes. You have complete control over the content of your automated replies. You can include the prospect's name, mention the specific service they inquired about, and provide a clear call to action like a booking link."
    },
    {
      q: "Does the system follow up more than once?",
      a: "Absolutely. You can build complex multi-day follow-up sequences. For example: Day 1 (Instant WhatsApp), Day 2 (Email Reminder), Day 4 (Follow-up WhatsApp). This keeps you top-of-mind without you lifting a finger."
    },
    {
      q: "Will my team know when a lead is assigned to them?",
      a: "Yes. LeadForGrow triggers instant internal notifications via Email or WhatsApp to the assigned team member, ensuring they know exactly who to call and what the lead is interested in."
    },
    {
      q: "Is it difficult to set up these automation rules?",
      a: "Not at all. We've replaced complex 'Workflows' with simple, logical automation rules. You just tell the system 'When this form is submitted, send this message and assign to this person'. It takes less than 2 minutes to set up."
    }
  ];

  return (
    <MarketingLayout 
      title="Speed Matters More Than Your Ad Budget." 
      subtitle="Set your lead engagement on autopilot. Our system protects your revenue by responding instantly and following up tirelessly."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Automate Lead Follow-ups"
    >
      <section className="space-y-20">
        <div>
          <h2>The "First Contact" Race: Why 90% of Agencies Are Losing</h2>
          <p>
            In the modern B2B SaaS and service economy in India, the most expensive mistake you can make is waiting too long to contact a lead. Most businesses spend lakhs on Google and Meta ads, only to let the resulting enquiries sit in an inbox for 4 hours. By then, the prospect has already spoken to three of your competitors.
          </p>
          <p>
            <strong>Automation is no longer a luxury—it's your revenue protection system.</strong> LeadForGrow ensures that your brand is the first one the prospect hears from, creating an immediate professional impression that your competitors can't match with manual processes.
          </p>
        </div>

        <div>
          <h2>The Anatomy of a High-Converting Follow-up Sequence</h2>
          <p>
            Effective automation isn't about spamming people; it's about being <strong>helpful at the right time</strong>. LeadForGrow's automation engine allows you to build sophisticated engagement paths that feel personal and high-touch:
          </p>
          <ul>
            <li><strong>Trigger:</strong> A visitor submits an enquiry on your hospital or agency website.</li>
            <li><strong>Action 1 (T + 0s):</strong> Instant WhatsApp reply: "Hi [Name], thanks for inquiring about [Service]. We're reviewing your details now."</li>
            <li><strong>Action 2 (T + 2s):</strong> Lead is assigned via Round-Robin to Sales Rep 'A'.</li>
            <li><strong>Action 3 (T + 2s):</strong> Sales Rep 'A' receives a WhatsApp alert with the lead's phone number.</li>
            <li><strong>Action 4 (T + 24h):</strong> If the lead status remains 'New', send an automated email follow-up with a client case study.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>LeadForGrow: Built for the Indian Sales Culture</h3>
          <p>
            We know that in India, WhatsApp is the king of communication. That's why we've built our automation engine to prioritize instant mobile engagement over traditional slow-moving email threads.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Instant Gratification Automation</h4>
              <p className="text-xl">Answer your prospects' most urgent questions (pricing, availability, booking) the second they ask. Don't give them a reason to keep searching.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Leak-Proof Sales Pipeline</h4>
              <p className="text-xl">Human sales teams get tired, forgetful, and overwhelmed. Our automation engine never gets tired. It follows up every lead, every time, 24/7/365.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Personalized Multi-Channel Nurturing</h4>
              <p className="text-xl">Combine the reach of Email with the immediacy of WhatsApp. Our system switches between channels to find where your lead is most likely to respond.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Intelligent Intent Detection</h4>
              <p className="text-xl">Move leads based on their actions. If they click a 'Case Study' link in your email, automatically upgrade their priority and alert your top closer.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Scaling Without Increasing Headcount</h2>
          <p>
            The old way of growing an agency was to hire more 'Sales Development Reps' (SDRs) to manually dial leads. The new way is to use LeadForGrow to automate the initial 70% of the sales conversation. 
          </p>
          <p>
            By automating follow-ups and qualifications, your expert closers only spend time on leads that are warmed up and ready to buy. This massive efficiency boost allows you to double your client load without hiring a single new staff member.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Stop letting manual follow-up kill your growth.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Protect your marketing investment with a system that responds while the lead is hot.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Automate My Sales Now
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "LeadForGrow Automation Engine",
        "operatingSystem": "Web-based",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        },
        "featureList": ["Instant WhatsApp Replies", "Automated Email Follow-up", "Smart Lead Routing", "24/7 Monitoring"]
      })}} />
    </MarketingLayout>
  );
}
