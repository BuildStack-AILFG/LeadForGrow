'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  MessageCircle, 
  Code,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  Plus,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import Heading from '@/app/components/ui/Heading';

export default function IntegrationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('YOUR_ID');
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) {
      setUserId(id);
      fetchForms(id);
      fetchLeads(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchForms = async (uid) => {
    try {
      const res = await authFetch('/api/forms');
      const data = await res.json();
      if (data.success) {
        setForms(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forms:', error);
      setLoading(false);
    }
  };

  const fetchLeads = async (uid) => {
    try {
      const res = await authFetch('/api/automation/leads');
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const getLastLeadTime = () => {
    if (leads.length === 0) return 'No leads yet';
    const lastLead = leads.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))[0];
    const seconds = Math.floor((new Date() - new Date(lastLead.receivedAt)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const scriptTag = `<script src="https://api.leadforgrow.com/v1/lfg.js" data-id="${userId}"></script>`;

  // Static class maps — Tailwind JIT cannot compile interpolated class names
  const colorClasses = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    blue: { bg: 'bg-teal-50', text: 'text-teal-600' },
  };

  const activeSources = [
    {
      name: 'Website Forms',
      description: 'LeadForGrow embedded forms',
      icon: Code,
      status: 'active',
      formsCount: forms.length,
      leadsCount: forms.reduce((sum, f) => sum + f.submissionCount, 0),
      lastActivity: getLastLeadTime(),
      color: 'indigo',
      action: () => router.push('/automation/forms'),
      enabled: forms.length > 0
    }
  ].filter(s => s.enabled);

  const availableSources = [
    {
      name: 'External Website Form',
      description: 'Webhook / script based integration',
      icon: Globe,
      status: 'available',
      color: 'purple',
      action: () => router.push('/automation/forms')
    }
  ];

  const comingSoonSources = [
    {
      name: 'WhatsApp Button',
      description: 'Capture clicks on WhatsApp chat button',
      icon: MessageCircle,
      color: 'emerald'
    },
    {
      name: 'Call Request Button',
      description: 'Automated callback requests',
      icon: PhoneCall,
      color: 'blue'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-8 py-10">
      <div className="w-full">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-lg">Lead Sources</Heading>
              <p className="text-xs">{activeSources.length} active</p>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-teal-600" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">Lead Integrations</h1>
            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Connect external platforms and tracking scripts</p>
          </div>
        </div>

        {/* Status Strip */}
        <div className="bg-white rounded-lg border border-slate-200/80 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Active Sources</p>
                <p className="text-xl font-semibold text-slate-900">{activeSources.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Leads Captured</p>
                <p className="text-xl font-semibold text-slate-900">{leads.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Last Lead</p>
                <p className="text-xl font-semibold text-slate-900">{getLastLeadTime()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sources */}
        {activeSources.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Sources</h2>
            <div className="space-y-3">
              {activeSources.map((source) => {
                const Icon = source.icon;
                return (
                  <div
                    key={source.name}
                    className="bg-white rounded-lg border border-emerald-200 p-5 shadow-sm hover:shadow-md transition-all duration-150"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${(colorClasses[source.color] || colorClasses.indigo).bg} rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon className={`w-6 h-6 ${(colorClasses[source.color] || colorClasses.indigo).text}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-slate-900">{source.name}</h3>
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{source.description}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Code className="w-3.5 h-3.5" />
                            {source.formsCount} form{source.formsCount !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {source.leadsCount} leads
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Last submission: {source.lastActivity}
                          </span>
                        </div>

                        <button
                          onClick={source.action}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                          Manage
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Sources */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Sources</h2>
          <div className="space-y-3">
            {availableSources.map((source) => {
              const Icon = source.icon;
              return (
                <div
                  key={source.name}
                  className="bg-white rounded-lg border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-150"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${(colorClasses[source.color] || colorClasses.indigo).bg} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className={`w-6 h-6 ${(colorClasses[source.color] || colorClasses.indigo).text}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-slate-900">{source.name}</h3>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold">
                              <Circle className="w-3 h-3" />
                              Ready to connect
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{source.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={source.action}
                        className="px-4 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2"
                      >
                        Set up now
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coming Soon - Collapsed */}
        <div className="mb-6">
          <button
            onClick={() => setShowComingSoon(!showComingSoon)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 hover:text-slate-700 transition-colors"
          >
            <span>Coming Soon</span>
            {showComingSoon ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showComingSoon && (
            <div className="space-y-2">
              {comingSoonSources.map((source) => {
                const Icon = source.icon;
                return (
                  <div
                    key={source.name}
                    className="bg-slate-50 rounded-lg border border-slate-200/60 p-4 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-700">{source.name}</h3>
                        <p className="text-xs text-slate-500">{source.description}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                        Soon
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Script Section - Compact */}
        <div className="bg-slate-900 rounded-lg p-6 text-white mt-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Heading level={2} className="text-base text-white">Universal Tracking Script</Heading>
              <p className="text-xs text-slate-400">
                Paste into your website's &lt;head&gt; tag to enable all sources
              </p>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 font-mono text-xs mb-4 border border-white/10 text-indigo-300 overflow-x-auto">
            <code>{scriptTag}</code>
          </div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(scriptTag);
              toast.success('Script copied to clipboard!');
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            Copy Script
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
