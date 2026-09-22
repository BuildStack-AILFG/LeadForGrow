'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import React, { useState } from 'react';
import UserNavbar from '../user/Header';
import AIChatPopup from './AIChatPopup';
import { 
  Phone, 
  Mic, 
  Target, 
  MapPin, 
  Bell, 
  Users, 
  BarChart, 
  PlayCircle, 
  CheckCircle2, 
  MessageSquare,
  Zap,
  Globe,
  Smartphone,
  Headphones,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Database,
  Mail,
  Search,
  Plus,
  Layout
} from 'lucide-react';

/* ───────────────────────────────────────────────────────────── 
   NEW CONTENT-DENSE TELECRM-STYLE TEMPLATE
   ───────────────────────────────────────────────────────────── */

const FeatureIcon = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-3 group">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
      <Icon size={24} />
    </div>
    <span className="text-[11px] font-bold text-slate-600 text-center uppercase tracking-tight max-w-[80px]">{label}</span>
  </div>
);

const BenefitCard = ({ icon: Icon, title, desc }) => (
  <div className="space-y-4">
    <div className="text-indigo-600">
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const FeatureSection = ({ title, sub, desc, points, image, reverse, icon: Icon, quote, author }) => (
  <section className="py-24 px-8 group">
    <div className={`max-w-7xl mx-auto flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-20`}>
      <div className="flex-1 space-y-8">
        <div className="flex items-center gap-3 text-indigo-600">
          <Icon size={24} />
          <span className="text-sm font-bold uppercase tracking-widest">{sub}</span>
        </div>
        <h2 className="text-4xl font-bold text-slate-900 leading-tight">{title}</h2>
        <p className="text-lg text-slate-600 leading-relaxed">{desc}</p>
        <ul className="space-y-4">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
          Request a demo
        </button>
      </div>
      <div className="flex-1 w-full flex justify-center items-center">
        <img src={image} alt={title} className="w-full max-w-2xl h-auto" />
      </div>
    </div>
  </section>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-indigo-600 transition-colors"
      >
        <span className="text-lg font-bold text-slate-900">{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="pb-6 animate-in slide-in-from-top-2 duration-300">
          <p className="text-slate-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function IndustryTemplate({ data }) {
  if (!data) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <UserNavbar />
      <AIChatPopup />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 px-8 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            {data.name}'s Simplest {data.name} CRM Software
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Track your agents, boost calling efficiency, automate repetitive tasks, and take your business to the next level with India's No. 1 {data.name} CRM.
          </p>

          <div className="grid grid-cols-3 md:grid-cols-7 gap-8 pt-8">
            <FeatureIcon icon={Phone} label="1-click dialer" />
            <FeatureIcon icon={Mic} label="Call Tracking" />
            <FeatureIcon icon={Target} label="Auto-lead Capture" />
            <FeatureIcon icon={MapPin} label="Field Tracking" />
            <FeatureIcon icon={Bell} label="Follow-ups" />
            <FeatureIcon icon={Users} label="Lead Management" />
            <FeatureIcon icon={BarChart} label="Real-time Insights" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <button className="bg-indigo-600 text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30">
              Request a demo
            </button>
            <button className="flex items-center gap-2 text-slate-900 font-bold hover:text-indigo-600 transition-colors">
              <PlayCircle size={24} /> Watch video
            </button>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by teams who sell to high-value customers</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale contrast-125">
             <span className="text-2xl font-black italic tracking-tighter">Domino's</span>
             <span className="text-2xl font-black italic tracking-tighter">BYJU'S</span>
             <span className="text-2xl font-black italic tracking-tighter">Mercedes</span>
             <span className="text-2xl font-black italic tracking-tighter">Hyundai</span>
             <span className="text-2xl font-black italic tracking-tighter">Housing.com</span>
          </div>
        </div>
      </section>

      {/* WHAT IS SECTION */}
      <section className="py-24 px-8 bg-indigo-50/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
            What is <br/>{data.name} CRM?
          </h2>
          <div className="space-y-8 text-lg text-slate-600 leading-relaxed">
            <p>
              A {data.name.toLowerCase()} CRM is a specialized tool designed for {data.name.toLowerCase()} professionals to help streamline sales processes, organize client information, and manage leads and appointments efficiently.
            </p>
            <p>
              With a LeadForGrow CRM, you can effectively communicate with your prospects via phone calls and WhatsApp, track real-time performance of your agents, automate repetitive tasks, and generate comprehensive performance reports to make data-driven decisions.
            </p>
          </div>
        </div>
      </section>

      {/* WHY IS IT IMPORTANT SECTION */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <h2 className="text-5xl font-black text-slate-900 text-center leading-tight">
            Why is a {data.name} CRM important for Your Business?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <BenefitCard 
              icon={Bell} 
              title="Stay on Top of Follow-ups" 
              desc="Don't lose leads due to ineffective communication; always follow up on time."
            />
            <BenefitCard 
              icon={Phone} 
              title="Boost Calling Efficiency" 
              desc="Make more accurate calls with features like 1-click dialer and convert more deals."
            />
            <BenefitCard 
              icon={Database} 
              title="Effortlessly Manage All Leads" 
              desc="Securely capture and store lead data in one central hub from third-party platforms."
            />
            <BenefitCard 
              icon={Users} 
              title="Track and Manage Team" 
              desc="Track your team's location and performance from anywhere with check-in options."
            />
            <BenefitCard 
              icon={Zap} 
              title="Automate Routine Tasks" 
              desc="Automatically capture and distribute leads, send instant welcome messages, and update deal status."
            />
            <BenefitCard 
              icon={MessageSquare} 
              title="Nurture Multiple Leads" 
              desc="Send personalized bulk WhatsApp marketing messages based on the sales process stage."
            />
          </div>
          <div className="text-center pt-10">
             <button className="bg-indigo-600 text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20">Book a free Demo!</button>
          </div>
        </div>
      </section>

      {/* KEY FEATURES DEEP DIVE */}
      <div className="bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto py-32 px-8 text-center space-y-8">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">Key Features in LeadForGrow CRM</h2>
          <p className="text-2xl text-slate-500 max-w-3xl mx-auto font-medium">LeadForGrow has a unique set of features tailored to meet the specific requirements of all {data.name.toLowerCase()} businesses.</p>
        </div>

        <FeatureSection 
          sub="Integration Capabilities"
          title={`Capture leads from all ${data.name} Portals`}
          desc="Why manage leads manually from 15 different platforms when you can manage them from a centralized hub?"
          icon={Globe}
          points={[
            "Effortlessly capture leads from everywhere in one place",
            "Automatically assign leads to your agents.",
            "Connect with leads instantly with LeadForGrow's WhatsApp Chatbot."
          ]}
          image="/portal-integrations.png"
        />

        <FeatureSection 
          reverse
          sub="Telesales Management"
          title="Boost calling efficiency"
          desc="Because quick, efficient calling = more calls = more deals"
          icon={Phone}
          points={[
            "With 1-click dialer, your team spends less time typing numbers and more in closing deals",
            "Use LeadForGrow's web application to make calls from your mobile in one click.",
            "Eliminate manual effort and automatically sync call feedback (call connected, disconnected, missed, etc.)"
          ]}
          image="/calling-list.png"
        />

        <FeatureSection 
          sub="WhatsApp AI Automation"
          title="Intelligent WhatsApp Lead Routing & Automation"
          desc="Optimize engagement with AI-powered paths."
          icon={Zap}
          points={[
            "Autonomous Lead Qualification: AI engine detects high-intent leads instantly.",
            "Seamless Routing: Sync leads to Sales or Support teams based on intent.",
            "Automated Follow-ups: Initiate onboarding sequences and document collection without manual work."
          ]}
          image="/whatsapp-automation.png"
        />

        <FeatureSection 
          reverse
          sub="Lead Management"
          title="Complete client interaction history"
          desc="Because when you focus on the wrong leads, your team won't get any results even if they are working hard."
          icon={Users}
          points={[
            "Manage and track every inbound/outbound call, WhatsApp, etc.",
            "Securely store lead documents for easy access.",
            "Streamline your lead communication and sales pipeline."
          ]}
          image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
          quote="No need to ask about the status of each lead, I can check the entire journey at a glance."
          author="Sumit Thakur (Founder, Acceron)"
        />

        <FeatureSection 
          sub="Follow-up Call Reminders"
          title="Appointment and callback reminders"
          desc="Because letting follow-ups slip through means losing deals."
          icon={Bell}
          points={[
            "Don't miss call appointments with timely notifications on WhatsApp.",
            "Get notified when it's time to call.",
            "Always follow up on time and close more deals."
          ]}
          image="https://images.unsplash.com/photo-1556740734-792336750b81?q=80&w=1000&auto=format&fit=crop"
        />

        <FeatureSection 
          reverse
          sub="Real-time Insights"
          title="Real-time tracking and reporting"
          desc="Because you need to know what's happening in your business RIGHT NOW!"
          icon={BarChart}
          points={[
            "Get detailed analytics in a single dashboard.",
            "Effortlessly manage your sales pipeline.",
            "Track the entire team's work."
          ]}
          image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
          quote="Knowing who is making how many calls has become easier. Comparison is possible."
          author="Suma (Manager, Vajra Vehicle Loan)"
        />
      </div>

      {/* WHY BEST SECTION */}
      <section className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-slate-900 mb-20 text-center leading-tight">Why LeadForGrow is the Best {data.name} CRM</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { t: "Customizability", d: "Implement your unique workflows; LeadForGrow adjusts to you, not the other way around.", i: Zap },
              { t: "Mobile Application", d: "A comprehensive mobile app with all essential features to work on the go.", i: Smartphone },
              { t: "Customer Support", d: "Dedicated onboarding sessions and a WhatsApp group for your team members.", i: Headphones },
              { t: "Intuitive Interface", d: "Easy-to-use interface, specially designed for non-tech-savvy agents.", i: Layout },
              { t: "Affordable", d: "Extensive features designed for your business at an unmatchable price.", i: ArrowRight },
              { t: "WhatsApp-first", d: "Manage all WhatsApp interactions from one central hub.", i: WhatsAppIcon },
            ].map((item, i) => (
              <div key={i} className="p-8 border border-slate-100 rounded-2xl bg-slate-50/30 hover:shadow-xl transition-all">
                <div className="text-indigo-600 mb-6"><item.i size={28} /></div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{item.t}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-32 px-8 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-black text-slate-900 mb-16 text-center">FAQs</h2>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xl">
            <FAQItem 
              question={`Can LeadForGrow handle thousands of ${data.name.toLowerCase()} leads?`}
              answer="Yes. LeadForGrow runs on cloud infrastructure and is designed to grow with your business."
            />
            <FAQItem 
              question="Does it integrate with my current ad platforms?"
              answer="Absolutely. We integrate natively with Facebook Ads, Google Ads, LinkedIn, and major industry-specific portals to ensure zero lead leakage."
            />
            <FAQItem 
              question="Is there a mobile app available?"
              answer="Yes, our comprehensive mobile app allows your team to manage leads, make calls, and send WhatsApp messages while on the field."
            />
            <FAQItem 
              question="What kind of support do you provide?"
              answer="We provide onboarding guidance and support via WhatsApp and email to help your team get started."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-8 text-center bg-indigo-600 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">Ready to boost your sales efficiency?</h2>
          <p className="text-xl opacity-90 font-medium">Start using LeadForGrow to scale your operations.</p>
          <div className="flex justify-center gap-6">
            <button className="bg-white text-indigo-600 px-12 py-6 rounded-2xl text-xl font-bold hover:bg-slate-50 transition-all shadow-2xl">Book My Free Demo</button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </section>

      <div className="py-12 bg-slate-900 text-white text-center">
         <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.5em]">LeadForGrow • India's No. 1 {data.name} CRM Platform</p>
      </div>
    </div>
  );
}