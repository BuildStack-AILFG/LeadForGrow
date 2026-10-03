'use client';
import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  User, 
  Mail, 
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';

export default function AgencyTeamPage() {
  const [team, setTeam] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'member'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamRes, clientsRes] = await Promise.all([
        authFetch('/api/agency/team'),
        authFetch('/api/agency/clients')
      ]);
      
      const teamData = await teamRes.json();
      const clientsData = await clientsRes.json();
      
      if (teamData.success) setTeam(teamData.team);
      if (clientsData.success) setClients(clientsData.clients);
      
      if (!teamData.success) toast.error(teamData.error || 'Failed to fetch team');
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch('/api/agency/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Team member added successfully');
        setShowAddModal(false);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'member' });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add member');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeam = team.filter(member => 
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.firstName + ' ' + member.lastName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Team Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your agency staff and their access levels.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <UserPlus className="w-5 h-5" />
          Add Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Members</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{team.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Admins</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{team.filter(m => m.role === 'admin' || m.role === 'owner').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Now</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{team.filter(m => m.active).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-black dark:text-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your team...</p>
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">No team members found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              You haven't added any team members yet. Start building your agency team!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignments</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTeam.map((member) => {
                  const assignedClients = clients.filter(c => 
                    c.assignedTeam?.some(id => (id._id || id) === member._id)
                  );

                  return (
                    <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                            {member.firstName?.[0] || member.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-50">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          member.role === 'owner' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          member.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}>
                          {member.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{assignedClients.length} Clients</span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {assignedClients.map(c => c.clientName).join(', ') || 'No clients assigned'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${member.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{member.active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Add Team Member</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">They will receive an invite to join.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateMember} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">First Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-black dark:text-slate-50"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Last Name</label>
                    <input 
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-black dark:text-slate-50"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="email"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-black dark:text-slate-50"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-black dark:text-slate-50"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Role & Access</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-black dark:text-slate-50 appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="member">Team Member (Client Management only)</option>
                    <option value="admin">Admin (Full Access + Settings)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
