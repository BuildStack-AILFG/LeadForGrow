'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  PieChart,
  ArrowRight,
  CheckCircle2,
  Building2,
  Smartphone,
  Globe,
  Briefcase,
  Stethoscope,
  GraduationCap,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import Header from '../../user/Header'; // Relative from app/resources/case-studies/

// --- Data ---

const featuredCaseStudy = {
  id: 'featured-1',
  client: "Nexus Real Estate Group",
  industry: "Real Estate",
  industryIcon: Building2,
  problem: "Leads were slipping through the cracks due to slow manual response times and fragmented follow-up processes.",
  solution: "LeadForGrow automated follow-ups and integrated CRM with lead capture widgets across all properties.",
  results: [
    { label: "Lead Capture Increase", value: "320", suffix: "%", icon: Users },
    { label: "Response Time Reduction", value: "95", suffix: "%", icon: TrendingUp },
    { label: "Sales Conversion Increase", value: "45", suffix: "%", icon: BarChart3 },
  ],
  detailedResult: "Developed a 24/7 lead capture and nurturing system that qualifies leads instantly.",
  problemText: "Their team was taking an average of 4 hours to respond to new enquiries. By the time they called, 60% of leads had already booked a viewing with a competitor.",
  strategyText: "We implemented LeadForGrow's instant-response SMS triggers and AI-driven qualification bot to engage leads within 15 seconds of submission.",
  implementationText: "Rolled out across 15 locations, with custom CRM pipelines for each property type.",
  color: "from-blue-600 to-indigo-700"
};

const caseStudies = [
  {
    id: 1,
    client: "HealthSync Wellness",
    type: "Healthcare Provider",
    icon: Stethoscope,
    keyResult: "5.2x Faster Response",
    summary: "Reduced patient enquiry response time from 40 minutes to under 5 minutes using our auto-response system.",
    problem: "Patients were frustrated with long waiting times for appointment bookings.",
    strategy: "Automated booking system with instant SMS confirmation.",
    implementation: "Integration with multiple clinic calendars.",
    results: "35% increase in booked appointments within 30 days.",
    tags: ["Healthcare", "Automation"],
    color: "from-emerald-500/20 to-teal-500/20",
    accent: "teal"
  },
  {
    id: 2,
    client: "ScaleUp SaaS",
    type: "B2B Software",
    icon: Globe,
    keyResult: "45% Lower Churn",
    summary: "Implemented predictive lead scoring and automated re-engagement campaigns for inactive users.",
    problem: "Churn was high due to lack of timely intervention with struggling users.",
    strategy: "Behavior-based email triggers and automated account health checks.",
    implementation: "Full CRM integration with their product analytics.",
    results: "Saved $1.2M in annual recurring revenue.",
    tags: ["SaaS", "Retention"],
    color: "from-indigo-500/20 to-violet-500/20",
    accent: "indigo"
  },
  {
    id: 3,
    client: "Ecom Accelerate",
    type: "E-commerce Agency",
    icon: Smartphone,
    keyResult: "3X More Leads",
    summary: "Optimized multi-channel lead capture for 50+ clients simultaneously without increasing staff size.",
    problem: "Internal overhead was too high to manage leads for multiple clients manually.",
    strategy: "Multi-tenant platform setup with automated client reporting.",
    implementation: "White-labeled dashboard for their 50+ clients.",
    results: "Doubled profit margins per client.",
    tags: ["Agency", "Scalability"],
    color: "from-amber-500/20 to-orange-500/20",
    accent: "amber"
  },
  {
    id: 4,
    client: "Elite Auto Group",
    type: "Automotive Dealer",
    icon: Briefcase,
    keyResult: "2.7X Conversion",
    summary: "Re-engaged 'dead' leads from their 5-year-old database using AI-driven SMS campaigns.",
    problem: "A database of 10,000 leads was completely untapped and cold.",
    strategy: "Sentiment analysis on automated responses to filter hot leads.",
    implementation: "Custom nurture sequence based on past purchase history.",
    results: "Sold 42 cars in 15 days from 'dead' leads.",
    tags: ["Automotive", "Re-engagement"],
    color: "from-blue-500/20 to-sky-500/20",
    accent: "blue"
  },
  {
    id: 5,
    client: "SkillPath LMS",
    type: "Online Education",
    icon: GraduationCap,
    keyResult: "40% Higher Reminders",
    summary: "Boosted course completion rates through automated student check-ins and lead qualification.",
    problem: "Low engagement in courses leading to high refund requests.",
    strategy: "Automated WhatsApp reminders and progress-based triggers.",
    implementation: "Webhook-based integration with LMS platform.",
    results: "Refund rates dropped by 65%.",
    tags: ["EdTech", "Retention"],
    color: "from-rose-500/20 to-pink-500/20",
    accent: "rose"
  },
  {
    id: 6,
    client: "GreenSpace Landscaping",
    type: "Home Services",
    icon: Building2,
    keyResult: "200% Growth",
    summary: "Scaled from a local business to a state-wide service provider by automating their quotes and scheduling.",
    problem: "Owner was spending 6 hours a day on the phone instead of on-site.",
    strategy: "Automated quoting engine and lead pre-qualification.",
    implementation: "Mobile-responsive booking widgets for social media.",
    results: "Business expanded to 4 new cities.",
    tags: ["Local Business", "Growth"],
    color: "from-cyan-500/20 to-blue-500/20",
    accent: "cyan"
  }
];

