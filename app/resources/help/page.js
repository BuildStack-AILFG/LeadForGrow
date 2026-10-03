"use client";

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Settings,
  Repeat,
  Users,
  BarChart3,
  CreditCard,
  PlayCircle,
  ChevronDown,
  MessageCircle,
  Mail,
  Calendar,
  ArrowRight,
  FileText,
  Sparkles,
  Play,
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';
import UserNavbar from '../../user/Header';
import Footer from '../../components/Footer';

// Helper Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const FadeInView = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// FAQ Accordion Component
const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`border rounded-[16px] mb-4 overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#60A5FA] bg-white shadow-[0_10px_30px_rgba(37,99,235,0.06)]' : 'border-[#E2E8F0] bg-white hover:border-[#BFDBFE]'}`}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className={`font-bold text-lg md:text-xl transition-colors ${isOpen ? 'text-[#2563EB]' : 'text-gray-900'}`}>
          {question}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-[#EFF6FF] text-[#2563EB] rotate-180' : 'bg-[#F8FAFC] text-[#64748B]'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-[#64748B] leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function HelpCenter() {
  const [openFAQIndex, setOpenFAQIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hi 👋 Welcome to LeadForGrow Support.", sender: "bot" },
    { text: "How can we help you today?", sender: "bot" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    setChatMessages((prev) => [...prev, { text, sender: "user" }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { text: "Thanks for reaching out! Our team will get back to you shortly.", sender: "bot" }]);
    }, 1000);
  };

  const faqs = [
    {
      question: "What is LeadForGrow and how does it work?",
      answer: "LeadForGrow is a Revenue Follow-Up Operating System (Rev-OS) that captures leads from various sources (like your website, ads, or WhatsApp) and ensures they are immediately assigned and followed up with. If your sales team is busy, our software automatically steps in to engage the prospect, preventing leads from going cold."
    },
    {
      question: "How does LeadForGrow capture leads?",
      answer: "We offer seamless integrations with website forms, WhatsApp Business, Google Ads, Facebook lead forms, and standard APIs. The moment a lead submits their information, it is injected directly into your LeadForGrow dashboard in real-time."
    },
    {
      question: "Can I automate WhatsApp follow-ups?",
      answer: "Absolutely. WhatsApp automation is a core feature of LeadForGrow. You can set up instant welcome messages, delayed check-ins, or multi-day nurturing sequences that trigger automatically if a lead hasn't been engaged by a human rep."
    },
    {
      question: "How do I assign leads to my sales team?",
      answer: "Leads can be routed based on sophisticated rules you define. You can use round-robin assignment, route based on regional territories, or assign leads specifically to reps based on their current availability and workload."
    },
    {
      question: "Can LeadForGrow integrate with my CRM?",
      answer: "LeadForGrow can import your existing leads from CSV files and can receive leads from other tools through forms and webhooks. Connections to CRMs such as Salesforce, HubSpot, or Zoho can be built on request around your requirements; they are not part of the standard product."
    },
    {
      question: "How can I track revenue and conversions?",
      answer: "Your dashboard provides real-time visibility into your pipeline. You can track exact conversion rates, response times, and identify exactly how much potential revenue is currently pending or at-risk of going cold."
    },
    {
      question: "How do I upgrade my subscription plan?",
      answer: "You can upgrade or modify your subscription directly from the 'Billing & Plans' section of your account settings. Upgrades take effect immediately and will be prorated for your current billing cycle."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#64748B] overflow-x-hidden pt-20 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <UserNavbar />

      <div className="relative z-10 flex-1">

        {/* HERO SECTION */}
        <section className="relative pt-24 pb-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E8F0] overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#EFF6FF] to-white opacity-80 pointer-events-none" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2563EB]/[0.08] blur-[120px] rounded-full pointer-events-none" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-3xl mx-auto relative z-10"
          >
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
              How Can We <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#60A5FA]">Help You?</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-[#64748B] mb-10 max-w-2xl mx-auto font-medium">
              Find guides, tutorials, and answers to common questions about using LeadForGrow.
            </motion.p>

            <motion.div variants={fadeInUp} className="relative max-w-2xl mx-auto mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.06)] rounded-[16px]">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-[#94A3B8]" />
              </div>
              <input
                type="text"
                className="block w-full pl-14 pr-4 py-5 border border-[#E2E8F0] rounded-[16px] text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB] transition-all text-gray-900 placeholder-[#94A3B8]"
                placeholder="Search help articles, guides, or features…"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-[#2563EB] text-white rounded-[12px] font-bold hover:bg-blue-700 transition-colors hidden sm:block shadow-sm">
                Search
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium">
              <span className="text-[#94A3B8]">Quick links:</span>
              <Link href="#" className="text-[#2563EB] hover:text-blue-800 hover:underline transition-colors">Getting Started</Link>
              <Link href="#" className="text-[#2563EB] hover:text-blue-800 hover:underline transition-colors">Lead Capture Setup</Link>
              <Link href="#" className="text-[#2563EB] hover:text-blue-800 hover:underline transition-colors">Automation & Follow-Ups</Link>
              <Link href="#" className="text-[#2563EB] hover:text-blue-800 hover:underline transition-colors">Team Management</Link>
              <Link href="#" className="text-[#2563EB] hover:text-blue-800 hover:underline transition-colors">Billing & Plans</Link>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 1 — Popular Help Topics */}
        <section className="py-24 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Browse by Topic</h2>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <BookOpen />, title: "Getting Started", desc: "Learn how to set up your LeadForGrow account and capture your first lead." },
                { icon: <Sparkles />, title: "Lead Capture Setup", desc: "Configure website forms, WhatsApp leads, and third-party integrations." },
                { icon: <Repeat />, title: "Automation & Follow-Ups", desc: "Set up automated reminders, messaging sequences, and SLA rules." },
                { icon: <Users />, title: "Team & User Management", desc: "Add team members, configure routing rules, and assign leads automatically." },
                { icon: <BarChart3 />, title: "Dashboard & Analytics", desc: "Understand revenue dashboards, metrics, and team performance reports." },
                { icon: <CreditCard />, title: "Billing & Subscription", desc: "Manage plans, upgrade subscriptions, invoices, and billing settings." }
              ].map((topic, i) => (
                <FadeInView key={i} delay={i * 0.1}>
                  <Link href="#" className="block bg-white border border-[#E2E8F0] p-8 rounded-[20px] shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] hover:border-[#BFDBFE] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-start text-left h-full">
                    <div className="w-14 h-14 bg-[#EFF6FF] rounded-[14px] text-[#2563EB] flex items-center justify-center mb-6 group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                      {React.cloneElement(topic.icon, { className: "w-7 h-7" })}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{topic.title}</h3>
                    <p className="text-[#64748B] leading-relaxed">{topic.desc}</p>
                  </Link>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2 — Step-By-Step Guides */}
        <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quick Setup Guides</h2>
              <p className="text-lg text-[#64748B] mt-3">Follow these step-by-step tutorials to get the most out of our platform.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                "Set up your first lead capture form",
                "Connect WhatsApp automation",
                "Assign leads to your sales team",
                "Configure automated follow-ups",
                "Track leads in the revenue dashboard",
                "Add team members to your workspace"
              ].map((guide, i) => (
                <FadeInView key={i} delay={i * 0.1} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-6 hover:bg-white hover:border-[#60A5FA] hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="mt-1">
                        <FileText className="w-6 h-6 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{guide}</h3>
                    </div>
                    <p className="text-sm text-[#64748B] mb-6 pl-10">
                      Learn the best practices and exact steps required to implement this feature successfully.
                    </p>
                  </div>
                  <div className="pl-10">
                    <button className="text-[#2563EB] font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read Guide <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — Video Tutorials */}
        <section className="py-24 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="mb-12 flex flex-col sm:flex-row items-baseline justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Learn with Quick Tutorials</h2>
                <p className="text-lg text-[#64748B] mt-3">Visual learner? Watch our short walkthroughs.</p>
              </div>
              <Link href="#" className="text-[#2563EB] font-bold hover:underline inline-flex items-center gap-2">
                View all videos <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[
                "Platform overview",
                "Setting up lead capture forms",
                "Creating automation rules",
                "Understanding the dashboard",
                "Managing your sales team"
              ].map((video, i) => (
                <FadeInView key={i} delay={i * 0.1}>
                  <div className="group cursor-pointer block">
                    {/* Thumbnail placeholder using a gradient to bypass broken img links */}
                    <div className="w-full aspect-video bg-gradient-to-tr from-blue-100 to-indigo-50 border border-[#BFDBFE] rounded-[16px] relative overflow-hidden shadow-sm mb-4 group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.06)] group-hover:-translate-y-1 transition-all duration-300">
                      <div className="absolute inset-0 bg-[#2563EB]/0 group-hover:bg-[#2563EB]/5 transition-colors duration-300 pointer-events-none" />

                      {/* Play Button Node */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all duration-300">
                        <Play className="w-5 h-5 text-[#2563EB] ml-1" />
                      </div>
                    </div>
                    <div className="px-1">
                      <h4 className="font-bold text-gray-900 group-hover:text-[#2563EB] transition-colors leading-snug line-clamp-2">{video}</h4>
                      <p className="text-sm text-[#94A3B8] font-medium mt-2 flex items-center gap-1.5 opacity-80">
                        <PlayCircle className="w-4 h-4" /> 3 mins
                      </p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — Frequently Asked Questions */}
        <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-3xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
              <p className="text-lg text-[#64748B] mt-4 max-w-xl mx-auto">Can't find what you're looking for? Check our most common queries below.</p>
            </FadeInView>

            <FadeInView delay={0.2} className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQIndex === index}
                  onClick={() => setOpenFAQIndex(openFAQIndex === index ? -1 : index)}
                />
              ))}
            </FadeInView>
          </div>
        </section>

        {/* SECTION 5 — Contact Support */}
        <section className="py-24 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Still Need Help?</h2>
              <p className="text-xl text-[#64748B] max-w-2xl mx-auto">Our support team is ready to help you get the most out of LeadForGrow.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FadeInView delay={0.1} className="bg-white border border-[#E2E8F0] hover:border-[#60A5FA] rounded-[20px] p-8 text-center shadow-[0_5px_15px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 mx-auto bg-[#EFF6FF] text-[#2563EB] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Live Chat</h3>
                  <p className="text-[#64748B] mb-8 leading-relaxed max-w-[250px] mx-auto">Chat with our support team instantly.</p>
                </div>
                <button onClick={() => setIsChatOpen(true)} className="w-full py-3 px-4 bg-[#2563EB] text-white shadow-sm rounded-[12px] font-bold hover:bg-blue-700 transition-all">
                  Start Live Chat
                </button>
              </FadeInView>

              <FadeInView delay={0.2} className="bg-white border border-[#E2E8F0] hover:border-purple-300 rounded-[20px] p-8 text-center shadow-[0_5px_15px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 mx-auto bg-[#EFF6FF] text-[#2563EB] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Email Support</h3>
                  <p className="text-[#64748B] mb-8 leading-relaxed max-w-[250px] mx-auto">Get help from our support specialists via email.</p>
                </div>
                <button onClick={() => window.location.href = "mailto:sales@leadforgrow.com?subject=LeadForGrow Support Request&body=Hello LeadForGrow Support,%0D%0A%0D%0AI need help with:"} className="w-full py-3 px-4 bg-[#2563EB] text-white shadow-sm rounded-[12px] font-bold hover:bg-blue-700 transition-all">
                  Send Email
                </button>
              </FadeInView>

              <FadeInView delay={0.3} className="bg-white border border-[#E2E8F0] hover:border-emerald-300 rounded-[20px] p-8 text-center shadow-[0_5px_15px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 mx-auto bg-[#EFF6FF] text-[#2563EB] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Schedule a Demo</h3>
                  <p className="text-[#64748B] mb-8 leading-relaxed max-w-[250px] mx-auto">Book a session with our team to walk through your setup.</p>
                </div>
                <button onClick={() => { setIsDemoOpen(true); setDemoSubmitted(false); }} className="w-full py-3 px-4 bg-[#2563EB] text-white shadow-sm rounded-[12px] font-bold hover:bg-blue-700 transition-all">
                  Book Demo
                </button>
              </FadeInView>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] relative overflow-hidden text-white border-t border-[#E2E8F0]">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white opacity-[0.05] rounded-full blur-[100px]" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <FadeInView>
              <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-white">
                Get the Most Out of <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">LeadForGrow</span>
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium">
                Our team can help you automate your follow-ups and recover lost revenue.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/contact" className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-slate-50 text-[#2563EB] rounded-[14px] font-bold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                  Contact Support <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto px-10 py-5 bg-transparent hover:bg-white/10 text-white border border-white/30 rounded-[14px] font-bold transition-all flex items-center justify-center gap-2 text-lg hover:-translate-y-1">
                  Book Demo
                </button>
              </div>
            </FadeInView>
          </div>
        </section>

      </div>

      {/* OVERLAYS & MODALS */}

      {/* Live Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[350px] h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden"
          >
            <div className="bg-[#2563EB] p-4 flex items-center justify-between text-white">
              <div className="font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> LeadForGrow Support</div>
              <button
                onClick={() => {
                  setIsChatOpen(false);
                  setTimeout(() => setChatMessages([
                    { text: "Hi 👋 Welcome to LeadForGrow Support.", sender: "bot" },
                    { text: "How can we help you today?", sender: "bot" }
                  ]), 500);
                }}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 bg-gray-50 flex flex-col gap-3 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`max-w-[85%] p-3 rounded-xl shadow-sm text-sm ${msg.sender === 'bot' ? 'bg-white border border-gray-100 rounded-tl-sm self-start text-gray-800' : 'bg-[#2563EB] text-white rounded-tr-sm self-end'}`}>
                  {msg.text}
                </div>
              ))}

              {chatMessages.length === 2 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Pricing", "Setup Guide", "Talk to Sales"].map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSendMessage(reply)}
                      className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                placeholder="Type your message..."
                className="flex-1 text-sm outline-none px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:border-blue-300 transition-colors"
              />
              <button
                onClick={() => handleSendMessage(chatInput)}
                className="w-10 h-10 flex items-center justify-center bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Demo Modal */}
      <AnimatePresence>
        {isDemoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsDemoOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-2xl font-bold text-gray-900">Schedule a Demo</h3>
                <button onClick={() => setIsDemoOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6">
                {demoSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Thanks!</h4>
                    <p className="text-gray-500">Our team will contact you shortly to confirm your demo.</p>
                    <button onClick={() => setIsDemoOpen(false)} className="mt-8 px-6 py-2 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">Close</button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setDemoSubmitted(true); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Name</label>
                        <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-400" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Email</label>
                        <input required type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-400" placeholder="john@company.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Company</label>
                      <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-400" placeholder="Acme Inc." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Date</label>
                        <input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Time</label>
                        <input type="time" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-gray-900" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Message (Optional)</label>
                      <textarea rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-gray-900 resize-none placeholder:text-gray-400" placeholder="What would you like to cover?"></textarea>
                    </div>
                    <button type="submit" className="w-full py-4 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg mt-2">
                      Schedule Demo
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Help Button Menu */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {isHelpMenuOpen && !isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 right-0 mb-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm">Need Help?</span>
                <button onClick={() => setIsHelpMenuOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <button
                onClick={() => { setIsChatOpen(true); setIsHelpMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] flex items-center gap-2 border-b border-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Live Chat
              </button>
              <button
                onClick={() => window.location.href = "mailto:sales@leadforgrow.com?subject=LeadForGrow Support Request&body=Hello LeadForGrow Support,%0D%0A%0D%0AI need help with:"}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] flex items-center gap-2 border-b border-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4" /> Email Support
              </button>
              <button
                onClick={() => { setIsDemoOpen(true); setDemoSubmitted(false); setIsHelpMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563EB] flex items-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4" /> Book Demo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isChatOpen && (
          <button
            onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
            className="w-14 h-14 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 transition-all"
          >
            {isHelpMenuOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
}
