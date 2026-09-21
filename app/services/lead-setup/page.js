import MarketingLayout from '@/app/components/MarketingLayout';

export const metadata = {
  title: "Revenue-Focused Lead System Setup for Businesses in India",
  description: "Expert setup of your LeadForGrow capture and management infrastructure. We connect your ads, forms, and CRM for 100% lead trackability. Start today.",
  keywords: ["lead system setup service", "sales infrastructure audit India", "lead capture setup", "crm implementation services", "marketing system specialist"],
  alternates: {
    canonical: 'https://www.leadforgrow.com/services/lead-setup'
  }
};

export default function LeadSetupPage() {
  const benefits = [
    {
      title: "End-to-End Tracking Audit",
      text: "We don't just 'turn it on'. We audit your entire traffic flow to ensure every Facebook, Google, and Organic lead is perfectly tracked."
    },
    {
      title: "Custom Capture Architecture",
      text: "Our experts design and deploy custom forms and popup widgets tailored to your specific service niches for maximum conversion."
    },
    {
      title: "CRM Workflow Calibration",
      text: "We map your actual sales process into LeadForGrow, setting up the stages and owners that reflect how your business closes deals."
    },
    {
      title: "Data Migration & Cleanup",
      text: "Transitioning from Sheets or an old CRM? We handle the data mapping and cleanup so you start your new system with a clean slate."
    }
  ];

  const whoIsThisFor = [
    "Businesses wasting ₹1L+ monthly on ads with poor tracking",
    "Sales Teams overwhelmed by messy or duplicate lead data",
    "Agencies who want to outsource the tech setup to experts",
    "Professional Practices needing a HIPAA/Data-secure setup"
  ];

  const whyItMatters = [
    "A poorly configured CRM is worse than no CRM at all; it creates confusion and lost revenue.",
    "Correct attribution is the only way to prove which marketing campaigns are actually making you money.",
    "Setting up complex integrations can take weeks of trial and error for a non-expert.",
    "LeadForGrow specialists ensure your 'Sales Machine' is built on a solid, scalable foundation."
  ];

  const faq = [
    {
      q: "What is included in the 'Lead System Setup' service?",
      a: "This is a full-service technical implementation. We handle form creation, dashboard calibration, lead routing rules, attribution setup, and a basic training session for your team."
    },
    {
      q: "Can you connect this to my current Google or Facebook Ads account?",
      a: "Yes. Our team will work with you to ensure that lead data flows safely from your ad platforms directly into LeadForGrow with 100% attribution accuracy."
    },
    {
      q: "How long does a typical setup take?",
      a: "Most setup projects are completed within 3-5 business days, depending on the complexity of your current data and the number of team members involved."
    },
    {
      q: "Do I need to be technically savvy?",
      a: "Not at all. The goal of this service is to remove the technical burden from you. We build the architecture, and you simply log in and start closing deals."
    },
    {
      q: "Do you offer ongoing support after the setup?",
      a: "Yes. Every setup includes a 30-day 'Maintenance Window' where we monitor the system and make any necessary tweaks to ensure everything is running perfectly."
    }
  ];

  return (
    <MarketingLayout 
      title="Stop Guessing. Build a System That Tracks Every Rupee." 
      subtitle="Marketing without tracking is just expensive gambling. Let our experts build your high-performance lead infrastructure from the ground up."
      benefits={benefits}
      whoIsThisFor={whoIsThisFor}
      whyItMatters={whyItMatters}
      faq={faq}
      ctaText="Scale My Lead System"
    >
      <section className="space-y-20">
        <div>
          <h2>The "Blindfold" Problem in Modern Sales</h2>
          <p>
            When we audit businesses in India, the most common revenue leak is what we call the "Blindfold." You're spending money on Meta Ads, Google Ads, and SEO, but you can't say with 100% certainty which specific ₹10,000 produced which ₹1,00,000 in sales.
          </p>
          <p>
            <strong>If you can't track it, you can't scale it.</strong> A Lead System Setup by LeadForGrow experts removes the blindfold. We build a transparent, end-to-end infrastructure that tracks every lead from the first click to the final invoice.
          </p>
        </div>

        <div>
          <h2>The Architecture of an Elite Lead Machine</h2>
          <p>
            There is a science to capturing and routing leads that most business owners are too busy to master. Our specialists focus on three core layers of your sales tech stack:
          </p>
          <ul>
            <li><strong>The Capture Layer:</strong> Deploying high-conversion forms and behavior-triggered popups that capture data without disrupting the user experience.</li>
            <li><strong>The Attribution Layer:</strong> Implementing the technical tracking required to identify the exact keyword or ad campaign that triggered the enquiry.</li>
            <li><strong>The Management Layer:</strong> Calibrating your CRM stages and ownership rules to ensure zero lead-loss and maximum team accountability.</li>
          </ul>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[3rem] p-12 border border-slate-100 dark:border-slate-800">
          <h3>Why Expert Setup Outperforms "DIY" Implementation</h3>
          <p>
            While LeadForGrow is designed to be simple, an expert setup provides a level of depth and strategy that ensures long-term success.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">1. Precision Lead Routing</h4>
              <p className="text-xl">We set up complex 'If-Then' logic based on your team's specialties and availability, ensuring the right leads go to the right closers instantly.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">2. Hardened Data Security</h4>
              <p className="text-xl">Our team ensures your system is configured for privacy and security standards, protecting your most valuable asset: your customer list.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">3. Custom Branding & UX</h4>
              <p className="text-xl">We customize every form and dashboard interaction to feel like a native part of your brand, building trust with every interaction.</p>
            </div>
            <div>
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400">4. Rapid Team Onboarding</h4>
              <p className="text-xl">We don't just build; we train. We'll show your team exactly how to use their new dashboard to maximize their own personal sales performance.</p>
            </div>
          </div>
        </div>

        <div>
          <h2>For Agencies: Outsourcing the "Grunt Work"</h2>
          <p>
            As an agency, your time is most valuable when spent on strategy and creative. Setting up CRM fields and mapping form data for every new client is "grunt work" that slows you down. 
          </p>
          <p>
            LeadForGrow's expert setup team can act as your <strong>white-label technical arm</strong>. You close the client, and we build their lead management infrastructure behind the scenes. This allows you to offer more comprehensive services without needing to hire an in-house technical operations manager.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-20 text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Stop leaking revenue. Start building a system.</p>
          <p className="text-2xl text-slate-500 dark:text-slate-400 mb-12 font-light">
            Give your sales team the professional foundation they need to win.
          </p>
          <a href="/user/register" className="inline-block bg-indigo-600 text-white px-12 py-5 rounded-3xl text-2xl font-bold shadow-2xl shadow-indigo-500/20 active:scale-95 transition hover:bg-indigo-700">
            Book My System Audit
          </a>
        </div>
      </section>

      {/* Schema Markup for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Lead Management System Implementation",
        "provider": {
          "@type": "LocalBusiness",
          "name": "LeadForGrow Tech Ops"
        },
        "areaServed": "India",
        "description": "Professional setup and calibration of sales lead tracking and management systems for agencies and SMEs."
      })}} />
    </MarketingLayout>
  );
}
