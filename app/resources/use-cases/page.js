"use client";

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  BarChart3,
  Users,
  Briefcase,
  Headset,
  Home,
  GraduationCap,
  Stethoscope,
  ShoppingCart,
  Megaphone,
  Wrench,
  Clock,
  AlertCircle,
  XOctagon,
  ArrowRight,
  ArrowDown,
  Play,
  CheckCircle2,
  Sparkles,
  Network,
  Database,
  Smartphone,
  Globe,
  TrendingUp,
  LayoutDashboard } from 'lucide-react';
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

export default function UseCases() {
  return (
    <div className="min-h-screen bg-white font-sans dark:text-slate-300 text-[#64748B] overflow-x-hidden pt-20 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <UserNavbar />

      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#2563EB]/[0.05] blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#60A5FA]/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1">

        {/* HERO SECTION */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center border-b border-[#E2E8F0] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFC] to-white -z-10" />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#2563EB]/[0.03] blur-[120px] rounded-full pointer-events-none -z-10" />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-8 relative z-10"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#2563EB] font-semibold text-sm shadow-[0_5px_15px_rgba(0,0,0,0.02)] backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#2563EB] animate-pulse"></span>
              Designed for Teams Handling Leads
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter text-gray-900 mb-6 leading-[1.1]">
                Use Cases for <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#60A5FA]">LeadForGrow</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#64748B] max-w-3xl mx-auto leading-relaxed font-medium">
                See how businesses across industries capture leads faster, enforce follow-ups, and turn enquiries into revenue automatically.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/get-started" className="w-full sm:w-auto px-8 py-4 bg-[#2563EB] hover:opacity-90 text-white rounded-[14px] font-bold transition-all shadow-[0_10px_25px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2 hover:-translate-y-0.5">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-[#E2E8F0] rounded-[14px] font-bold transition-all shadow-[0_5px_15px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2 group hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)] hover:border-[#CBD5E1]">
                Book a Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Visual System Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            <div className="relative rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden p-8 transition-shadow duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

                {/* Visual Pathway */}
                <div className="flex-1 flex flex-col items-center gap-2 relative">
                  <div className="w-16 h-16 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-sm relative z-10">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Lead Capture</span>
                </div>

                <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-[#BFDBFE] to-[#EFF6FF] relative">
                  <ArrowRight className="absolute -right-3 -top-2 w-4 h-4 text-[#BFDBFE]" />
                </div>
                <div className="md:hidden h-8 w-0.5 bg-gradient-to-b from-[#BFDBFE] to-[#EFF6FF] relative" />

                <div className="flex-1 flex flex-col items-center gap-2 relative">
                  <div className="w-16 h-16 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-indigo-600 shadow-sm relative z-10">
                    <Network className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Automation</span>
                </div>

                <div className="hidden md:block w-12 h-0.5 bg-[#E2E8F0] relative">
                  <ArrowRight className="absolute -right-3 -top-2 w-4 h-4 text-[#E2E8F0]" />
                </div>
                <div className="md:hidden h-8 w-0.5 bg-[#E2E8F0] relative" />

                <div className="flex-1 flex flex-col items-center gap-2 relative">
                  <div className="w-16 h-16 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-purple-600 shadow-sm relative z-10">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Sales Team</span>
                </div>

                <div className="hidden md:block w-12 h-0.5 bg-[#E2E8F0] relative">
                  <ArrowRight className="absolute -right-3 -top-2 w-4 h-4 text-[#E2E8F0]" />
                </div>
                <div className="md:hidden h-8 w-0.5 bg-[#E2E8F0] relative" />

                <div className="flex-1 flex flex-col items-center gap-2 relative">
                  <div className="w-16 h-16 rounded-[14px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-[0_5px_15px_rgba(37,99,235,0.1)] relative z-10">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm">Revenue dashboard</span>
                </div>

              </div>
            </div>
          </motion.div>
        </section>

        {/* SECTION 1 — Built for Teams That Handle Leads */}
        <section className="py-24 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 tracking-tighter">Built for Teams That Handle Leads</h2>
              <p className="text-xl text-[#64748B] mt-4 max-w-2xl">Modern tools explicitly designed for velocity, visibility, and conversion.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {[
                {
                  title: "Sales Teams",
                  icon: <BarChart3 className="w-7 h-7" />,
                  problem: "Sales teams miss leads because follow-ups are manual.",
                  helps: ["Instant lead assignment", "Automated follow-up reminders", "SLA enforcement", "Performance dashboards"],
                  outcome: "Teams respond faster and close more deals."
                },
                {
                  title: "Marketing Agencies",
                  icon: <Megaphone className="w-7 h-7" />,
                  problem: "Clients blame agencies for poor lead quality when the real issue is slow follow-up.",
                  helps: ["Capture every lead from campaigns", "Track follow-up performance", "Show clients real conversion data"],
                  outcome: "Agencies prove ROI and increase client retention."
                },
                {
                  title: "SMB Business Owners",
                  icon: <Briefcase className="w-7 h-7" />,
                  problem: "Owners lose leads while managing operations.",
                  helps: ["Automated lead routing", "WhatsApp follow-ups", "Visibility into team performance"],
                  outcome: "Owners never lose a potential customer again."
                },
                {
                  title: "Customer Support Teams",
                  icon: <Headset className="w-7 h-7" />,
                  problem: "Enquiries and support requests get lost across email, WhatsApp, and calls.",
                  helps: ["Centralized enquiry capture", "Task-based follow-ups", "Automated reminders"],
                  outcome: "Support teams respond faster and improve customer satisfaction."
                }
              ].map((card, idx) => (
                <FadeInView key={idx} delay={idx * 0.1} className="bg-white border border-[#E2E8F0] p-8 md:p-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-[14px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-300">
                      {card.icon}
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900">{card.title}</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">Problem</h4>
                      <div className="flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="font-medium text-gray-700">{card.problem}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E2E8F0]">
                      <h4 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">How LeadForGrow Helps</h4>
                      <ul className="space-y-3">
                        {card.helps.map((helpItem, hi) => (
                          <li key={hi} className="flex gap-3 items-start">
                            <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />
                            <span className="text-[#64748B] text-sm">{helpItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[#E2E8F0]">
                      <h4 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">Outcome</h4>
                      <div className="px-4 py-3 bg-[#EFF6FF] text-[#2563EB] rounded-[10px] font-semibold border border-[#BFDBFE]">
                        {card.outcome}
                      </div>
                    </div>
                  </div>
                </FadeInView>
              ))}

            </div>
          </div>
        </section>

        {/* SECTION 2 — Industry Use Cases */}
        <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tighter">Industry Use Cases</h2>
              <p className="text-xl text-[#64748B] max-w-2xl mx-auto">Wherever there are enquiries, LeadForGrow is the operational system driving them towards a close.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Home />, title: "Real Estate", desc: "Manage property enquiries and schedule site visits instantly." },
                { icon: <GraduationCap />, title: "Education & Coaching", desc: "Capture student enquiries and automate follow-ups for admissions." },
                { icon: <Stethoscope />, title: "Healthcare Clinics", desc: "Respond quickly to appointment enquiries and patient questions." },
                { icon: <ShoppingCart />, title: "E-commerce Brands", desc: "Convert website visitors into paying customers with instant follow-up." },
                { icon: <Megaphone />, title: "Digital Agencies", desc: "Track campaign leads and ensure sales teams respond quickly." },
                { icon: <Wrench />, title: "Local Service Businesses", desc: "Capture and respond to calls, WhatsApp, and form enquiries automatically." }
              ].map((industry, i) => (
                <FadeInView key={i} delay={i * 0.1} className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 hover:border-[#60A5FA] hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-[#F8FAFC] rounded-[10px] text-[#2563EB] flex items-center justify-center mb-6 border border-[#E2E8F0] group-hover:bg-[#EFF6FF] group-hover:border-[#BFDBFE] transition-colors">
                    {React.cloneElement(industry.icon, { className: "w-6 h-6" })}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">{industry.title}</h3>
                  <p className="text-[#64748B] leading-relaxed text-sm">{industry.desc}</p>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — The Problem LeadForGrow Solves */}
        <section className="py-24 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto text-center">
            <FadeInView className="mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 tracking-tighter">Why Businesses Use LeadForGrow</h2>
              <p className="text-xl text-[#64748B] mt-4 max-w-2xl mx-auto">We solve the friction that occurs naturally when scaling revenue operations.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Clock className="w-6 h-6 text-red-500" />,
                  bg: "bg-red-50", border: "border-red-100",
                  title: "Slow follow-ups lose deals",
                  desc: "Leads go cold within minutes if not contacted quickly."
                },
                {
                  icon: <XOctagon className="w-6 h-6 text-orange-500" />,
                  bg: "bg-orange-50", border: "border-orange-100",
                  title: "Manual systems break at scale",
                  desc: "WhatsApp groups and spreadsheets create chaos."
                },
                {
                  icon: <Users className="w-6 h-6 text-slate-500" />,
                  bg: "bg-slate-100", border: "border-slate-200",
                  title: "No accountability in sales teams",
                  desc: "Without systems, nobody knows who followed up."
                }
              ].map((feature, i) => (
                <FadeInView key={i} delay={i * 0.15} className="bg-white rounded-[16px] border border-[#E2E8F0] p-8 shadow-[0_5px_20px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] transition-all">
                  <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-6 border ${feature.bg} ${feature.border}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-[#64748B]">{feature.desc}</p>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4 — Real Workflow Example */}
        <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0]">
          <div className="max-w-5xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 tracking-tighter mb-4">Real Workflow Example</h2>
              <p className="text-xl text-[#64748B] max-w-2xl mx-auto">From an anonymous website visitor to actionable pipeline dashboard metrics in mere minutes.</p>
            </FadeInView>

            <FadeInView delay={0.2} className="relative rounded-[20px] bg-white border border-[#E2E8F0] p-8 md:p-14 shadow-[0_15px_40px_rgba(0,0,0,0.04)] max-w-4xl mx-auto group">

              {/* Decorative headers in the dashboard card */}
              <div className="absolute top-0 left-0 right-0 h-10 border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-[20px] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              </div>

              <div className="space-y-4 relative pt-6">
                {[
                  { text: "Lead submits website form", icon: <Globe className="w-5 h-5" /> },
                  { text: "Lead captured instantly", icon: <Database className="w-5 h-5" /> },
                  { text: "Assigned to sales rep", icon: <Users className="w-5 h-5" /> },
                  { text: "Sales rep notified on WhatsApp", icon: <WhatsAppIcon className="w-5 h-5" /> },
                  { text: "Follow-up reminder triggered", icon: <Clock className="w-5 h-5" /> },
                  { text: "Lead converted", icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, focus: true },
                ].map((step, idx, arr) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-6 md:gap-0 justify-start md:justify-center relative group/row">

                      <div className={`relative z-10 w-12 h-12 rounded-[12px] border flex items-center justify-center shrink-0 transition-transform duration-300 ${step.focus ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-110' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] shadow-sm bg-white hover:bg-[#EFF6FF] hover:text-[#2563EB] hover:border-[#BFDBFE]'}`}>
                        {step.icon}
                      </div>

                      <div className="md:w-[45%] md:pl-10 w-full">
                        <div className={`border p-4 rounded-[12px] text-base font-bold transition-all duration-300 ${step.focus ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-[#E2E8F0] text-gray-800 hover:border-[#60A5FA] hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(0,0,0,0.03)]'}`}>
                          {step.text}
                        </div>
                      </div>
                    </div>

                    {idx < arr.length - 1 && (
                      <div className="flex justify-start md:justify-center pl-6 md:pl-[38px] py-1 opacity-40">
                        <ArrowDown className={`w-5 h-5 ${arr[idx + 1].focus ? 'text-emerald-500' : 'text-[#64748B]'}`} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </FadeInView>
          </div>
        </section>

        {/* SECTION 5 — Results Businesses See */}
        <section className="py-24 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0] relative">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#60A5FA]/[0.05] blur-[100px] rounded-full pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6 tracking-tighter">Results Businesses See</h2>
              <p className="text-xl text-[#64748B] max-w-2xl mx-auto">Focusing exclusively on process and agility yields undeniable impacts on the bottom line.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Faster Response Times", desc: "Teams respond to leads in seconds instead of hours.", isPrimary: true },
                { title: "No Missed Leads", desc: "Every enquiry is captured and tracked automatically.", isPrimary: false },
                { title: "Better Conversions", desc: "Instant follow-ups help teams convert more high-intent leads.", isPrimary: false }
              ].map((card, i) => (
                <FadeInView key={i} delay={i * 0.1} className={`relative overflow-hidden rounded-[16px] border p-8 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-300 group ${card.isPrimary ? 'bg-white border-[#BFDBFE]' : 'bg-white border-[#E2E8F0]'}`}>
                  {card.isPrimary && (
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2563EB] to-[#60A5FA] opacity-5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform`} />
                  )}
                  <h4 className={`text-2xl font-serif font-bold mb-3 ${card.isPrimary ? 'text-[#2563EB]' : 'text-gray-900'}`}>{card.title}</h4>
                  <p className="leading-relaxed text-[#64748B] font-medium">{card.desc}</p>
                </FadeInView>
              ))}
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
              <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 tracking-tighter text-white">
                Stop Losing Leads to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Slow Follow-Ups</span>
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium">
                LeadForGrow ensures every enquiry gets an instant response and a structured follow-up process.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/get-started" className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-slate-50 text-[#2563EB] rounded-[14px] font-bold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto px-10 py-5 bg-transparent hover:bg-white/10 text-white border border-white/30 rounded-[14px] font-bold transition-all flex items-center justify-center gap-2 text-lg hover:-translate-y-1">
                  Book a Demo
                </button>
              </div>
            </FadeInView>
          </div>
        </section>

      </div>
      {/* <Footer /> */}
    </div>
  );
}
