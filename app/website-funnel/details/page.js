"use client";

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  ArrowRight, 
  Sparkles,
  Briefcase,
  Mail,
  Phone,
  Layout
} from 'lucide-react';
import UserNavbar from '../../user/Header';
import { authFetch } from '@/lib/apiClient';

function DetailsContent() {
  const searchParams = useSearchParams();
  const goal = searchParams.get('goal') || 'leads';
  const templateId = searchParams.get('templateId') || 'leadboost-funnel';
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    websiteName: '',
    brandName: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    if (!formData.websiteName || !formData.brandName || !formData.email) {
      toast.error("Please fill in the required fields.");
      return;
    }

    setIsCreating(true);
    
    try {
      const res = await authFetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          websiteName: formData.websiteName,
          brandName: formData.brandName,
          goal,
          content: {}
        })
      });

      const result = await res.json();
      
      if (result.success) {
        // High-end feel loading
        await new Promise(resolve => setTimeout(resolve, 3000));
        router.push('/website-funnel/dashboard');
      } else {
        toast.error("Failed to create website: " + result.error);
        setIsCreating(false);
      }
    } catch (error) {
      toast.error("Something went wrong while creating your website.");
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 "></div>
        <div className="relative z-10 max-w-lg w-full text-center">
          <div className="relative w-48 h-48 mx-auto mb-12">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping"></div>
            <div className="absolute inset-4 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <img 
                    src="/illustrations/teacher_guy.png" 
                    alt="Creating" 
                    className="w-24 h-auto drop-shadow-xl animate-float"
                />
            </div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Creating your website…</h2>
          <p className="text-slate-500 text-lg font-medium mb-8 uppercase tracking-widest text-[10px]">Architecting your high-converting funnel</p>
         
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white overflow-hidden font-sans flex flex-col pt-24 pb-12 px-6 lg:px-12">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 "></div>
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-blue-50/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-8 text-center lg:text-left">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
              Let’s set up <br className="hidden lg:block" /> your website
            </h1>
            <p className="text-slate-500 text-lg lg:text-xl font-medium max-w-2xl mx-auto lg:mx-0">
              Fill in a few details to customize your <span className="text-indigo-600 uppercase text-xs tracking-widest px-2 py-1 bg-indigo-50 rounded-lg">{templateId.replace(/-/g, ' ')}</span>.
            </p>
          </div>
          <div className="relative w-full max-w-xs animate-float">
             <img src="/illustrations/teacher_guy.png" alt="Setup Guy" className="w-full h-auto drop-shadow-2xl" />
             <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500"><Sparkles className="w-5 h-5" /></div>
                <span className="text-xs font-bold text-slate-600 uppercase">Step 3: Setup</span>
             </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-[-2rem]">
          <div className="bg-white rounded-[3.5rem] p-10 lg:p-14 border-2 border-slate-50 shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <Layout className="w-3 h-3" /> Website / Funnel Name
                </label>
                <input type="text" name="websiteName" value={formData.websiteName} onChange={handleInputChange} placeholder="e.g. My Amazing Store" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] outline-none transition-all placeholder:text-slate-300 text-slate-700 font-bold text-sm" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <Briefcase className="w-3 h-3" /> Brand / Business Name
                </label>
                <input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} placeholder="e.g. Acme Corp" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] outline-none transition-all placeholder:text-slate-300 text-slate-700 font-bold text-sm" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <Mail className="w-3 h-3" /> Primary Email
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="hello@example.com" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] outline-none transition-all placeholder:text-slate-300 text-slate-700 font-bold text-sm" />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  <Phone className="w-3 h-3" /> Phone (optional)
                </label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[1.5rem] outline-none transition-all placeholder:text-slate-300 text-slate-700 font-bold text-sm" />
              </div>
            </div>

            <div className="mt-14">
              <button 
                onClick={handleCreate}
                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xl flex items-center justify-center gap-4 hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 active:scale-[0.98] group"
              >
                Create Website 
                <div className="p-1.5 bg-white/10 rounded-xl group-hover:translate-x-2 transition-transform">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </button>
            </div>

            <p className="text-center mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Almost there. <span className="text-indigo-600">Launching in 3, 2, 1...</span>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="text-slate-400 font-bold hover:text-slate-900 transition-colors flex items-center gap-2 uppercase text-[10px] tracking-widest"
          >
            ← Back to templates
          </button>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`w-12 h-1.5 rounded-full ${step <= 3 ? (step === 3 ? 'bg-indigo-600 animate-pulse' : 'bg-indigo-200') : 'bg-slate-100'}`}></div>
            ))}
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Step 3 of 4</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

export default function WebsiteDetailsPage() {
  return (
    <>
      <UserNavbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <DetailsContent />
      </Suspense>
    </>
  );
}
