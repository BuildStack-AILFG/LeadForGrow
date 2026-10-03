'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Users, FileText, Shield, Sparkles } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

export default function UsagePage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await authFetch('/api/agency/usage');
      const data = await res.json();
      if (data.success) setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!usage) return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
      <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 dark:text-slate-400 font-medium">Failed to retrieve usage telemetry</p>
    </div>
  );

  const usageItems = [
    {
      name: 'Managed Clients',
      current: usage.usage.clientsUsed,
      max: usage.limits.maxClients,
      percentage: usage.percentages.clients,
      remaining: usage.remaining.clients,
      icon: Users,
      color: 'indigo'
    },
    {
      name: 'Team Infrastructure (Seats)',
      current: usage.usage.teamSeatsUsed,
      max: usage.limits.maxTeamSeats,
      percentage: usage.percentages.teamSeats,
      remaining: usage.remaining.teamSeats,
      icon: Shield,
      color: 'slate'
    },
    {
      name: 'Monthly Ingestion (Leads)',
      current: usage.usage.leadsUsed,
      max: usage.limits.maxLeadsPerMonth,
      percentage: usage.percentages.leads,
      remaining: usage.remaining.leads,
      icon: Sparkles,
      color: 'amber'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">Resource Allocation</h1>
          <div className="flex items-center gap-3 mt-2">
             <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded uppercase tracking-widest">{usage.agency.plan} Enterprise</span>
             <span className="text-slate-300">/</span>
             <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">{usage.agency.name}</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Billing cycle active</p>
           <p className="text-[13px] font-bold text-slate-900 dark:text-slate-50">
             {new Date(usage.billingPeriod.year, usage.billingPeriod.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
           </p>
        </div>
      </div>

      {/* High Density Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usageItems.map((item) => {
          const isWarning = item.percentage >= 80;
          const isDanger = item.percentage >= 95;
          
          return (
            <div key={item.name} className={`bg-white dark:bg-slate-900 border p-6 rounded-xl space-y-6 ${isDanger ? 'border-rose-200 dark:border-rose-800' : isWarning ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center justify-between">
                 <div className={`p-2 rounded-lg ${isDanger ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}>
                    <item.icon className="w-5 h-5" />
                 </div>
                 <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isDanger ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}>
                    {item.percentage}%
                 </span>
              </div>

              <div>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.name}</p>
                 <div className="flex items-baseline gap-2">
                    <h3 className="text-[24px] font-bold text-slate-900 dark:text-slate-50">{item.current.toLocaleString()}</h3>
                    <span className="text-slate-400 font-medium">/ {item.max.toLocaleString()}</span>
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-slate-900'}`} 
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                 </div>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{item.remaining.toLocaleString()} units remaining</p>
              </div>

              {isWarning && (
                <div className={`p-3 rounded-lg text-[11px] font-bold flex items-center gap-2 ${isDanger ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'}`}>
                   <AlertCircle className="w-3.5 h-3.5" />
                   {isDanger ? 'CRITICAL: Limit breached soon.' : 'WARNING: Capacity threshold met.'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan Health & Upgrade Path */}
      <div className="bg-slate-900 rounded-2xl p-10 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -mr-32 -mt-32" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4">
               <h2 className="text-[20px] font-bold text-white tracking-tight">Need industrial-grade throughput?</h2>
               <p className="text-slate-400 text-[14px] max-w-md font-medium leading-relaxed">
                 Scale your agency footprint with higher client counts, unlimited team seats and multi-tenant ingestion capabilities.
               </p>
            </div>
            <div className="flex items-center gap-4">
               <button className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-[13px] font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">View Expansion Plans</button>
               <button className="px-6 py-3 bg-white/10 dark:bg-slate-900/10 text-white text-[13px] font-bold rounded-lg border border-white/10 hover:bg-white/20 dark:hover:bg-slate-800/20 transition-all">Support Console</button>
            </div>
         </div>
      </div>
    </div>
  );
}

