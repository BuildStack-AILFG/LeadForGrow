'use client';
import { useState, useEffect, use } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  TrendingUp, 
  FileText, 
  Settings,
  ArrowLeft,
  ChevronRight,
  User,
  Activity,
  CreditCard,
  AlertCircle,
  Plus,
  Loader2,
  Users,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ClientDetailPage({ params }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const router = useRouter();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [team, setTeam] = useState([]);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  useEffect(() => {
    fetchClientData();
    fetchTeam();
  }, [clientId]);

  const fetchTeam = async () => {
    try {
      const res = await authFetch('/api/agency/team');
      const data = await res.json();
      if (data.success) setTeam(data.team);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const updateAssignment = async (memberId) => {
    setUpdatingAssignment(true);
    try {
      const isAssigned = client.assignedTeam?.some(m => (m._id || m) === memberId);
      const newTeam = isAssigned
        ? client.assignedTeam.filter(m => (m._id || m) !== memberId)
        : [...(client.assignedTeam || []), memberId];
      
      const res = await authFetch(`/api/agency/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedTeam: newTeam.map(m => m._id || m) })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isAssigned ? 'Member unassigned' : 'Member assigned');
        fetchClientData();
      }
    } catch (err) {
      toast.error('Failed to update assignment');
    } finally {
      setUpdatingAssignment(false);
    }
  };

  const updateClientMode = async (mode) => {
    try {
      const res = await authFetch(`/api/agency/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          leadAssignment: { ...client.leadAssignment, mode } 
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Mode changed to ${mode}`);
        fetchClientData();
      }
    } catch (err) {
      toast.error('Failed to update assignment mode');
    }
  };

  const fetchClientData = async () => {
    try {
      const clientRes = await authFetch(`/api/agency/clients/${clientId}`);
      const clientData = await clientRes.json();
      
      if (clientData.success) {
        setClient(clientData.client);
        const [leadsRes, invRes] = await Promise.all([
           authFetch(`/api/agency/leads?clientId=${clientId}`),
           authFetch(`/api/agency/invoices?clientId=${clientId}`)
        ]);
        const leadsData = await leadsRes.json();
        const invData = await invRes.json();
        if (leadsData.success) setLeads(leadsData.leads);
        if (invData.success) setInvoices(invData.invoices);
      } else {
        toast.error(clientData.error || 'Failed to fetch client');
        router.push('/agency/clients');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const exportLeads = () => {
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Date'];
    const rows = leads.map(l => [
      l.name || 'Anonymous',
      l.email || '',
      l.phone || '',
      l.source || 'Direct',
      l.status || 'New',
      new Date(l.receivedAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `leads_${client.clientName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Leads exported successfully');
  };

  const exportInvoices = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    const headers = ['Invoice #', 'Amount', 'Status', 'Date'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      i.amount,
      i.status,
      new Date(i.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `invoices_${client.clientName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Invoices exported successfully');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
    </div>
  );

  if (!client) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 pb-20">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <Link href="/agency/clients" className="hover:text-slate-900 dark:hover:text-slate-50 transition-colors">Clients</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 dark:text-slate-50">{client.clientName}</span>
          </div>
          <h1 className="text-[20px] font-semibold text-slate-900 dark:text-slate-50">{client.clientName}</h1>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">Download Report</button>
           <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[13px] font-bold active:scale-95">Actions</button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800">
        {['overview', 'team', 'leads', 'invoices', 'performance'].map((tab) => (
          <button
            key={tab}
            data-tab={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[13px] font-medium capitalize transition-all relative ${
              activeTab === tab ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4 h-[140px]">
                     <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current Status</h3>
                     <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${client.healthScore?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-[15px] font-medium text-slate-900 dark:text-slate-50 capitalize">{client.healthScore?.status || 'Active'}</span>
                     </div>
                     <p className="text-[13px] text-slate-500 dark:text-slate-400">Last lead captured {client.healthScore?.lastLeadAt ? new Date(client.healthScore.lastLeadAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-xl space-y-4 h-[140px]">
                     <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Retainer Details</h3>
                     <h4 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">₹{client.billing?.retainerAmount?.toLocaleString() || 0}</h4>
                     <p className="text-[13px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{client.billing?.billingCycle || 'Manual'} Cycle</p>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50">Technical Configuration</h3>
                     <Settings className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="p-6 space-y-6">
                     <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Submission API</p>
                        <code className="block p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[12px] text-slate-600 dark:text-slate-300 break-all font-mono">https://www.leadforgrow.com/api/forms/submit?clientId={clientId}</code>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl">
                        <div>
                           <p className="text-[13px] font-bold text-rose-900 dark:text-rose-200">Account Control</p>
                           <p className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-black mt-1 tracking-tighter italic">Warning: Suspension will disable all client forms</p>
                        </div>
                        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 text-[12px] font-bold rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">Suspend Account</button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                  <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50 mb-6 flex items-center justify-between">
                     Recent Activity
                     <Activity className="w-4 h-4 text-slate-400" />
                  </h3>
                  <div className="space-y-4">
                     <p className="text-[13px] text-slate-500 dark:text-slate-400 italic">No recent activity logs found.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="max-w-3xl space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-50">Lead Assignment Strategy</h3>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Configure how new leads are distributed among your team.</p>
               </div>
               <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button 
                        onClick={() => updateClientMode('manual')}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${client.leadAssignment?.mode === 'manual' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                     >
                        <div className="flex items-center justify-between mb-2">
                           <span className={`text-[13px] font-bold ${client.leadAssignment?.mode === 'manual' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-50'}`}>Manual Assignment</span>
                           {client.leadAssignment?.mode === 'manual' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Leads are assigned to the primary contact or must be manually distributed.</p>
                     </button>
                     <button 
                        onClick={() => updateClientMode('round-robin')}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${client.leadAssignment?.mode === 'round-robin' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                     >
                        <div className="flex items-center justify-between mb-2">
                           <span className={`text-[13px] font-bold ${client.leadAssignment?.mode === 'round-robin' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-50'}`}>Round Robin</span>
                           {client.leadAssignment?.mode === 'round-robin' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Leads are automatically rotated through all assigned team members below.</p>
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900 dark:text-slate-50">Staff Assignment</h3>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Select which staff members can access and manage this client.</p>
                  </div>
                  <Users className="w-5 h-5 text-slate-400" />
               </div>
               <div className="divide-y divide-slate-50">
                  {team.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic">No agency staff found. Go to Team page to add members.</div>
                  ) : team.map(member => {
                      const isAssigned = client.assignedTeam?.some(m => (m._id || m) === member._id);
                      return (
                         <div key={member._id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-black ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                  {member.firstName?.[0] || 'U'}
                               </div>
                               <div>
                                  <p className="text-[14px] font-bold text-slate-900 dark:text-slate-50">{member.firstName} {member.lastName}</p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.email}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => updateAssignment(member._id)}
                              className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                                isAssigned 
                                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                               {isAssigned ? 'Remove' : 'Assign'}
                            </button>
                         </div>
                      );
                  })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-[14px] font-medium text-slate-900 dark:text-slate-50">Lead Inventory</h2>
               <button onClick={exportLeads} className="text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 underline">Export CSV</button>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                     <tr>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Source</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                     {leads.map(lead => (
                        <tr key={lead._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                           <td className="px-6 py-4">
                              <p className="font-bold text-slate-900 dark:text-slate-50 leading-tight">{lead.name || 'Anonymous'}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{lead.email || lead.phone}</p>
                           </td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{lead.source || 'Direct'}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`text-[11px] font-bold uppercase ${lead.status === 'converted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{lead.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right text-slate-400 text-[12px]">{new Date(lead.receivedAt).toLocaleDateString()}</td>
                        </tr>
                     ))}
                     {leads.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic font-medium tracking-tight">Lead queue empty.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-[14px] font-medium text-slate-900 dark:text-slate-50 uppercase tracking-wider">Financial Ledger</h2>
               <div className="flex items-center gap-4">
                  <button className="text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 underline" onClick={exportInvoices}>Export History</button>
                  <button className="px-4 py-1.5 bg-slate-900 text-white text-[12px] font-bold rounded-lg active:scale-95">Generate Manual Invoice</button>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                     <tr>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Invoice #</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Due Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
                     {invoices.map(inv => (
                        <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-50">{inv.invoiceNumber}</td>
                           <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-50">₹{inv.amount.toLocaleString()}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                                 inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                              }`}>{inv.status}</span>
                           </td>
                           <td className="px-6 py-4 text-right text-slate-400 text-[12px]">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                     ))}
                     {invoices.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic font-medium tracking-tight">No billing history found.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
           <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl h-[120px] flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Conversion Rate</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">14.2%</h3>
                       <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">↑ 2.1%</span>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl h-[120px] flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Leads</p>
                    <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">{leads.length}</h3>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl h-[120px] flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Avg. CPL</p>
                    <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">₹420</h3>
                 </div>
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl h-[120px] flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Response Time</p>
                    <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">4.2m</h3>
                 </div>
              </div>

              {/* Advanced Attribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                 <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50">Source Distribution</h3>
                 </div>
                 <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                       <div className="w-48 h-48 rounded-full border-[16px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                          <div className="absolute inset-0 border-[16px] border-indigo-600 rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)' }}></div>
                          <span className="text-[18px] font-bold text-slate-900 dark:text-slate-50">62%</span>
                       </div>
                       <div className="flex-1 space-y-4 w-full">
                          {[
                             { label: 'Form Ingestion', val: '62%', color: 'bg-indigo-600' },
                             { label: 'WA Business', val: '24%', color: 'bg-emerald-500' },
                             { label: 'Ad Webhooks', val: '14%', color: 'bg-rose-500' }
                          ].map((s, i) => (
                             <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                   <span className="text-[13px] text-slate-600 dark:text-slate-300">{s.label}</span>
                                </div>
                                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-50">{s.val}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
