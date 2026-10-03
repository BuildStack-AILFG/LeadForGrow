"use client";

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Target, 
  Phone, 
  Mail, 
  MapPin,
  Palette,
  Rocket,
  Plus,
  ShieldCheck,
  Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import UserNavbar from '../../user/Header';

export default function CreateWebsiteFunnel() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [websiteId, setWebsiteId] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    websiteName: '',
    category: '',
    city: '',
    phone: '',
    email: '',
    contactMethod: 'email',
    goal: 'leads',
    services: [{ name: '', description: '' }],
    primaryColor: '#4f46e5',
    logo: ''
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (formData.services.length < 5) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, { name: '', description: '' }]
      }));
    } else {
      toast.error('Maximum 5 services allowed');
    }
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData(prev => ({ ...prev, services: newServices }));
  };

  const handleNextStep = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        if (!formData.websiteName || !formData.category || !formData.email) {
          toast.error('Please fill required fields');
          setLoading(false);
          return;
        }

        const res = await authFetch('/api/website-funnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData })
        });
        const data = await res.json();
        if (data.success) {
          setWebsiteId(data.websiteId);
          setStep(2);
        } else {
          toast.error(data.error);
        }
      } else if (step === 2 || step === 3) {
        const res = await authFetch('/api/website-funnel', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId, ...formData })
        });
        const data = await res.json();
        if (data.success) {
          setStep(step + 1);
        } else {
          toast.error(data.error);
        }
      }
    } catch (error) {
      console.error('Step transition error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      router.push(`/website-funnel/editor/${websiteId}`);
      toast.success('Website created! Opening editor...');
    } catch (error) {
       toast.error('Failed to finish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserNavbar />
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] pt-24 pb-20 transition-colors duration-300 font-sans">
        <div className="max-w-2xl mx-auto px-6">
          
          <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-[11px] font-bold mb-6 border border-indigo-100 dark:border-indigo-800">
                Setup Wizard
             </div>
             <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Create your Funnel</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Follow the steps to configure your lead generation machine.</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-16 px-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-500 ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 shadow-glow shadow-indigo-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`h-[2px] flex-1 mx-3 rounded-full transition-all duration-500 ${step > s ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-indigo-500/5 border border-slate-200/60 dark:border-slate-800/60">
            
            {/* Step 1: Business Details */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Business Details</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Basic information used to build your funnel content.</p>
                </div>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Business Name *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Acme Services"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all text-sm text-slate-900 dark:text-white font-medium"
                        value={formData.websiteName}
                        onChange={(e) => updateFormData('websiteName', e.target.value)}
                      />
                    </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category *</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all text-sm text-slate-900 dark:text-white font-medium appearance-none"
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                      >
                        <option value="" disabled>Select a category</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Professional Services">Professional Services</option>
                        <option value="Local Services">Local Services</option>
                        <option value="Events">Events</option>
                        <option value="Agencies">Agencies</option>
                        <option value="E-commerce">E-commerce</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Location Details</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="e.g. New York, NY"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all text-sm text-slate-900 dark:text-white font-medium"
                          value={formData.city}
                          onChange={(e) => updateFormData('city', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel" 
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all text-sm text-slate-900 dark:text-white font-medium"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Contact Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        placeholder="hello@yourbusiness.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all text-sm text-slate-900 dark:text-white font-medium"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goal Selection */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-400">
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Success Goal</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">We'll optimize the funnel layout for your primary objective.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'leads', title: 'Lead Capture', icon: <Target className="w-5 h-5" />, desc: 'Focus on form submissions' },
                    { id: 'calls', title: 'Direct Calls', icon: <Phone className="w-5 h-5" />, desc: 'Primary action is tap-to-call' },
                    { id: 'whatsapp', title: 'WhatsApp Chat', icon: <WhatsAppIcon className="w-5 h-5" />, desc: 'Instant chat on WhatsApp' },
                    { id: 'appointments', title: 'Bookings', icon: <Mail className="w-5 h-5" />, desc: 'Link to your calendar' }
                  ].map((goal) => (
                    <div 
                      key={goal.id}
                      onClick={() => updateFormData('goal', goal.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 ${formData.goal === goal.id ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-600/10 shadow-lg' : 'border-slate-100 dark:border-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-600/40 bg-slate-50/30 dark:bg-slate-900/40'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.goal === goal.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                        {goal.icon}
                      </div>
                      <div>
                         <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{goal.title}</h3>
                         <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{goal.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Services */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-2 duration-400">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Services</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">List what you offer to your potential clients.</p>
                  </div>
                  <button 
                    onClick={addService}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                  {formData.services.map((service, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <input 
                        type="text" 
                        placeholder="Service Name (e.g. Graphic Design)"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600/30 transition-all text-sm text-slate-900 dark:text-white font-semibold"
                        value={service.name}
                        onChange={(e) => updateService(idx, 'name', e.target.value)}
                      />
                      <textarea 
                        placeholder="Briefly describe what's included..."
                        rows="2"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-600/30 transition-all text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed resize-none"
                        value={service.description}
                        onChange={(e) => updateService(idx, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative">
                         <input 
                           type="color" 
                           className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                           value={formData.primaryColor}
                           onChange={(e) => updateFormData('primaryColor', e.target.value)}
                         />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Primary Theme</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 uppercase font-mono">{formData.primaryColor}</p>
                      </div>
                   </div>
                   <Rocket className="w-5 h-5 text-indigo-400 opacity-30" />
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="animate-in fade-in zoom-in-[0.98] duration-400">
                <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20">
                      <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Review Configuration</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ready to launch your SaaS funnel?</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-6">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 leading-none">Business Profile</p>
                       <p className="font-semibold text-slate-900 dark:text-white">{formData.websiteName}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formData.category} • {formData.city}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 leading-none">Goal</p>
                       <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                         {formData.goal}
                       </span>
                     </div>
                   </div>

                   <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                     <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 leading-none">Core Services</p>
                     <div className="flex flex-wrap gap-2">
                        {formData.services.map((s, idx) => s.name && (
                           <span key={idx} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                             {s.name}
                           </span>
                        ))}
                     </div>
                   </div>

                   <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/10 flex items-center justify-between text-white border border-indigo-500">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-none mb-1.5">Action Integration</p>
                        <p className="text-sm font-bold">100% Autolink Enabled</p>
                      </div>
                      <Sparkles className="w-5 h-5 fill-amber-300 text-amber-300" />
                   </div>
                </div>
              </div>
            )}

            {/* Nav Controls */}
            <div className="mt-10 flex items-center justify-between gap-4">
              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  className="px-6 py-3 text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-colors transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" /> Back
                </button>
              )}
              <div className="flex-1"></div>
              {step < 4 ? (
                <button 
                  onClick={handleNextStep}
                  disabled={loading}
                  className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving System...' : 'Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:brightness-110 shadow-2xl transition-all active:scale-[0.98]"
                >
                  {loading ? 'Finalizing SaaS...' : 'Launch Website'} <Rocket className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
             <p className="text-[11px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em] transition-all">
                PHASE {step} <span className="mx-2 opacity-50">•</span> LEADFORGROW INFRASTRUCTURE
             </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-glow { box-shadow: 0 0 15px currentColor; }
      `}</style>
    </>
  );
}
