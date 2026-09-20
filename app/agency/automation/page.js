'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Settings2, 
  Bell, 
  ShieldCheck, 
  Workflow, 
  MessageSquare, 
  Mail, 
  Globe,
  Plus,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AgencyAutomationPage() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const AutomationCard = ({ title, description, icon: Icon, active, type }) => (
    <div className={`p-6 rounded-xl border transition-all duration-300 group relative ${
      active 
        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm' 
        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          active ? 'bg-slate-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        {active && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Online
          </span>
        )}
      </div>
      
      <h3 className={`text-[15px] font-bold mb-1 ${active ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>{title}</h3>
      <p className={`text-[12px] font-medium leading-relaxed mb-6 ${active ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>
        {description}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</span>
        <button className={`flex items-center gap-1.5 font-bold text-[11px] transition-colors ${
          active ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300' : 'text-slate-400 cursor-not-allowed'
        }`}>
          Configure <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-24">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Global Logic Engine</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Configure cross-account automation and white-label triggers</p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[13px] font-bold active:scale-95 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      {/* Logic Tabs */}
      <div className="flex gap-8 border-b border-slate-100 dark:border-slate-800">
        {['workflows', 'notifications', 'security', 'api'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[12px] font-bold uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AutomationCard title="Lead Routing SDK" description="Automatically distribute incoming leads across sub-accounts based on client geography logic." icon={Workflow} active={true} type="CORE ENGINE" />
        <AutomationCard title="White-label Reports" description="Scheduled PDF generation with agency branding. Delivers performance signals via email." icon={Activity} active={true} type="REPORTING" />
        <AutomationCard title="Instant Alerts" description="Global push notifications for high-priority leads detected across any client endpoint." icon={Bell} active={false} type="NOTIFICATION" />
        <AutomationCard title="Client SMS Auto-pilot" description="AI-driven initial response system to qualify leads before they reach the dashboard." icon={MessageSquare} active={false} type="CONVERSION" />
        <AutomationCard title="Cross-Client Sync" description="Mirror templates, forms, and workflows across all connected client accounts with one click." icon={Shield} active={false} type="MANAGEMENT" />
        <AutomationCard title="External Webhooks" description="Push global agency data to Zapier, Make, or custom CRM endpoints in standard JSON." icon={Sparkles} active={true} type="INTEGRATION" />
      </div>

      {/* Health Signal Footer */}
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900 dark:text-slate-50">System Integrity: 100%</p>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">Active nodes responding across 12 region clusters</p>
            </div>
         </div>
         <div className="flex items-center gap-12">
            <div>
               <p className="text-[18px] font-black text-slate-900 dark:text-slate-50">14.2k</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks / 24H</p>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-12">
               <p className="text-[18px] font-black text-slate-900 dark:text-slate-50">1.2s</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">P99 Latency</p>
            </div>
         </div>
      </div>
    </div>
  );
}

