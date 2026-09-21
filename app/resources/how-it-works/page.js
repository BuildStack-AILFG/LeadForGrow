"use client";

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  Network,
  RotateCw,
  BarChart3,
  ArrowRight,
  Play,
  Clock,
  ShieldAlert,
  TrendingUp,
  MessageSquare,
  Smartphone,
  Globe,
  Mail,
  Database,
  CheckCircle2,
  Bell,
  CheckCircle,
  Users,
  Activity,
  Layers,
  Facebook,
  MonitorPlay
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

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans dark:text-slate-300 selection:bg-indigo-100 selection:text-blue-900 overflow-x-hidden pt-20 flex flex-col">
      <UserNavbar />

      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/30 blur-[150px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50/40 blur-[120px]" />
      </div>

      <div className="relative z-10">

        {/* HERO SECTION */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-indigo-600 font-medium text-sm shadow-sm backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Revenue Follow-Up Operating System
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter mb-6 leading-[1.1]">
                How LeadForGrow <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600">Works</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-light leading-relaxed text-lg">
                From enquiry to revenue in seconds. See how our Rev-OS captures, routes, and converts every lead automatically.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/get-started" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 group">
                <Play className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> Watch Platform Demo
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Visual System Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="mt-24 relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            <div className="relative rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden ring-1 ring-black/5 p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                {/* Horizontal connection line for desktop */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 -translate-y-1/2 z-0" />

                {[
                  { icon: <Sparkles />, title: "Capture", desc: "Leads automatically synced from forms & ads", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
                  { icon: <Network />, title: "Automate", desc: "Rules-based intelligent routing to reps", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
                  { icon: <RotateCw />, title: "Follow-Up", desc: "Instant multi-channel engagement", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                  { icon: <BarChart3 />, title: "Revenue", desc: "Deals won & visibility across pipeline", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" }
                ].map((step, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center bg-white dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${step.bg} ${step.color} ${step.border} border ring-4 ring-white`}>
                      {React.cloneElement(step.icon, { className: "w-6 h-6" })}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Glowing orb behind the dashboard */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-400/10 blur-[100px] rounded-full" />
          </motion.div>
        </section>

        {/* SECTION 1 — The 4-Step Revenue Engine */}
        <section className="py-24 bg-white dark:bg-slate-900/30 px-4 sm:px-6 lg:px-8 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-sm font-bold text-indigo-600 tracking-wider uppercase mb-3">The Engine</h2>
              <h3 className="text-4xl md:text-6xl font-serif  text-slate-900 dark:text-white mb-6 tracking-tight">The 4-Step Revenue Engine</h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                LeadForGrow works seamlessly in the background to ensure no lead is ever dropped. Every step of the funnel is optimized for speed.
              </p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">

              <FadeInView delay={0.1} className="group relative bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-indigo-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Capture Instantly</h4>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-sm">
                  The moment a lead submits a form, sends a WhatsApp message, or calls, LeadForGrow captures it instantly and logs it in the system.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Website forms</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> WhatsApp enquiries</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Incoming calls & Ads</li>
                </ul>
              </FadeInView>

              <FadeInView delay={0.2} className="group relative bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-indigo-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Network className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Smart Routing</h4>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-sm">
                  Leads are automatically assigned to the best available team member based on rules, location, expertise, or round-robin logic.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Round-robin assignment</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Availability routing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Skill-based distribution</li>
                </ul>
              </FadeInView>

              <FadeInView delay={0.3} className="group relative bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-purple-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <RotateCw className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Automated Follow-Up</h4>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-sm">
                  If a lead isn't contacted quickly, the system starts follow-up sequences via WhatsApp and email to keep them engaged.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> WhatsApp automation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Multi-day sequences</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> SLA enforcement</li>
                </ul>
              </FadeInView>

              <FadeInView delay={0.4} className="group relative bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Revenue Visibility</h4>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed text-sm">
                  Managers see exactly which leads are pending, which deals are closing, and where expected revenue is at risk.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Revenue-at-risk board</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Performance leaderboard</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Conversion analytics</li>
                </ul>
              </FadeInView>

            </div>
          </div>
        </section>



        {/* SECTION 3 — Automation Safety Net */}
        <section className="py-24 bg-white dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800 overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

            <FadeInView className="w-full lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 font-semibold text-sm border border-orange-100">
                <ShieldAlert className="w-4 h-4" /> Fallback System
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">
                When Your Team Can’t Respond, <br />
                <span className="text-indigo-600">Automation Does.</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed text-lg">
                People get busy. Meetings run over. It happens. LeadForGrow's safety net ensures a delayed human doesn't mean a lost deal.
              </p>

              <div className="space-y-4 pt-4">
                {[
                  "Automated WhatsApp responses indicating ETA",
                  "Smart follow-up reminders to the assigned agent",
                  "Escalation alerts to management for SLA breaches",
                  "Multi-channel nurturing sequences if lead goes cold"
                ].map((text, i) => (
                  <div key={i} className="flex flex-row items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <CheckCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{text}</span>
                  </div>
                ))}
              </div>
            </FadeInView>

            <FadeInView delay={0.2} className="w-full lg:w-1/2 relative">
              <div className="relative w-full max-w-md mx-auto aspect-square rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-white shadow-2xl flex items-center justify-center p-8">

                {/* Central Hub */}
                <div className="w-32 h-32 bg-white dark:bg-slate-900/30 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 z-20 flex flex-col items-center justify-center gap-2">
                  <Activity className="w-8 h-8 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Safety Net</span>
                </div>

                {/* Orbital Nodes */}
                <div className="absolute inset-4 border border-dashed border-indigo-200 rounded-full animate-[spin_40s_linear_infinite]" />

                <div className="absolute top-[10%] left-[15%] w-16 h-16 bg-white dark:bg-slate-900/30 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-110 transition-transform cursor-pointer">
                  <MessageSquare className="w-6 h-6 text-green-500" />
                </div>

                <div className="absolute top-[15%] right-[10%] w-16 h-16 bg-white dark:bg-slate-900/30 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-110 transition-transform cursor-pointer">
                  <Mail className="w-6 h-6 text-indigo-500" />
                </div>

                <div className="absolute bottom-[20%] right-[15%] w-16 h-16 bg-white dark:bg-slate-900/30 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-110 transition-transform cursor-pointer">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>

                <div className="absolute bottom-[10%] left-[20%] w-16 h-16 bg-white dark:bg-slate-900/30 rounded-2xl shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 hover:scale-110 transition-transform cursor-pointer">
                  <Bell className="w-6 h-6 text-red-500" />
                </div>

              </div>
            </FadeInView>

          </div>
        </section>

        {/* SECTION 4 — Example Workflow */}
        <section className="py-24 bg-[#FAFAFA] px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-serif  text-slate-900 dark:text-white mb-6 tracking-tight">Experience Real Workflow Efficiency</h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">From an anonymous website visitor to actionable pipeline dashboard metrics in mere minutes.</p>
            </FadeInView>

            <FadeInView delay={0.2} className="relative rounded-2xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm">
              <div className="absolute inset-y-8 left-[39px] md:left-1/2 w-0.5 bg-gradient-to-b from-indigo-100 via-indigo-200 to-indigo-100" />

              {/* Animated Lead Dot */}
              <motion.div
                className="absolute left-[35px] md:left-[calc(50%-4px)] w-[10px] h-[10px] bg-indigo-600 rounded-full z-20 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                animate={{ top: ["2rem", "calc(100% - 2rem)"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              />

              <div className="space-y-10 relative">
                {[
                  { text: "Lead submits website form", badgeClass: "bg-blue-50 text-blue-600", hoverClass: "hover:border-blue-300", icon: <Globe className="w-5 h-5" /> },
                  { text: "Lead captured instantly in DB", badgeClass: "bg-indigo-50 text-indigo-600", hoverClass: "hover:border-indigo-300", icon: <Database className="w-5 h-5" /> },
                  { text: "Assigned to best sales rep", badgeClass: "bg-purple-50 text-purple-600", hoverClass: "hover:border-purple-300", icon: <Network className="w-5 h-5" /> },
                  { text: "Rep gets WhatsApp notification", badgeClass: "bg-green-50 text-green-600", hoverClass: "hover:border-green-300", icon: <WhatsAppIcon className="w-5 h-5" /> },
                  { text: "Rep calls lead via system", badgeClass: "bg-orange-50 text-orange-600", hoverClass: "hover:border-orange-300", icon: <Smartphone className="w-5 h-5" /> },
                  { text: "Lead qualification status updated", badgeClass: "bg-yellow-50 text-yellow-600", hoverClass: "hover:border-yellow-300", icon: <TrendingUp className="w-5 h-5" /> },
                  { text: "Revenue dashboard metrics updated", badgeClass: "bg-emerald-50 text-emerald-600", hoverClass: "hover:border-emerald-300", icon: <BarChart3 className="w-5 h-5" /> },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-6 md:gap-0 justify-start md:justify-center relative group">
                    <div className="w-16 md:w-1/2 md:text-right md:pr-12 text-slate-400 dark:text-slate-500 font-medium md:group-hover:text-slate-900 dark:text-white transition-colors hidden md:block">
                      Step {idx + 1}
                    </div>

                    <div className={`relative z-10 w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${step.badgeClass}`}>
                      {step.icon}
                    </div>

                    <div className="md:w-1/2 md:pl-12 w-full">
                      <div className={`bg-white dark:bg-slate-900/30 border ${step.hoverClass} hover:shadow-md transition-all border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm text-lg font-bold text-slate-800 dark:text-slate-200`}>
                        {step.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeInView>
          </div>
        </section>

        {/* SECTION 5 — Results Teams See */}
        <section className="py-24 bg-white dark:bg-slate-900/30 px-4 sm:px-6 lg:px-8 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <FadeInView className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-serif  text-slate-900 dark:text-white mb-6 tracking-tight">The Results Teams See</h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Numbers don't lie. Implementing our Rev-OS yields immediate performance improvements.</p>
            </FadeInView>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { metric: "Faster", title: "Response Times", desc: "Most teams respond to new leads within seconds instead of hours.", bg: "from-indigo-600 to-indigo-500" },
                { metric: "No Missed", title: "Leads", desc: "Every enquiry is captured, tracked, and assigned automatically.", bg: "from-indigo-600 to-indigo-500" },
                { metric: "Improved", title: "Conversion", desc: "Instant follow-ups help teams convert more high-intent leads.", bg: "from-purple-600 to-purple-500" }
              ].map((card, i) => (
                <FadeInView key={i} delay={i * 0.1} className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.bg} opacity-5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform`} />

                  <h3 className={`text-4xl lg:text-5xl font-serif  text-slate-900 dark:text-white text-transparent bg-clip-text bg-gradient-to-r ${card.bg} mb-4`}>
                    {card.metric}
                  </h3>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{card.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6 — Integration Layer */}
        <section className="py-24 bg-[#FAFAFA] px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <FadeInView>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter mb-6">Works With Your Existing Stack</h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 mb-16 max-w-2xl mx-auto">No need to tear down your ecosystem. LeadForGrow integrates instantly with the tools you already use.</p>
            </FadeInView>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { name: "WhatsApp Business", icon: <WhatsAppIcon size={24} /> },
                { name: "Website Forms", icon: <Globe /> },
                { name: "Google Ads", icon: <MonitorPlay /> },
                { name: "Facebook Leads", icon: <Facebook /> },
                { name: "CRM Systems", icon: <Database /> },
                { name: "Email Platforms", icon: <Mail /> }
              ].map((tool, i) => (
                <FadeInView key={i} delay={i * 0.1} className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition-all gap-4 group cursor-pointer">
                  <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {React.cloneElement(tool.icon, { className: "w-7 h-7" })}
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{tool.name}</span>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/30 relative overflow-hidden border-t border-slate-100 dark:border-slate-800">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-screen-xl bg-gradient-to-r from-indigo-50/50 to-indigo-50/50 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <FadeInView>
              <h2 className="text-5xl md:text-6xl font-serif  text-slate-900 dark:text-white mb-6 tracking-tight">
                Stop Losing Leads to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-600">Slow Follow-Ups</span>
              </h2>
              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
                LeadForGrow ensures every enquiry gets a response in seconds — not hours. Join top teams winning more revenue.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/get-started" className="w-full sm:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 text-lg">
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-lg">
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
