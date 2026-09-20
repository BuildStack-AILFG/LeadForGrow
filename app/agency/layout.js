'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, FileText, TrendingUp, AlertCircle, Lock, BarChart3, Fingerprint, Sparkles, ShieldCheck, Settings } from 'lucide-react';
import Heading from '@/app/components/ui/Heading';
import { authFetch } from '@/lib/apiClient';

export default function AgencyLayout({ children }) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState('');
  
  useEffect(() => {
    checkAccess();
  }, []);
  
  const checkAccess = async () => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!token) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const res = await authFetch('/api/agency/check-access');
      
      const data = await res.json();
      setHasAccess(data.hasAccess);
      setCurrentPlan(data.currentPlan || '');
      setLoading(false);
    } catch (error) {
      setHasAccess(false);
      setLoading(false);
    }
  };
  
  // Detect context
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const isClientContext = path.includes('/agency/clients/') && path.split('/').pop() !== 'clients';
  
  const navigation = isClientContext 
    ? [
        { name: 'Leads', href: '#leads', icon: Users },
        { name: 'Financials', href: '#invoices', icon: FileText },
        { name: 'Performance', href: '#performance', icon: TrendingUp },
        { name: 'Settings', href: '#overview', icon: Settings }
      ]
    : [
        { name: 'Console', href: '/agency', icon: TrendingUp },
        { name: 'Clients', href: '/agency/clients', icon: Building2 },
        { name: 'Team', href: '/agency/team', icon: Users },
        { name: 'Financials', href: '/agency/invoices', icon: FileText },
        { name: 'Intelligence', href: '/agency/reports', icon: BarChart3 },
        { name: 'Ingestion', href: '/agency/forms', icon: Fingerprint },
        // { name: 'Automation', href: '/agency/automation', icon: Sparkles },
        { name: 'Telemetry', href: '/agency/usage', icon: ShieldCheck }
      ];

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center">
          <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <Heading level={1} className="mb-3">Enterprise Clearance Required</Heading>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">You need an active Agency Plan to access the centralized command console.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/pricing')} className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-all">View Agency Plans</button>
            <button onClick={() => router.push('/')} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl font-bold">Return to Business Home</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="crm-app min-h-screen bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100">
      {/* Agency Command Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
             
              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.href.startsWith('#')) {
                        // Scroll or handle tab change (emulated via layout)
                        const tabBtn = document.querySelector(`button[data-tab="${item.href.replace('#', '')}"]`);
                        if (tabBtn) tabBtn.click();
                      } else {
                        router.push(item.href);
                      }
                    }}
                    className="flex items-center px-4 py-2 text-[12px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all uppercase tracking-widest"
                  >
                    <item.icon className="h-3.5 w-3.5 mr-2" />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => {
                   localStorage.removeItem('activeClientId'); // Optional cleanup
                   router.push('/');
                 }}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-[11px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-widest border border-slate-200 dark:border-slate-700"
               >
                 Business Home
               </button>
               <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">Operational</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Execution Layer */}
      <main className="py-8">
        {children}
      </main>
    </div>
  );
}
