'use client';
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter, 
  Calendar,
  Users,
  Target,
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  PieChart,
  Activity,
  Loader2,
  Clock, 
  X, 
  Globe, 
  Shield 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

export default function AgencyReportsPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [filterClient, setFilterClient] = useState('all');
  const [timeRange, setTimeRange] = useState('14');
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeClients: 0,
    leadsThisMonth: 0,
    revenueTracked: 0,
    avgResponseTime: "0m",
    conversionRate: "0%"
  });
  const [topClients, setTopClients] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filterClient, timeRange]);

  const fetchInitialData = async () => {
    try {
      const res = await authFetch('/api/agency/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/agency/reports/stats?clientId=${filterClient}&days=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setTopClients(data.topClients);
        setDailyData(data.dailyStats);
        setRecentLeads(data.recentLeads || []);
      }
    } catch (err) {
      toast.error('Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const maxLeadCount = Math.max(...dailyData.map(day => day.count)) || 1;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-24">
      {/* Header Context & Advanced Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Intelligence Hub</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Deep-data auditing across {stats.activeClients} client endpoints</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex items-center shadow-sm">
              <select 
                value={filterClient} 
                onChange={(e) => setFilterClient(e.target.value)}
                className="px-3 py-1.5 text-[12px] font-bold text-slate-600 dark:text-slate-300 outline-none bg-transparent"
              >
                <option value="all">Global View</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.clientName}</option>
                ))}
              </select>
           </div>

           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 flex items-center shadow-sm">
              {[
                { label: '7D', val: '7' },
                { label: '14D', val: '14' },
                { label: '30D', val: '30' },
                { label: '90D', val: '90' }
              ].map((t) => (
                <button 
                  key={t.val}
                  onClick={() => setTimeRange(t.val)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all ${
                    timeRange === t.val ? 'bg-slate-900 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
           </div>

           <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[13px] font-bold active:scale-95 flex items-center gap-2 shadow-sm">
              <Download className="w-4 h-4" /> Export
           </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
           <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Synthesizing Datasets...</p>
        </div>
      ) : (
        <>
          {/* High-Level Pulse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { label: 'Network Reach', val: stats.activeClients, trend: stats.activeClientsTrend, icon: Users },
               { label: 'Capture Velocity', val: stats.leadsThisMonth, trend: stats.leadsTrend, icon: Target },
               { label: 'Capture Efficiency', val: stats.conversionRate, trend: stats.conversionTrend, icon: Sparkles },
               { label: 'Avg. Response', val: stats.avgResponseTime, trend: stats.responseTrend, icon: Clock }
             ].map((s, i) => (
               <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                  <div className="flex items-center justify-between">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                     <s.icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">{s.val}</h3>
                     {s.trend !== undefined && s.trend !== null && (
                       <span className={`text-[11px] font-bold ${s.trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {s.trend > 0 ? '↑' : '↓'} {Math.abs(s.trend)}%
                       </span>
                     )}
                  </div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Chart - High Density */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-sm">
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50">Ingestion Velocity ({timeRange}D)</h3>
                  <div className="flex gap-1">
                     <button className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-50 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">Bar</button>
                     <button className="px-2 py-1 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Lines</button>
                  </div>
               </div>
               <div className="p-8 h-[280px] flex items-end justify-start gap-2 overflow-x-auto custom-scrollbar">
                 {dailyData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[12px] italic">No ingestion signals detected in this range.</div>
                 ) : (
                    dailyData.map((d, i) => {
                      const height = (d.count / maxLeadCount) * 100;
                      return (
                        <div key={i} className="min-w-[40px] flex-1 max-w-[60px] flex flex-col items-center gap-3 group h-full justify-end">
                           <div className="w-full relative flex flex-col justify-end" style={{ height: '80%' }}>
                              <div 
                                className="w-full rounded-t-sm bg-slate-900 transition-all group-hover:bg-indigo-600 relative" 
                                style={{ height: `${Math.max(5, height)}%` }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10 pointer-events-none shadow-lg">
                                {d.count} Leads
                              </div>
                           </div>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter transform -rotate-45 lg:rotate-0 whitespace-nowrap">
                             {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                           </span>
                        </div>
                      );
                    })
                 )}
               </div>
            </div>

        {/* Efficiency Leaderboard */}
        <div className="bg-slate-900 rounded-xl p-8 flex flex-col justify-between">
           <div>
              <h3 className="text-[14px] font-bold text-white uppercase tracking-widest mb-8">Performance Mix</h3>
              <div className="space-y-6">
                 {topClients.slice(0, 5).map((c, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded bg-white/10 dark:bg-slate-900/10 flex items-center justify-center text-[11px] text-white font-bold">{i+1}</div>
                         <div>
                            <p className="text-[13px] font-bold text-white truncate max-w-[120px]">{c.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{c.industry || 'Lead Gen'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[14px] font-black text-indigo-400">{c.conversionRate}%</p>
                         <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-tighter">Conv. Efficiency</p>
                      </div>
                   </div>
                 ))}
                 {topClients.length === 0 && <p className="text-[12px] text-slate-500 dark:text-slate-400 italic py-4">Synchronizing ranking data...</p>}
              </div>
           </div>
           <button className="w-full mt-8 py-3 bg-white/5 dark:bg-slate-900/5 hover:bg-white/10 dark:hover:bg-slate-800/10 text-white text-[12px] font-bold rounded-lg transition-all border border-white/10">Full Audit Logic</button>
        </div>
      </div>

      {/* Intelligent Lead Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
         <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50">Lead Intelligence Stream</h3>
            <div className="flex gap-4">
               <button className="text-[11px] font-bold text-slate-900 dark:text-slate-50 uppercase tracking-widest underline underline-offset-4">Live Updates</button>
               <button className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">History</button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                     <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Subscriber</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact Identity</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Status</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Capture Point</th>
                     <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                  {recentLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                       <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-50">{lead.clientName}</td>
                       <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 dark:text-slate-50">{lead.name || 'Anonymous'}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{lead.email || lead.phone || 'No Contact Data'}</p>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                            lead.status === 'converted' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                             {lead.status}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{lead.source || 'Direct Signal'}</span>
                       </td>
                       <td className="px-6 py-4 text-right text-slate-400 text-[12px]">{new Date(lead.receivedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentLeads.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic font-medium tracking-tight">Lead feed idle. Sensors recalibrating.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
          </div>
        </>
      )}
    </div>
  );
}