const testimonials = [
  {
    name: "John Danforth",
    role: "Director, Nexus Real Estate",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    content: "LeadForGrow didn't just give us a tool; they gave us a system for growth. Our conversion rates have skyrocketed since we started using their automated follow-ups."
  },
  {
    name: "Sarah Jenkins",
    role: "Founder, ScaleUp SaaS",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
    content: "The best CRM we've used for client retention. The automated re-engagement triggers are a game-changer for any SaaS business."
  },
  {
    name: "Michael Chen",
    role: "CEO, Ecom Accelerate",
    image: "https://randomuser.me/api/portraits/men/12.jpg",
    content: "Scaling an agency is hard, but LeadForGrow makes it manageable. We manage 10x the clients with the same team size now."
  }
];

const impactMetrics = [
  { label: "Total Leads Generated", value: 125, suffix: "M+", icon: Users },
  { label: "Avg. Conversion Rise", value: 85, suffix: "%", icon: TrendingUp },
  { label: "Businesses Growing", value: 2500, suffix: "+", icon: Building2 },
  { label: "Time Saved Daily", value: 4.5, suffix: "k hrs", icon: Globe },
];

// --- Sub-components ---

function Counter({ value, duration = 2, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;

    let startTime;
    let animationFrame;
    const target = parseFloat(value);

    const countUp = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(countUp);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(countUp);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}


const CaseStudyCard = ({ study, onClick }) => (
  <motion.div
    layoutId={`card-${study.id}`}
    onClick={() => onClick(study)}
    whileHover={{
      y: -12,
      boxShadow: "0 30px 60px -12px rgba(99, 102, 241, 0.25)",
      borderColor: "rgba(99, 102, 241, 0.4)"
    }}
    className="relative group cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 overflow-hidden transition-colors duration-300"
  >
    <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors`}>
          <study.icon className={`w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform`} />
        </div>
        <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-indigo-600" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">{study.type}</span>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{study.client}</h3>
      <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-4">{study.keyResult}</p>

      <p className="text-slate-600 dark:text-slate-400 mb-8 line-clamp-3 leading-relaxed">
        {study.summary}
      </p>

      <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold group">
        View Case Study
        <ArrowRight className="ml-2 w-5 h-5 translate-x-0 group-hover:translate-x-2 transition-transform" />
      </div>
    </div>
  </motion.div>
);

const DetailModal = ({ study, onClose }) => {
  if (!study) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${study.id}`}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 md:p-12 relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row gap-12 pt-4">
          <div className="flex-1 space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <study.icon className="w-8 h-8 text-indigo-600" />
                <span className="text-sm font-bold tracking-widest uppercase text-indigo-600">{study.type}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">{study.client}</h2>
              <div className="text-3xl font-bold text-indigo-600">{study.keyResult}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full" /> Problem
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                  "{study.problem}"
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" /> Strategy
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                  {study.strategy}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" /> Results
              </h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl">
                <p className="text-2xl font-medium text-slate-800 dark:text-slate-200 mb-6">{study.results}</p>
                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main Component ---

export default function CaseStudiesPage() {
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Background animation values
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const y2 = useTransform(scrollY, [0, 500], [0, 50]);

  const nextTestimonial = () => setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const timer = setInterval(() => {
      nextTestimonial();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-hidden font-sans">
      <Header />

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 px-8">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50/50 dark:bg-slate-950/50">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 left-[10%] w-[35vw] h-[35vw] bg-indigo-500/15 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              x: [0, -40, 0],
              y: [0, 60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 right-[10%] w-[45vw] h-[45vw] bg-purple-500/15 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25vw] h-[25vw] bg-blue-400/10 rounded-full blur-[100px]"
          />
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-6 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold tracking-widest uppercase mb-6 inline-block">
              Success Stories
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
              Real Businesses.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Real Growth.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Discover how LeadForGrow helps ambitious businesses across industries capture more leads,
            automate follow-ups, and convert browsers into lifelong customers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-8"
          >
            <button
              onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 text-white px-12 py-6 rounded-2xl text-xl font-bold hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/30 active:scale-95 flex items-center gap-4 mx-auto"
            >
              Explore Success Stories <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- Featured Case Study (Scroll Storytelling) --- */}
      <section id="featured" className="py-24 md:py-40 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-12">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <featuredCaseStudy.industryIcon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">Featured Story</span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight"
                >
                  How {featuredCaseStudy.client} Improved Sales by 45%
                </motion.h2>
              </div>

              {/* Storytelling components */}
              <div className="space-y-24 relative pt-8">
                <div className="absolute top-0 left-6 w-1 h-full bg-slate-200 dark:bg-slate-800 -z-10" />

                {/* Step 1: Problem */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: "-100px" }}
                  className="relative pl-16 group"
                >
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-rose-500 border-4 border-white dark:border-slate-900 group-hover:scale-125 transition-transform" />
                  <h4 className="text-xl font-bold text-rose-500 mb-2 uppercase tracking-wide">Problem</h4>
                  <p className="text-2xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {featuredCaseStudy.problemText}
                  </p>
                </motion.div>

                {/* Step 2: Solution */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: "-100px" }}
                  className="relative pl-16 group"
                >
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white dark:border-slate-900 group-hover:scale-125 transition-transform" />
                  <h4 className="text-xl font-bold text-indigo-500 mb-2 uppercase tracking-wide">Solution</h4>
                  <p className="text-2xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {featuredCaseStudy.strategyText}
                  </p>
                </motion.div>

                {/* Step 3: Result */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ margin: "-100px" }}
                  className="relative pl-16 group"
                >
                  <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900 group-hover:scale-125 transition-transform" />
                  <h4 className="text-xl font-bold text-emerald-500 mb-2 uppercase tracking-wide">Key Result</h4>
                  <p className="text-2xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {featuredCaseStudy.keyResult} revenue boost and near-instant qualification.
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="sticky top-32">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative"
              >
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${featuredCaseStudy.color} opacity-5 blur-3xl`} />

                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Performance Summary</h3>

                <div className="space-y-8">
                  {featuredCaseStudy.results.map((result, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <result.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-lg font-medium text-slate-500">{result.label}</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 dark:text-white">
                          <Counter value={result.value} suffix={result.suffix} />
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${result.value}%` }}
                          transition={{ duration: 1.5, delay: idx * 0.2 }}
                          className={`h-full bg-gradient-to-r ${featuredCaseStudy.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-16 p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-indigo-900 dark:text-indigo-100 text-lg font-medium italic">
                    "Since implementing LeadForGrow, our outbound team has focused solely on qualified appointments. No more cold calling, just closing deals."
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <img
                      src="https://randomuser.me/api/portraits/men/45.jpg"
                      alt="Quote"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">John Danforth</div>
                      <div className="text-sm text-slate-500">Director of Sales</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Case Study Grid --- */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Browse All Stories</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">Explore how specific industries use our platform to drive unprecedented growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((study) => (
            <CaseStudyCard
              key={study.id}
              study={study}
              onClick={setSelectedStudy}
            />
          ))}
        </div>
      </section>

      {/* --- Impact Metrics Section --- */}
      <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500 rounded-full blur-[200px]" />
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-20">Global Platform Impact</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {impactMetrics.map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6">
                  <metric.icon className="w-6 h-6" />
                </div>
                <div className="text-5xl font-black tracking-tighter">
                  <Counter value={metric.value} suffix={metric.suffix} />
                </div>
                <div className="text-slate-400 font-medium uppercase tracking-widest text-sm">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Testimonials Section --- */}
      <section className="py-24 md:py-40 px-8">
        <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-[4rem] p-10 md:p-20 shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800">
          <div className="absolute top-0 right-0 p-8 text-indigo-100 dark:text-slate-800">
            <TrendingUp size={160} strokeWidth={0.5} />
          </div>

          <div className="relative z-10">
            <div className="flex gap-2 mb-10">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 shadow-lg" />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-10"
              >
                <p className="text-3xl md:text-4xl text-slate-800 dark:text-slate-200 leading-tight font-medium">
                  "{testimonials[activeTestimonial].content}"
                </p>

                <div className="flex items-center justify-between flex-wrap gap-8">
                  <div className="flex items-center gap-5">
                    <img
                      src={testimonials[activeTestimonial].image}
                      alt={testimonials[activeTestimonial].name}
                      className="w-16 h-16 rounded-full ring-4 ring-indigo-50 dark:ring-indigo-900/30 object-cover"
                    />
                    <div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">{testimonials[activeTestimonial].name}</div>
                      <div className="text-slate-500 font-medium">{testimonials[activeTestimonial].role}</div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={prevTestimonial}
                      className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition shadow-sm"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition shadow-sm"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 md:py-40 px-8 text-center bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight"
          >
            Ready to grow your leads?
          </motion.h2>
          <p className="text-2xl text-slate-500 font-light">
            See how LeadForGrow can help streamline your sales process.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <a
              href="/user/register"
              className="bg-indigo-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 group w-full sm:w-auto"
            >
              Start Using LeadForGrow
              <ArrowRight className="inline-block ml-3 group-hover:translate-x-1" />
            </a>
            <a
              href="/contact"
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-12 py-6 rounded-2xl text-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-xl w-full sm:w-auto"
            >
              Talk to an Expert
            </a>
          </div>
        </div>
      </section>

      {/* --- Modals/Overlays --- */}
      <AnimatePresence>
        {selectedStudy && (
          <DetailModal
            study={selectedStudy}
            onClose={() => setSelectedStudy(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

