'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Heart, AlertTriangle, XCircle, TrendingUp, Search, Building2, Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    clientName: '',
    industry: '',
    website: '',
    primaryContact: { name: '', email: '', phone: '' },
    assignedTeam: [],
    notes: '',
    billing: {
      retainerAmount: 0,
      currency: 'INR',
      billingCycle: 'manual',
      autoGenerateInvoice: false
    }
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchClients(), fetchTeam()]);
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await authFetch('/api/agency/team');
      const data = await res.json();
      if (data.success) {
        setTeam(data.team);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await authFetch('/api/agency/clients');
      const data = await res.json();
      
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const res = await authFetch('/api/agency/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setClients([data.client, ...clients]);
        setShowModal(false);
        setFormData({
          clientName: '',
          industry: '',
          website: '',
          primaryContact: { name: '', email: '', phone: '' },
          assignedTeam: [],
          notes: '',
          billing: { retainerAmount: 0, currency: 'INR', billingCycle: 'manual', autoGenerateInvoice: false }
        });
      } else {
        setError(data.error || 'Failed to create client');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      const res = await authFetch(`/api/agency/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (data.success) {
        setClients(clients.map(c => 
          c._id === clientId ? data.client : c
        ));
      }
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        client.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesHealth = healthFilter === 'all' || client.healthScore?.status === healthFilter;
    return matchesSearch && matchesStatus && matchesHealth;
  });

  const getHealthDot = (status) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'at-risk': return 'bg-amber-500';
      case 'unhealthy': return 'bg-rose-500';
      default: return 'bg-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900 dark:text-slate-50">Clients</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Operational management of {clients.length} client accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all text-[13px] font-bold active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none"
           >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
           </select>
           <select 
             value={healthFilter}
             onChange={(e) => setHealthFilter(e.target.value)}
             className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[12px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none"
           >
              <option value="all">Any Health</option>
              <option value="healthy">Healthy Pulse</option>
              <option value="at-risk">Needs Attention</option>
              <option value="unhealthy">High Risk</option>
           </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Health</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Leads (30d)</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</th>
              <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px]">
            {filteredClients.map((client) => (
              <tr 
                key={client._id} 
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                onClick={() => window.location.href = `/agency/clients/${client._id}`}
              >
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                         {client.clientName[0]}
                      </div>
                      <div>
                         <p className="font-bold text-slate-900 dark:text-slate-50 leading-tight">{client.clientName}</p>
                         <p className="text-[11px] text-slate-400 font-medium">{client.industry || 'No Industry'}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex justify-center">
                      <div 
                        title={client.healthScore?.status || 'Active'}
                        className={`w-2 h-2 rounded-full ${getHealthDot(client.healthScore?.status)}`} 
                      />
                   </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                      client.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' :
                      client.status === 'paused' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                   }`}>
                      {client.status}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="font-bold text-slate-900 dark:text-slate-50">{client.healthScore?.leadVelocity || 0}</span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-[12px]">
                   {client.healthScore?.lastLeadAt ? new Date(client.healthScore.lastLeadAt).toLocaleDateString() : 'No leads yet'}
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                   <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {client.status === 'active' ? (
                        <button onClick={() => handleStatusChange(client._id, 'paused')} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition-all"><Pause className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => handleStatusChange(client._id, 'active')} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md transition-all"><Play className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleStatusChange(client._id, 'churned')} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">No client accounts found matching filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-50">Add New Client Account</h2>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors">✕</button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl">
                  <p className="text-rose-600 dark:text-rose-400 text-[12px] font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-6">
                 <div className="space-y-4">
                    <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50 uppercase tracking-wider">Company Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client Name *</label>
                          <input 
                            type="text" 
                            required 
                            value={formData.clientName}
                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                       </div>
                       <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Industry</label>
                          <input 
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({...formData, industry: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-[14px] font-medium text-slate-900 dark:text-slate-50 uppercase tracking-wider">Financial Setup</h3>
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monthly Retainer</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">₹</span>
                                <input 
                                  type="number" 
                                  value={formData.billing.retainerAmount}
                                  onChange={(e) => setFormData({...formData, billing: {...formData.billing, retainerAmount: parseFloat(e.target.value)}})}
                                  className="w-full pl-7 pr-4 py-2 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-[13px] focus:outline-none"
                                />
                             </div>
                          </div>
                          <div>
                             <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Billing Cycle</label>
                             <select 
                               value={formData.billing.billingCycle}
                               onChange={(e) => setFormData({...formData, billing: {...formData.billing, billingCycle: e.target.value}})}
                               className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-[13px] font-medium"
                             >
                                <option value="manual">Manual Invoicing</option>
                                <option value="monthly">Monthly Recurring</option>
                             </select>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-[13px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-[13px] font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                       {creating ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
