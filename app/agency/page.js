'use client';
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Sparkles,
  Search,
  Bell,
  ChevronDown,
  LayoutGrid,
  Zap,
  Target,
  BarChart3,
  MessageSquare,
  History,
  MousePointer2,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import Link from 'next/link';

export default function AgencyDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  
  useEffect(() => {
    fetchSummary();
  }, []);
  
  const fetchSummary = async () => {
    try {
      const [usageRes, clientsRes, invoicesRes, statsRes] = await Promise.all([
        authFetch('/api/agency/usage'),
        authFetch('/api/agency/clients'),
        authFetch('/api/agency/invoices'),
        authFetch('/api/agency/reports/stats')
      ]);
      
      const usageData = await usageRes.json();
      const clientsData = await clientsRes.json();
      const invoicesData = await invoicesRes.json();
      const statsData = await statsRes.json();
      
      setSummary({
        usage: {
          ...usageData.usage,
          leadsUsed: statsData.stats?.totalLeads || usageData.usage?.leadsUsed || 0
        },
        limits: usageData.limits || {},
        agency: usageData.agency || {},
        clientsCount: clientsData.total || 0,
        invoicesCount: invoicesData.total || 0,
        recentClients: clientsData.clients?.slice(0, 5) || [],
        stats: statsData.stats || {}
      });

      const mockActivity = [
        ...(statsData.recentLeads || []).map(l => ({
           id: l._id,
           client: l.clientName,
           action: `AI reassigned lead: ${l.name}`,
           time: '2 min ago',
           actor: 'Enterprise Bot',
           icon: Zap
        })),
        { id: '1', client: 'Acme Corp', action: 'Signal detected: High Purchase Intent', time: '12 min ago', actor: 'AI Intelligence', icon: Target },
        { id: '2', client: 'Global Tech', action: 'Revenue recovery workflow triggered', time: '45 min ago', actor: 'Recovery System', icon: History }
      ].slice(0, 5);
      
      setActivity(mockActivity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to update dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#5B5FF6]/20 border-t-[#5B5FF6] rounded-full animate-spin"></div>
          <p className="small-label">Initializing Intelligence...</p>
        </div>
      </div>
    );
  }

  const Card = ({ children, className = "", noPadding = false, dark = false }) => (
    <div className={`
      rounded-[24px] border border-[#EAECEF] dark:border-slate-700 
      ${dark ? 'bg-[#0F172A] dark:bg-slate-700 text-white border-none' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100'}
      shadow-[0_1px_2px_rgba(15,23,42,0.04)]
      transition-all duration-200 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]
      ${noPadding ? '' : 'p-8'}
      ${className}
    `}>
      {children}
    </div>
  );

  const KPICard = ({ title, value, trend, icon: Icon }) => (
    <Card className="flex flex-col justify-between h-full min-h-[140px]">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-[#F8FAFC] dark:bg-slate-900 rounded-xl border border-[#EAECEF] dark:border-slate-700">
          <Icon className="w-5 h-5 text-[#94A3B8] dark:text-slate-400 stroke-[1.5]" />
        </div>
        {trend && (
          <span className={`text-[13px] font-bold flex items-center gap-1 ${trend > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="metric-value leading-none mb-1">{value}</h3>
        <p className="small-label">{title}</p>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-slate-900 pb-12">
      {/* Topbar */}
      <nav className="h-20 bg-white dark:bg-slate-900 border-b border-[#EAECEF] dark:border-slate-700 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#5B5FF6] rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <span className="font-bold text-[18px] tracking-tight">LeadForGrow</span>
          </div>
          <div className="h-8 w-[1px] bg-[#EAECEF] dark:bg-slate-800" />
          <div className="flex items-center gap-2 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
            <span className="text-[14px] font-semibold">{summary.agency.name || 'Workspace'}</span>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] dark:text-slate-400" />
          </div>
        </div>

        <div className="flex-1 max-w-md mx-12">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] dark:text-slate-400 group-focus-within:text-[#5B5FF6] dark:group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search intelligence..." 
              className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#EAECEF] dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#5B5FF6]/20 focus:border-[#5B5FF6] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] dark:bg-slate-900 rounded-full border border-[#DCFCE7] dark:border-slate-700">
            <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">AI Live</span>
          </div>
          <button className="p-2 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 rounded-xl transition-colors relative">
            <Bell className="w-5 h-5 text-[#64748B] dark:text-slate-300" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white dark:border-slate-700" />
          </button>
          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#5B5FF6] to-[#818CF8] rounded-full" />
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto p-8 space-y-8">
        {/* Top Section */}
        <div className="grid grid-cols-12 gap-6">
          {/* Revenue Forecast Hero */}
          <div className="col-span-8">
            <Card className="h-[420px] flex flex-col p-0 overflow-hidden relative">
              <div className="p-8 pb-0 flex items-center justify-between">
                <div>
                  <h2 className="text-[24px] font-bold tracking-tight">Revenue Forecast</h2>
                  <p className="text-[#64748B] dark:text-slate-300 text-[14px]">Projected pipeline performance • Q3–Q4</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0FDF4] dark:bg-slate-900 rounded-full border border-[#DCFCE7] dark:border-slate-700">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full" />
                    <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">94% Confidence</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#F8FAFC] dark:bg-slate-900 rounded-full border border-[#EAECEF] dark:border-slate-700 text-[11px] font-bold text-[#64748B] dark:text-slate-300 uppercase tracking-wider">
                    Live AI Forecast
                  </div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="flex-1 px-8 pt-8 flex items-end justify-between gap-4">
                {[45, 60, 48, 75, 90, 82, 95, 110, 100, 125, 140, 130].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 hover:opacity-80
                        ${i < 7 
                          ? 'bg-gradient-to-b from-[#5B5FF6] to-[#818CF8]' 
                          : 'border-2 border-dashed border-[#818CF8] bg-[#818CF8]/15'
                        }
                      `}
                      style={{ height: `${val * 1.5}px` }}
                    />
                    <span className="text-[10px] font-semibold text-[#94A3B8] dark:text-slate-400">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-[#0F172A] dark:bg-slate-700 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₹{(val * 1000).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Insight Bar */}
              <div className="bg-[#0F172A] dark:bg-slate-700 p-4 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#818CF8]" />
                <p className="text-[13px] text-white/90">
                  Forecast momentum increased <span className="text-[#10B981] font-bold">18%</span> after AI-led follow-up automation optimization.
                </p>
              </div>
            </Card>
          </div>

          {/* KPI Grid */}
          <div className="col-span-4 grid grid-cols-2 gap-6">
            <KPICard title="Pipeline" value={`₹${(summary.stats.revenueTracked || 0).toLocaleString()}`} trend={12} icon={TrendingUp} />
            <KPICard title="At Risk" value="₹42K" trend={-5} icon={AlertCircle} />
            <KPICard title="Recovery" value="₹1.4L" trend={24} icon={History} />
            <KPICard title="Win Rate" value={summary.stats.conversionRate || '24%'} trend={8} icon={Target} />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Executive Summary */}
          <div className="col-span-8">
            <Card dark className="h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white text-[20px] font-bold">Executive Intelligence Summary</h2>
                <button className="bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors">
                  Generate Full Report
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                {[
                  { label: 'Mid-funnel conversion dropped 12%', color: '#EF4444' },
                  { label: 'WhatsApp response latency improved 18%', color: '#10B981' },
                  { label: '₹1.4L recoverable revenue identified', color: '#5B5FF6' },
                  { label: 'Signal detected: Lead velocity peaking in Q4', color: '#10B981' },
                  { label: 'Enterprise segment showing 32% more intent', color: '#5B5FF6' },
                  { label: 'Automation gap found in follow-up sequence', color: '#F59E0B' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-[15px] font-medium text-white/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* AI Assistant */}
          <div className="col-span-4">
            <Card className="h-full flex flex-col justify-between border-dashed border-2 border-[#5B5FF6]/30 bg-[#5B5FF6]/5">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-[#5B5FF6] dark:text-indigo-400" />
                  <h2 className="text-[18px] font-bold">Revenue Assistant</h2>
                </div>
                <div className="space-y-3">
                  {['Analyze pipeline risk', 'Show lead decay', 'Predict close probability'].map((s, i) => (
                    <button key={i} className="w-full text-left px-4 py-3 bg-white dark:bg-slate-900 border border-[#EAECEF] dark:border-slate-700 rounded-xl text-[13px] font-medium hover:border-[#5B5FF6] hover:text-[#5B5FF6] dark:hover:text-indigo-400 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative mt-6">
                <input 
                  type="text" 
                  placeholder="Ask revenue intelligence..." 
                  className="w-full bg-white dark:bg-slate-900 border border-[#EAECEF] dark:border-slate-700 rounded-xl py-3 pl-4 pr-10 text-[14px] focus:outline-none focus:border-[#5B5FF6]"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#5B5FF6] text-white rounded-lg">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Revenue Audit */}
          <Card>
            <h3 className="small-label mb-6">Revenue Audit</h3>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[24px] font-bold text-[#EF4444]">₹84,000<span className="text-[14px] text-[#94A3B8] dark:text-slate-400 font-medium">/mo</span></p>
                <p className="text-[12px] font-semibold text-[#64748B] dark:text-slate-300 uppercase tracking-wider">Leak Velocity</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold">Abandonment</p>
                <p className="text-[12px] font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">Primary Vector</p>
              </div>
            </div>
            <div className="p-4 bg-[#F0FDF4] dark:bg-slate-900 rounded-2xl border border-[#DCFCE7] dark:border-slate-700 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-[#10B981]">84% Recoverable</span>
                <span className="text-[11px] font-medium text-[#10B981]">via Automation</span>
              </div>
              <div className="h-1.5 bg-[#DCFCE7] dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#10B981]" style={{ width: '84%' }} />
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 text-[13px] font-bold text-[#5B5FF6] dark:text-indigo-400 hover:underline">
              View AI Analysis <ArrowRight className="w-4 h-4" />
            </button>
          </Card>

          {/* Intent Analysis */}
          <Card>
            <h3 className="small-label mb-6">Intent Analysis</h3>
            <div className="space-y-5">
              {[
                { label: 'Evaluation Stage', value: 65, color: '#5B5FF6' },
                { label: 'Low Purchase Intent', value: 24, color: '#94A3B8' },
                { label: 'Signal Strength', value: 88, color: '#10B981' }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[13px] font-bold">
                    <span>{item.label}</span>
                    <span className="text-[#64748B] dark:text-slate-300">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-[#F8FAFC] dark:bg-slate-900 rounded-full overflow-hidden border border-[#EAECEF] dark:border-slate-700">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Team Performance */}
          <Card>
            <h3 className="small-label mb-6">Team Velocity</h3>
            <div className="space-y-4">
              {[
                { name: 'Sarah J.', leads: 42, score: 98 },
                { name: 'Mike K.', leads: 38, score: 92 },
                { name: 'AI Automator', leads: 156, score: 99 }
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#F8FAFC] dark:bg-slate-900 rounded-xl border border-[#EAECEF] dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg border border-[#EAECEF] dark:border-slate-700 flex items-center justify-center font-bold text-[12px]">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold">{member.name}</p>
                      <p className="text-[11px] text-[#94A3B8] dark:text-slate-400">{member.leads} Signals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#10B981]">{member.score}%</p>
                    <p className="text-[11px] text-[#94A3B8] dark:text-slate-400 font-medium uppercase">Efficiency</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Fourth Row */}
        <div className="grid grid-cols-12 gap-6">
          {/* Activity Feed */}
          <div className="col-span-7">
            <Card>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[18px] font-bold">Intelligence Feed</h2>
                <button className="text-[12px] font-bold text-[#5B5FF6] dark:text-indigo-400 flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-[#EAECEF] dark:divide-slate-700">
                {activity.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#F8FAFC] dark:bg-slate-900 rounded-xl border border-[#EAECEF] dark:border-slate-700 flex items-center justify-center group-hover:border-[#5B5FF6]/30 transition-colors">
                        <item.icon className="w-5 h-5 text-[#94A3B8] dark:text-slate-400 group-hover:text-[#5B5FF6] dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold">{item.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[12px] text-[#64748B] dark:text-slate-300">{item.client}</span>
                          <span className="text-[#EAECEF]">·</span>
                          <span className="text-[12px] text-[#94A3B8] dark:text-slate-400">{item.actor}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-medium text-[#94A3B8] dark:text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <div className="col-span-5">
            <Card>
              <h2 className="text-[18px] font-bold mb-8">Conversion Funnel</h2>
              <div className="space-y-2">
                {[
                  { label: 'Total Leads', count: '1,240', width: '100%', color: '#5B5FF6' },
                  { label: 'Engaged', count: '840', width: '68%', color: '#6366F1' },
                  { label: 'Sales Qualified', count: '420', width: '34%', color: '#818CF8' },
                  { label: 'Closed Won', count: '124', width: '10%', color: '#10B981' }
                ].map((step, i) => (
                  <div key={i} className="relative h-14 group">
                    <div 
                      className="absolute inset-0 rounded-xl transition-all duration-300 group-hover:opacity-90"
                      style={{ 
                        width: step.width, 
                        backgroundColor: step.color,
                        opacity: 0.1 + (i * 0.1)
                      }}
                    />
                    <div className="absolute inset-0 px-4 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#0F172A] dark:text-slate-100">{step.label}</span>
                      <span className="text-[14px] font-bold">{step.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
