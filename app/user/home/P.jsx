'use client';

import React, { useState } from 'react';
import {
  Check,
  ArrowRight,
  Globe,
  Info,
  X,
  Mail,
  CheckCircle2,
  Briefcase,
  Building2,
  Users,
  Database,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PricingSection() {
  const [planType, setPlanType] = useState('business');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calculatePrice = (monthlyPrice) => {
    const price = parseInt(monthlyPrice.replace(/,/g, ''));
    if (billingCycle === 'quarterly') return (price * 3).toLocaleString('en-IN');
    if (billingCycle === 'yearly') return (price * 10).toLocaleString('en-IN');
    return monthlyPrice;
  };

  const getPeriodLabel = () => {
    if (billingCycle === 'quarterly') return '/ quarter';
    if (billingCycle === 'yearly') return '/ year';
    return '/ mo';
  };

  const businessPlans = [
    {
      name: "Starter",
      tagline: 'for solo founders, shops, clinics',
      price: "999",
      period: getPeriodLabel(),
      features: [
        "Up to 500 leads / month",
        "1 user",
        "Lead capture forms",
        "Tasks & reminders",
        "SLA tracking",
        "Email automation",
        "Manual WhatsApp & call logs",
        "Basic reports"
      ],
      description: 'Perfect for solo founders who want simple lead tracking and follow-ups.',
      color: 'indigo'
    },
    {
      name: "Growth",
      tagline: 'for small teams who reply fast',
      subheading: 'Cheaper than hiring 1 sales guy',
      price: "2,999",
      period: getPeriodLabel(),
      featured: true,
      tag: "Most Popular",
      features: [
        "Up to 2,000 leads / month",
        "Up to 3 users",
        "Everything in Starter +",
        "WhatsApp automation (API-based)",
        "Advanced automation rules",
        "Lead ownership & assignment",
        "SLA breach alerts",
        "Revenue at risk dashboard",
        "Team performance view"
      ],
      description: 'For teams who reply fast and want automation to close more deals.',
      color: 'indigo'
    },
    {
      name: 'Pro',
      tagline: 'for agencies & sales teams',
      price: '5,999',
      period: getPeriodLabel(),
      features: [
        'Up to 6,000 leads / month',
        'Up to 8 users',
        'Everything in Growth +',
        'Round-robin lead assignment',
        'Multi-pipeline tracking',
        'Advanced reports & exports',
        'Call recovery workflows',
        'Custom automation rules',
        'Integrations (webhooks, API)',
        'Priority support'
      ],
      description: 'High-intent businesses and agencies managing multiple pipelines.',
      color: 'indigo'
    },
    {
      name: 'Done-For-You',
      tagline: 'website + system',
      setupFee: '₹20,000 – ₹25,000 (Setup)',
      price: '3,999',
      period: getPeriodLabel(),
      features: [
        'Business website built',
        'Lead capture forms setup',
        'WhatsApp + Email automation',
        'Follow-up strategy design',
        'SLA rules & recovery logic',
        'Team setup & training',
        'Custom templates',
        'Dashboard customization',
        'Monthly performance review',
        'Priority WhatsApp support'
      ],
      description: 'Zero effort, full execution. We build everything for you.',
      color: 'indigo'
    }
  ];

  const agencyPlans = [
    {
      name: "Agency Starter",
      tagline: '🟢 Small Agencies',
      price: "4,999",
      period: getPeriodLabel(),
      limits: [
        "5 clients",
        "3,000 leads / month",
        "5 team seats"
      ],
      features: [
        "Client-wise dashboards",
        "Lead capture & ingestion",
        "Task & follow-up enforcement",
        "SLA tracking",
        "Email automation",
        "Manual WhatsApp logging",
        "Basic reports"
      ],
      description: 'Replaces Google Sheets chaos with real client management.',
      why: 'Perfect starting point for agencies getting serious.',
      color: 'emerald'
    },
    {
      name: "Agency Growth",
      tagline: '🔵 Most Popular',
      subheading: 'Worth every rupee vs hiring a sales manager',
      price: "8,999",
      period: getPeriodLabel(),
      featured: true,
      tag: "Best Plan",
      limits: [
        "15 clients",
        "10,000 leads / month",
        "12 team seats"
      ],
      features: [
        "Everything in Starter +",
        "WhatsApp automation (API)",
        "Advanced automation rules",
        "SLA breach alerts",
        "Client health monitoring",
        "Revenue & conversion tracking",
        "Invoicing & collections tracking",
        "Advanced reports & exports"
      ],
      description: 'For agencies managing outcomes and client satisfaction.',
      why: 'Not enterprise shock pricing. Just right.',
      color: 'blue'
    },
    {
      name: "Agency Pro",
      tagline: '🔴 Growing Agencies',
      price: "14,999",
      period: getPeriodLabel(),
      limits: [
        "30 clients",
        "25,000 leads / month",
        "25 team seats"
      ],
      features: [
        "White-label client access",
        "Advanced intelligence dashboards",
        "Custom automation rules",
        "API & webhook access",
        "Priority SLA logic",
        "Audit logs",
        "Priority support"
      ],
      description: 'For mid-size agencies scaling operations professionally.',
      why: 'Complete agency management platform with white-label.',
      color: 'rose'
    },
    {
      name: "Agency Custom",
      tagline: '⚫ Large Agencies',
      price: "25,000+",
      period: getPeriodLabel(),
      limits: [
        "Custom limits",
        "Dedicated infrastructure",
        "Custom SLA & security"
      ],
      features: [
        "Everything in Pro +",
        "Unlimited clients",
        "Unlimited leads",
        "Unlimited team seats",
        "Dedicated account manager",
        "Custom integrations",
        "White-glove onboarding",
        "Priority support"
      ],
      description: 'Enterprise-grade solution for large agencies with custom needs.',
      why: 'Built for scale, security, and custom workflows.',
      color: 'slate'
    }
  ];

  const addons = [
    {
      icon: Database,
      name: "Extra Leads",
      price: "500",
      period: "/ 1,000 leads",
      description: "Scale beyond your plan limits"
    },
    {
      icon: Users,
      name: "Extra Users",
      price: "299",
      period: "/ user / month",
      description: "Add more team members"
    },
    {
      icon: Shield,
      name: "White-Label",
      price: "3,999",
      period: "/ month",
      description: "Your brand, our platform"
    },
    {
      icon: Globe,
      name: "Custom Domain Forms",
      price: "499",
      period: "/ month",
      description: "Professional branded forms"
    }
  ];

  const agencyAddons = [
    {
      icon: Briefcase,
      name: "Extra Client",
      price: "399",
      period: "/ client / month",
      description: "Add more clients to your account"
    },
    {
      icon: Database,
      name: "Extra Leads",
      price: "1,000",
      period: "/ 5,000 leads",
      description: "Scale beyond plan limits"
    },
    {
      icon: Users,
      name: "Extra Team Seat",
      price: "249",
      period: "/ seat / month",
      description: "Expand your team"
    },
    {
      icon: Shield,
      name: "White-Label Branding",
      price: "Included",
      period: "in Pro plan",
      description: "Free in Agency Pro"
    }
  ];

  const activePlans = planType === 'business' ? businessPlans : agencyPlans;
  const activeAddons = planType === 'business' ? addons : agencyAddons;

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <div id="pricing" className="bg-white dark:bg-black text-slate-600 dark:text-slate-400 antialiased py-32 border-t border-slate-50 dark:border-slate-900 transition-colors duration-500" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Header & Toggle */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white mb-8 tracking-tight">
            Plans that pay for themselves.
          </h2>

          {/* Combined Toggles in One Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {/* Plan Type Toggle */}
            <div className="inline-flex p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                suppressHydrationWarning
                onClick={() => setPlanType('business')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all ${planType === 'business' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}
              >
                <Briefcase className="w-4 h-4" /> Businesses
              </button>
              <button
                suppressHydrationWarning
                onClick={() => setPlanType('agency')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all ${planType === 'agency' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}
              >
                <Building2 className="w-4 h-4" /> Agencies
              </button>
            </div>


          </div>
          {/* Billing Cycle Toggle */}
          <div className="inline-flex p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <button
              suppressHydrationWarning
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-xl text-xs font-medium transition-all uppercase tracking-widest ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}
            >
              Monthly
            </button>
            <button
              suppressHydrationWarning
              onClick={() => setBillingCycle('quarterly')}
              className={`px-6 py-2.5 rounded-xl text-xs font-medium transition-all uppercase tracking-widest ${billingCycle === 'quarterly' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}
            >
              Quarterly
            </button>
            <button
              suppressHydrationWarning
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-xl text-xs font-medium transition-all uppercase tracking-widest relative ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500'}`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">2 FREE</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32 max-w-[1400px] mx-auto`}>
          {activePlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-[2.5rem] p-8 transition-all duration-500 ${plan.featured
                ? 'bg-[#fcfcff] dark:bg-indigo-950/20 ring-2 ring-indigo-500/30 shadow-2xl lg:scale-105 z-10'
                : 'bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800'
                }`}
            >
              {plan.tag && (
                <div className={`absolute top-[-12px] left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 px-4 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest shadow-sm ${planType === 'agency' ? 'text-blue-500' : 'text-indigo-500'}`}>
                  {plan.tag}
                </div>
              )}

              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">

                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{plan.name}</h3>

                  </div>
                  <div className="relative group/info">
                    <Info className="w-4 h-4 text-slate-300 dark:text-slate-700 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-3 w-56 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-3xl shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 z-50 pointer-events-none">
                      <p className="text-[11px] leading-relaxed text-slate-200 font-medium">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xs font-medium text-slate-400">₹</span>
                  <span className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tighter">{calculatePrice(plan.price)}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium text-xs tracking-tight">{plan.period}</span>
                </div>
                {plan.setupFee && (
                  <div className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-semibold uppercase tracking-widest mb-4">{plan.setupFee}</div>
                )}
              </div>

              {/* Limits Section for Agency Plans */}
              {plan.limits && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-2">Limits</p>
                  <div className="space-y-1.5">
                    {plan.limits.map((limit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[12px] text-slate-700 dark:text-slate-300 font-medium">{limit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="flex-1 space-y-2.5 mb-8">
                {plan.limits && (
                  <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-2">Includes</p>
                )}
                {plan.features.map((feature, i) => {
                  const isGreen = feature.includes('clients') ||
                    feature.includes('automation') ||
                    feature.includes('WhatsApp') || feature.includes('Revenue at risk dashboard') || feature.includes('Round-robin lead assignment') || feature.includes('Multi-pipeline tracking') ||
                    feature.includes('Business website built') || feature.includes('Lead capture forms setup') || feature.includes('Follow-up strategy design') || feature.includes('Lead capture forms') ||
                    feature.includes('Team setup & training') || feature.includes('Custom templates') || feature.includes('Integrations (webhooks, API)') || feature.includes('Everything in') || feature.includes('Priority ');

                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 ${isGreen ? 'text-emerald-500' : 'text-indigo-500 opacity-60'}`}>
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      </div>
                      <span className={`text-[12px] leading-snug ${isGreen ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 font-normal'}`}>
                        {feature}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                suppressHydrationWarning
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-4 rounded-xl font-semibold text-[12px] uppercase tracking-widest transition-all ${plan.featured
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-2xl shadow-indigo-600/20'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                {plan.name === 'Agency Custom' || plan.name === 'Done-For-You' ? 'Contact Sales' : `Choose ${plan.name.split(' ')[0]}`}
              </button>


            </div>
          ))}
        </div>
        {/* Add-ons Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-5xl font-serif text-slate-900 dark:text-white mb-4 tracking-tight">
              Power-Up Your Plan
            </h3>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
              Scale seamlessly with India-friendly add-ons
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
            {activeAddons.map((addon, index) => {
              const Icon = addon.icon;
              const isIncluded = addon.price === 'Included';
              return (
                <div
                  key={index}
                  className="group bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-indigo-200 dark:hover:border-indigo-800"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    {addon.name}
                  </h4>
                  <div className="mb-4">
                    {!isIncluded && (
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-xs font-medium text-slate-400">₹</span>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{addon.price}</span>
                      </div>
                    )}
                    {isIncluded && (
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Included</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">{addon.period}</p>
                  </div>
                  <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {addon.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="text-center pt-16 border-t dark:border-slate-900">
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
            Need custom workflows, specialized limits, or enterprise support?
          </p>
          <button
            suppressHydrationWarning
            onClick={() => {
              setSelectedPlan({ name: 'Custom Enterprise' });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            Connect With Sales <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Payment Modal Refactored to Contact Modal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <button suppressHydrationWarning onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-3 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="p-12 sm:p-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 mx-auto mb-10">
                <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Ready to Scale?</h3>
              <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-[320px] mx-auto">
                Please reach out to our team to activate <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedPlan.name}</span> and discuss your requirements.
              </p>

              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-3">Primary Contact</p>
                  <a href="mailto:contact@leadforgrow.com" className="text-xl font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    contact@leadforgrow.com
                  </a>
                </div>

                <div className="flex flex-col gap-4">
                  <a
                    href={`mailto:contact@leadforgrow.com?subject=Inquiry for ${selectedPlan.name} Plan&body=Hi LeadForGrow Team,%0A%0AI'm interested in the ${selectedPlan.name} plan. My business needs are: %0A%0A [Tell us your need here]`}
                    className="w-full py-6 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    Send Email Now <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    suppressHydrationWarning
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-4 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    Back to Plans
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}