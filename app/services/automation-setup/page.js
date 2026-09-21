import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Revenue-Maximizing Sales Automation Setup in India",
  description: "Expert implementation of your LeadForGrow automation sequences. We build your WhatsApp, Email, and team alerts for zero-latency lead response.",
  keywords: ["sales automation setup", "WhatsApp automation expert India", "lead workflow design", "automated email sequences", "sales operations consulting"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/services/automation-setup'
  }
};

export default function AutomationSetupPage() {
  const benefits = [
    {
      title: "Strategic Workflow Architecture",
      text: "We don't just set up 'replies'. We design comprehensive follow-up journeys that nurture leads across 7-30 days automatically."
    },
    {
      title: "WhatsApp API Integration",
      text: "Expert setup of your WhatsApp communication layer, ensuring high delivery rates and professional, branded automated responses."
    },
    {
      title: "Internal Sales Routing",
      text: "We build the 'Sales Ops' logic behind your account, ensuring leads are routed to the right person with the right context instantly."
    },
    {
      title: "Trigger-Based Personalization",
      text: "Our experts set up logic that changes the message based on the lead's actions—like clicking a link or filling a specific form."
    }
  ];

  const whoIsThisFor = [
    "Businesses losing leads after-hours or on weekends",
    "Sales Teams spending 70% of their time on manual follow-ups",
    "Account Managers overseeing complex multi-step client journeys",
    "Founders who want a 'Fire and Forget' sales infrastructure"
  ];

  const whyItMatters = [
    "Manual follow-ups are the single biggest point of failure in the modern sales process.",
    "A lead's intent is a perishable commodity; it expires within minutes of the initial enquiry.",
    "Correct automation allows a team of 3 to function with the output of a team of 10.",
    "LeadForGrow experts ensure your automation feels human, timely, and non-intrusive."
  ];

  const faq = [
    {
      q: "Will my automation feel 'robotic' to my prospects?",
      a: "Not with our setup. We specialize in 'Human-Like' automation. We use variables like the prospect's name and specific service interests, along with natural timing, so the message feels like a personal reach-out from a real team member."
    },
    {
      q: "Can you automate my WhatsApp follow-ups?",
      a: "Yes. WhatsApp is our primary focus for the Indian market. We set up instant replies and multi-day follow-up sequences that look professional and drive high engagement."
    },
    {
      q: "How many automation rules do you set up?",
      a: "Our expert setup includes building out your 3 most critical workflows: Initial Capture & Alert, 3-Day Nurture Sequence, and the 'Stale Lead' Re-engagement flow."
    },
    {
      q: "Do I need to write the automated messages?",
      a: "We provide high-converting templates and work with you to customize the voice. If you prefer, our conversion copywriters can create bespoke sequences for your brand as part of the service."
    },
    {
      q: "What if I want to change the automation later?",
      a: "The system is built for flexibility. After we set it up, we show you exactly how to tweak timing, change messages, or add new steps so you have full control over your machine."
    }
  ];

  return (
    <MarketingLayout 
      title="Turn Your Sales Follow-up into an Unfair Advantage." 
      subtitle="Stop letting human forgetfulness kill your growth. Let our experts build a tireless, 24/7 automation engine that closes deals while you sleep."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Automate My Growth"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Wait Time" Penalty: Why Your Leads Are Cold</h2>
          <p>
            In the Indian service industry, particularly in real estate, healthcare, and agencies, the prospect's interest levels follow a steep decay curve. If you respond in 5 minutes, you're the hero. If you respond in 5 hours, you're a stranger. Respond in 24 hours, and you're already forgotten.
          </p>
          <p>
            <strong>Automation is your insurance policy.</strong> It guarantees that no matter when a lead comes in—whether at 2 PM on a Monday or 2 AM on a Sunday—your brand responds instantly. An expert Automation Setup by LeadForGrow ensures that your 'Speed-to-Lead' is always near-zero.
          </p>
        </div>

        <div>
          <h2>The Hierarchy of Sales Automation Excellence</h2>
          <p>
            Most people think automation is just an 'Auto-Reply'. True sales automation is more like a 24/7 digital assistant. Our setup process focuses on four hierarchical layers of your sales operations:
          </p>
          <ul>
            <li><strong>The Acknowledgement Layer:</strong> Instant, personalized confirmation across WhatsApp and Email.</li>
            <li><strong>The Routing Layer:</strong> Immediate assignment to the correct sales representative with a high-priority browser and mobile notification.</li>
            <li><strong>The Nurture Layer:</strong> Strategically timed follow-ups over the course of several days to move the lead closer to a booking or purchase.</li>
            <li><strong>The Exception Layer:</strong> Automated alerts if a lead hasn't been moved or contacted by a human within your required 'Internal Response SLA'.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>The ROI of Expert Automation Implementation</h3>
          <p>
            Why hire a LeadForGrow specialist for your setup? Because the difference between 'Good' and 'Great' automation is worth Lakhs in extra revenue.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Maximized Speed-to-Lead</h4>
              <p className="text-xl">We fine-tune your tech stack for the lowest possible latency. When a lead hits 'Submit', your automation hits their phone before they can even close the browser tab.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. High-Deliverability Sequences</h4>
              <p className="text-xl">We know the technical 'Do's and Don'ts' of Email and WhatsApp automation. We set up your account for maximum delivery and minimum spam risk.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Optimized Conversion Copy</h4>
              <p className="text-xl">Our specialists don't just write messages; they write 'Opens' and 'Replies'. We use psychological triggers that encourage leads to engage with your team.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Comprehensive Systems Sync</h4>
              <p className="text-xl">We ensure your automation 'talks' to your CRM. When a lead is moved to 'Won', the nurture sequences stop automatically. No more embarrassing double-messages.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>Building a Scalable "Agency-in-a-Box"</h2>
          <p>
            If you're an agency providing lead generation services, automation is how you <strong>prove your value</strong>. When your client sees leads getting contacted instantly by their own sales bots, they feel the 'Magic' of your service.
          </p>
          <p>
            We help you build these 'Agency Snapshots'—pre-configured automation frameworks that you can deploy for your clients in minutes. This turns your agency into a high-margin technology provider, allowing you to charge more while doing less manual labor per client.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Set your sales on autopilot today.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Don't let another hot lead go cold. Let our experts build your tireless sales machine.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Automate My Sales Funnel
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Sales and Marketing Automation Setup",
        "provider": {
          "@type": "LocalBusiness",
          "name": "LeadForGrow Automation Lab"
        },
        "areaServed": "India",
        "description": "Expert design and implementation of lead follow-up sequences, WhatsApp automation, and automated sales routing."
      })}} />
    </MarketingLayout>
  );
}
