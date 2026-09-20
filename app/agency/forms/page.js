'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Copy, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink,
  Code,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Globe,
  Building2,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch, getAuthToken } from '@/lib/apiClient';

export default function AgencyFormsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [clients, setClients] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    if (!getAuthToken()) {
      toast.error('Please login to continue');
      router.push('/user/login');
      return;
    }
    try {
      await Promise.all([fetchForms(), fetchClients()]);
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    const res = await authFetch('/api/agency/clients');
    const data = await res.json();
    if (data.success) setClients(data.clients);
  };

  const fetchForms = async () => {
    const res = await authFetch('/api/agency/forms');
    const data = await res.json();
    if (data.success) setForms(data.data);
  };

  const createForm = async (formData) => {
    try {
      const res = await authFetch('/api/agency/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Form deployed');
        setForms([data.data, ...forms]);
        setShowCreateModal(false);
      }
    } catch (error) {
      toast.error('Deployment failed');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Form Ingestion Hub</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Manage {forms.length} active lead capture endpoints</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[13px] font-bold active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Deploy New Form
        </button>
      </div>

      {/* KPI Band */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Infrastructure Nodes', val: forms.length, icon: Code },
          { label: 'Capture Velocity', val: forms.reduce((sum, f) => sum + f.submissionCount, 0), icon: TrendingUp },
          { label: 'Client Reach', val: new Set(forms.filter(f => f.clientId).map(f => f.clientId._id || f.clientId)).size, icon: Building2 }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex items-center justify-between">
             <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50 mt-1">{kpi.val}</h3>
             </div>
             <kpi.icon className="w-5 h-5 text-slate-200" />
          </div>
        ))}
      </div>

     
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
               <tr>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Configuration Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Assignment</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Capture Count</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
               {forms.map((form) => (
                  <tr key={form._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                     <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-50">{form.name}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{form.description || 'No description provided'}</p>
                     </td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold uppercase tracking-tight">
                           {form.clientId?.clientName || 'Unassigned'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-900 dark:text-slate-50">{form.submissionCount}</span>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                           form.active ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                           {form.active ? 'Operational' : 'Idle'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => { setSelectedForm(form); setShowEmbedModal(true); }}
                             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                             title="Get Embed Code"
                           >
                              <Code className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => {
                               const url = `${window.location.origin}/api/forms/submit?token=${form.token}`;
                               navigator.clipboard.writeText(url);
                               toast.success('URL Copied');
                             }}
                             className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                             title="Copy Link"
                           >
                              <Copy className="w-4 h-4" />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
               {forms.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No ingestion nodes detected. Deploy your first form terminal.</td></tr>
               )}
            </tbody>
         </table>
      </div>

     
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">Node Configuration</h2>
            <form onSubmit={(e) => {
               e.preventDefault();
               createForm({
                 name: e.target.name.value,
                 description: e.target.description.value,
                 clientId: e.target.clientId.value
               });
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Assignment</label>
                <select name="clientId" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[13px]" required>
                   <option value="">Choose Target Client</option>
                   {clients.map(c => <option key={c._id} value={c._id}>{c.clientName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Deployment Name</label>
                <input name="name" type="text" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[13px]" placeholder="e.g. Website Footer Form" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Functional Scope / Desc</label>
                <textarea name="description" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[13px]" placeholder="Internal notes for tracking..." rows="3" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 text-slate-500 dark:text-slate-400 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">Abort</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 text-white text-[13px] font-bold rounded-lg active:scale-95 transition-all">Deploy Node</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embed Modal */}
      {showEmbedModal && selectedForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-slate-50 tracking-tight">Deployment Terminal</h2>
              <button onClick={() => setShowEmbedModal(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="bg-slate-900 rounded-xl p-6 relative group overflow-hidden">
               <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">HTML SNIPPET</div>
               <pre className="text-indigo-300 font-mono text-[12px] whitespace-pre-wrap leading-relaxed">
                  <code>{`<!-- LeadForGrow Widget -->
<div data-lfg-token="${selectedForm.token}"></div>
<script src="${window.location.origin}/lfg-widget.js" async></script>`}</code>
               </pre>
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`<!-- LeadForGrow Widget -->\n<div data-lfg-token="${selectedForm.token}"></div>\n<script src="${window.location.origin}/lfg-widget.js" async></script>`);
                   toast.success('Copied to clipboard');
                 }}
                 className="absolute top-4 right-4 p-2 bg-white/10 dark:bg-slate-900/10 text-white/60 hover:text-white rounded-lg transition-all"
               >
                  <Copy className="w-4 h-4" />
               </button>
            </div>
            <button onClick={() => setShowEmbedModal(false)} className="w-full py-3 bg-slate-900 text-white rounded-lg text-[13px] font-bold">Standardize Entry</button>
          </div>
        </div>
      )}
    </div>
  );
}

