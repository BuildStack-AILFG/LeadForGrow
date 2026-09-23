"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  ArrowRight, 
  Plus,
  Layout,
  BarChart3,
  MousePointer2,
  Lock,
  Edit,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import UserNavbar from '../user/Header';
import Heading from '@/app/components/ui/Heading';
import { authFetch, getAuthToken } from '@/lib/apiClient';

export default function WebsiteFunnelPage() {
  const router = useRouter();
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      if (!getAuthToken()) return;
      const res = await authFetch('/api/website-funnel/list');
      const data = await res.json();
      if (data.success) {
        setWebsites(data.websites);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserNavbar />
      <div className="relative min-h-screen w-full bg-[#fcfdfe] dark:bg-[#020617] overflow-hidden font-sans pt-24 pb-12 transition-colors duration-300">
        
        <div className="relative z-10 max-w-7xl mx-auto w-full px-8 lg:px-12">
          
          {/* My Websites Dashboard */}
          {!loading && websites.length > 0 && (
            <div className="mb-24 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Website Management</span>
                  </div>
                  <Heading level={2} className="text-slate-800 dark:text-white">Active Funnels</Heading>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-normal text-sm">Monitor your live sites and lead generation performance.</p>
                </div>
                <button 
                  onClick={() => router.push('/website-funnel/create')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" /> New Website
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websites.map((site) => (
                  <div key={site._id} className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm border border-slate-100 dark:border-slate-800" style={{ backgroundColor: `${site.primaryColor || '#4f46e5'}08`, color: site.primaryColor || '#4f46e5' }}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${site.status === 'published' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-500/20'}`}>
                        {site.status}
                      </div>
                    </div>

                    <Heading level={3} className="text-slate-800 dark:text-white mb-1 truncate">{site.websiteName}</Heading>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-normal uppercase tracking-[0.1em] mb-8">/s/{site.slug}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Leads</p>
                          <p className="text-lg font-medium text-slate-800 dark:text-white leading-none">{site.leadCount || 0}</p>
                       </div>
                       <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50 text-right">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</p>
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Active</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => router.push(`/website-funnel/editor/${site._id}`)}
                        className="flex-1 py-2.5 bg-slate-800 dark:bg-indigo-600 text-white rounded-lg text-xs font-medium hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                       >
                         <Edit className="w-3 h-3" /> Edit Site
                       </button>
                       <a 
                        href={`/s/${site.slug}`}
                        target="_blank"
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                       >
                         <ExternalLink className="w-3.5 h-3.5" />
                       </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State / Hero Section */}
          {(!loading && websites.length === 0) && (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-32 pt-16">
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold mb-8 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                  <Sparkles className="w-3 h-3 fill-current text-indigo-500" />
                  Website Funnel Engine v1.0
                </div>
                <Heading level={1} className="text-slate-900 dark:text-white mb-8">
                  Build a website that <br />
                  <span className="text-indigo-600 dark:text-indigo-500">gets you leads.</span>
                </Heading>
                <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-normal max-w-lg mb-12 leading-relaxed">
                  Launch a high-converting, professional website funnel in minutes. 
                  Integrated lead capture, automated follow-ups, and instant publishing. 
                  SaaS-grade performance for modern businesses.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button 
                    onClick={() => router.push('/website-funnel/create')}
                    className="group px-7 py-3.5 bg-indigo-600 text-white rounded-lg font-semibold text-base flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all duration-300 transform hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Website
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center gap-4">
                     <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#020617] bg-slate-200 dark:bg-slate-800 shadow-sm"></div>
                        ))}
                     </div>
                     <div>
                       <p className="text-[12px] font-semibold text-slate-700 dark:text-white leading-none">Built for growing businesses</p>
                       <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Join them today</p>
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 relative w-full lg:max-w-xl">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 group animate-float">
                  <img 
                    src="/saas-preview.png" 
                    alt="SaaS Platform Preview" 
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent"></div>
                  
                  {/* Floating Performance Badge */}
                  <div className="absolute top-6 left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 animate-bounce-slow">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Performance</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">+142% Leads</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all duration-300 group shadow-sm">
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Layout className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
               </div>
               <Heading level={3} className="text-slate-800 dark:text-white mb-3">Professional Infrastructure</Heading>
               <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-normal text-sm">
                 Enterprise-ready system built for high-performance lead capture and business growth.
               </p>
            </div>
            <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all duration-300 group shadow-sm">
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <MousePointer2 className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
               </div>
               <Heading level={3} className="text-slate-800 dark:text-white mb-3">Live Dynamic Editor</Heading>
               <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-normal text-sm">
                 Update your brand and services instantly. A fully database-driven editing experience.
               </p>
            </div>
            <div className="bg-white dark:bg-[#0f172a] p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all duration-300 group shadow-sm">
               <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Lock className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
               </div>
               <Heading level={3} className="text-slate-800 dark:text-white mb-3">Lead Automation</Heading>
               <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-normal text-sm">
                 Your funnel connects automatically to our world-class lead management and automation engine.
               </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(0.2deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 12s infinite ease-in-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 6s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}
