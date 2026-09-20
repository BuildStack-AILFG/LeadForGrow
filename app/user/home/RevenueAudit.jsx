"use client"

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, MessageCircle, Globe, GitBranch, BarChart3, ChevronRight, ChevronLeft, Check, Command, Layers } from "lucide-react"
import Heading from "@/app/components/ui/Heading"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
}

const WhatsAppVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center p-4">
    {/* Background Circle */}
    <div className="absolute left-[5%] h-72 w-72 rounded-full bg-purple-500/5 blur-[100px]" />

    <div className="relative flex items-center gap-6 lg:gap-12">
      {/* Floating Messages */}
      <div className="flex flex-col gap-3 -mr-8 lg:-mr-16 z-10 scale-95 lg:scale-100">
        {[
          { text: "Buy", time: "09:27", delay: 0.1 },
          { text: "Discount", time: "02:11", delay: 0.2 },
          { text: "Please Send me details", time: "02:11", delay: 0.3 },
          { text: "Offer plz", time: "02:11", delay: 0.4 },
        ].map((msg, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: msg.delay }}
            className="rounded-xl bg-[#e3facf] p-3 text-xs shadow-sm flex flex-col items-start border border-green-200/50"
          >
            <span className="font-medium text-gray-800">{msg.text}</span>
            <div className="flex items-center gap-1 self-end mt-1 text-[10px] text-green-600/70">
              <span>{msg.time}</span>
              <div className="flex -space-x-1">
                <Check size={10} className="stroke-[3]" />
                <Check size={10} className="stroke-[3]" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Phone Mockup */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-56 h-[400px] lg:w-64 lg:h-[450px] rounded-[3rem] bg-gray-900 p-2.5 shadow-2xl border-[6px] border-gray-800"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-20" />
        <div className="h-full w-full rounded-[2.5rem] bg-white overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="pt-8 pb-4 px-4 bg-white border-b border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WhatsApp Leads</h4>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[
              { name: "Kavya Kumari", detail: "Buy" },
              { name: "Sk Arian Ali", detail: "Discount" },
              { name: "Ranjana R", detail: "Please Send me details" },
              { name: "Nirbhay", detail: "Offer plz" },
            ].map((lead, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm"
              >
                <div className="text-xs font-bold text-indigo-600">{lead.name}</div>
                <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-gray-200/50">
                  <div className="p-1 rounded bg-green-100">
                    <MessageCircle size={10} className="text-green-600" />
                  </div>
                  <span className="text-[10px] text-gray-500 truncate font-medium">{lead.detail}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 60 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute left-[-40px] top-[40%] h-0.5 bg-gradient-to-r from-green-400 to-indigo-500 z-30"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  </div>
)

const WebsiteVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center p-4">
    {/* Background Glow */}
    <div className="absolute h-80 w-80 rounded-full bg-indigo-500/5 blur-[100px]" />

    <div className="relative scale-90 lg:scale-100">
      {/* Phone Mockup Background */}
      <div className="relative w-56 h-[400px] lg:w-64 lg:h-[450px] rounded-[3rem] bg-gray-900 p-2 border-[6px] border-gray-800 shadow-2xl overflow-hidden">
        <div className="h-full w-full rounded-[2.5rem] bg-white p-4 flex flex-col pt-12">
          {/* Lead Activity */}
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-3">Lead activity</h4>
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
              <div className="text-xs font-bold text-indigo-600">Kavya Kumari</div>
              <div className="text-[10px] text-gray-400 mt-1 font-medium">9******056</div>
            </div>
          </div>

          {/* History */}
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-3">History</h4>
            <div className="space-y-2">
              {[
                "WhatsApp CRM",
                "Get Free Demo",
                "Pricing Page"
              ].map((page, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Globe size={10} className="text-gray-400" />
                    <span className="text-[9px] font-medium text-gray-600">Website Visit: <span className="font-bold">{page}</span></span>
                  </div>
                  <span className="text-[8px] text-gray-400 font-bold">18m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification Banner */}
      <motion.div
        initial={{ y: -20, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-8 left-1/2 w-[110%] bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 px-5 z-20 flex items-center justify-between"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-indigo-500">New lead from website</span>
          <span className="text-sm font-extrabold text-indigo-900">Kavya Kumari</span>
        </div>
        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          >
            <BarChart3 size={20} className="fill-current" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  </div>
)

const RoutingVisual = () => (
  <div className="relative flex h-full w-full items-center justify-center p-4">
    {/* Background Glow */}
    <div className="absolute h-80 w-80 rounded-full bg-blue-500/5 blur-[100px]" />

    <div className="relative scale-90 lg:scale-100">
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] -z-10" />

      {/* Phone Mockup */}
      <div className="relative w-64 h-[440px] rounded-[3rem] bg-[#1a2333] p-2 border-[6px] border-[#0f172a] shadow-2xl overflow-hidden">
        <div className="h-full w-full rounded-[2.5rem] bg-indigo-950/20 p-6 flex flex-col pt-10">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-white tracking-tight">Smart Routing</h4>
            <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center">
              <GitBranch size={12} className="text-white/60" />
            </div>
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 w-full rounded-2xl bg-white/5 border border-white/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cards */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Card 1 */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: -40, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-20 left-0 w-64 bg-white rounded-2xl shadow-2xl p-3 border border-gray-100 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden shrink-0">
            <div className="h-full w-full bg-gradient-to-br from-orange-400 to-red-400" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-extrabold text-gray-900 truncate">Sarah - Marketing</div>
            <div className="text-[9px] text-gray-500 truncate">kiek*****@gmail.com</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 ml-auto">
            <Globe size={14} className="text-blue-500 opacity-20" />
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: -25, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-44 left-6 w-64 bg-white rounded-2xl shadow-2xl p-3 border border-gray-100 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
            <div className="h-full w-full bg-gradient-to-br from-blue-400 to-indigo-400" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-extrabold text-gray-900 truncate">John - Sales</div>
            <div className="text-[9px] text-gray-500">9******21</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 ml-auto">
            <Globe size={14} className="text-blue-500 opacity-20" />
          </div>
        </motion.div>

        {/* Card 3 (Overlay Theme) */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute top-[280px] left-12 w-52 bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl p-3 border border-white/10 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
            <div className="h-full w-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-80" />
          </div>
          <div className="overflow-hidden">
            <div className="text-[10px] text-white/40 font-bold leading-tight truncate">Piavya l oang@gmail.com</div>
            <div className="text-xs font-extrabold text-white truncate">John - Sales</div>
            <div className="text-[9px] text-white/30">9******21</div>
          </div>
        </motion.div>
      </div>

      {/* Connecting Agents on Right */}
      <div className="absolute top-36 -right-12 space-y-16">
        {[
          { color: "from-amber-400 to-orange-500", delay: 1.0 },
          { color: "from-blue-400 to-indigo-500", delay: 1.2 }
        ].map((agent, i) => (
          <div key={i} className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: agent.delay, type: "spring" }}
              className="h-11 w-11 rounded-full border-[3px] border-white shadow-xl overflow-hidden bg-gray-100"
            >
              <div className={`h-full w-full bg-gradient-to-br ${agent.color}`} />
            </motion.div>

            {/* Dashed Connecting Line */}
            <svg className="absolute top-1/2 right-12 w-24 h-1 overflow-visible -translate-y-1/2">
              <motion.path
                d="M 0 0 L -80 0"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: agent.delay + 0.2, duration: 0.8 }}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const features = [
  {
    id: "whatsapp",
    icon: WhatsAppIcon,
    title: "WhatsApp",
    badge: "WhatsApp",
    headline: "Capture leads from WhatsApp messages",
    bullets: [
      "Sync whole team's chats in one CRM",
      "Capture & Manage leads",
      "Update lead stage"
    ],
    visual: <WhatsAppVisual />,
    ctaText: "Request a demo",
    ctaTheme: "primary"
  },
  {
    id: "capture",
    icon: Globe,
    title: "Website Leads",
    badge: "Website",
    headline: "Capture website leads in real-time",
    bullets: [
      "Manage and nurture all leads from one place",
      "Track every call, message, and follow-up",
      "Close more deals with a central lead hub"
    ],
    visual: <WebsiteVisual />,
    ctaText: "Request a demo",
    ctaTheme: "primary"
  },
  {
    id: "routing",
    icon: GitBranch,
    title: "Smart Routing",
    badge: "Automation",
    headline: "Assign leads to the right team, instantly",
    bullets: [
      "Route incoming leads in real-time with zero manual effort",
      "Round-robin assignment to balance workload across teams",
      "Skill-based routing to match leads with the best-fit agent",
      "Reduce response time and boost conversion rates automatically"
    ],
    visual: <RoutingVisual />,
    ctaText: "Enable smart routing",
    ctaTheme: "yellow"
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Growth Analytics",
    badge: "Analytics",
    headline: "Data-driven insights for your sales team",
    bullets: [
      "Detailed conversion funnels",
      "Response time tracking",
      "Revenue attribution"
    ],
    visual: (
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.7_0.2_300/0.2),transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-64 rounded-3xl bg-card/50 p-6 shadow-2xl backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-end gap-2 h-32">
            {[40, 70, 45, 90, 65].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 1 }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-primary/80 to-primary/20"
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <div className="h-2 w-12 rounded-full bg-white/20" />
            <div className="h-2 w-8 rounded-full bg-white/20" />
          </div>
        </motion.div>
      </div>
    ),
    ctaText: "Request a demo",
    ctaTheme: "primary"
  },
]



export default function RevenueAudit() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-16 bg-grid">
      <div className="relative z-[10] mx-auto w-full max-w-7xl">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-2">Product tour</p>
          <Heading level={2} className="text-3xl md:text-4xl text-balance">
            See how teams convert faster
          </Heading>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Explore WhatsApp capture, smart routing, and analytics — built for high-performance sales teams.
          </p>
        </motion.div>

        {/* Interactive Feature Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left: Card Column */}
          <div className="lg:col-span-4 space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.id}
                onMouseEnter={() => setActiveIndex(i)}
                className={`group relative flex cursor-pointer items-center gap-4 rounded-2xl p-5 transition-all duration-300 ${activeIndex === i
                  ? "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-none"
                  : "bg-transparent border-none hover:bg-white/40"
                  }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${activeIndex === i ? "shadow-lg" : ""
                    }`}
                  style={{
                    background:
                      activeIndex === i
                        ? "#1d4ed8" // Solid blue for active
                        : "#f1f5f9", // Light gray for inactive
                  }}
                >
                  <feature.icon
                    size={22}
                    className={`transition-colors duration-300 ${activeIndex === i ? "text-white" : "text-slate-400"
                      }`}
                    strokeWidth={2}
                  />
                </div>

                <div className="flex-1">
                  <Heading level={3} className={activeIndex === i ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}>
                    {feature.title}
                  </Heading>
                </div>

                <ChevronRight
                  size={20}
                  className={`transition-all duration-300 ${activeIndex === i ? "translate-x-0 opacity-100 text-slate-300" : "-translate-x-2 opacity-0"
                    }`}
                />
              </motion.div>
            ))}
          </div>

          {/* Right: Content Area */}
          <div className="lg:col-span-8 relative rounded-[2.5rem] bg-slate-50/50 backdrop-blur-sm border border-slate-200/50 overflow-hidden min-h-[500px] lg:min-h-[600px] shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 p-8 lg:p-14 flex flex-col lg:flex-row items-center gap-12"
              >
                {/* Visual Representation */}
                <div className="w-full lg:w-1/2 h-full flex items-center justify-center order-2 lg:order-1">
                  {features[activeIndex].visual}
                </div>

                {/* Detailed Content */}
                <div className="w-full lg:w-1/2 text-left flex flex-col justify-center order-1 lg:order-2">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="mb-4">
                      <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">
                        {features[activeIndex].badge}
                      </span>
                    </div>

                    <Heading level={2} className="mb-8 text-balance">
                      {features[activeIndex].headline}
                    </Heading>

                    <ul className="space-y-5 mb-10">
                      {features[activeIndex].bullets.map((bullet, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          className="flex items-center gap-4 text-lg font-medium text-slate-600"
                        >
                          <Check size={20} className="text-amber-500 shrink-0" strokeWidth={3} />
                          {bullet}
                        </motion.li>
                      ))}
                    </ul>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 rounded-xl px-10 py-4 text-lg font-bold transition-all bg-[#ffbe33] text-slate-900 shadow-xl shadow-yellow-500/10 hover:bg-[#f5ad0a]"
                    >
                      {features[activeIndex].ctaText}
                      <ArrowRight size={20} />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* Client Logos Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1.1}
          className="mt-20 text-center w-full"
        >
          <div className="bg-white py-3 px-8 rounded shadow-sm inline-block mb-12 border border-gray-100">
            <p className="text-gray-700 text-sm font-medium tracking-wide">
              Join innovative teams growing faster with LeadForGrow
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-6 md:space-x-16">
            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="flex items-center justify-center space-x-8 md:space-x-16 w-[85%] md:w-auto overflow-hidden">
              <img 
                src="/scaledesk_technology_logo.jpg" 
                alt="Scaledesk Technology" 
                className="h-8 md:h-10 object-contain mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity duration-300" 
              />
              <img 
                src="/homie4u.png" 
                alt="Homie4U" 
                className="h-8 md:h-10 object-contain mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity duration-300" 
              />
              {/* Pure Typography logo for CXO */}
              <div className="flex items-center justify-center h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-default select-none">
                <span className="text-2xl md:text-3xl font-black tracking-tighter text-slate-800">
                  CX<span className="text-blue-600">O</span>
                </span>
              </div>
              {/* Pure Typography logo for PMKR */}
              <div className="flex items-center justify-center h-8 md:h-10 opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-default select-none">
                <span className="text-xl md:text-2xl font-extrabold tracking-[0.15em] text-slate-800">
                  PMKR
                </span>
              </div>
            </div>
            
            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}