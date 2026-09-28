"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, Mail, Phone, Clock, 
  Layout, CheckSquare, DollarSign, Activity,
  ChevronLeft, ChevronRight, Settings, ExternalLink, Calendar,
  MoreHorizontal, Plus, Filter, Search,
  ArrowRight, ShieldCheck, Briefcase
} from "lucide-react";
import UserNavbar from "../../Header";
import toast from "react-hot-toast";
import { authFetch, authJson } from "@/lib/apiClient";

export default function ClientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activity, setActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  // Task Form
  const [taskForm, setTaskForm] = useState({ title: "", priority: "Medium", status: "To Do" });
  // Service Form
  const [serviceForm, setServiceForm] = useState({ name: "", category: "SEO", type: "Monthly", customCategory: "" });

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      const [clientRes, servicesRes, tasksRes, billingRes, activityRes] = await Promise.all([
        authJson("/api/clients"),
        authJson(`/api/clients/services?clientId=${id}`),
        authJson(`/api/clients/tasks?clientId=${id}`),
        authJson(`/api/clients/billing?clientId=${id}`),
        authJson(`/api/clients/activity?clientId=${id}`),
      ]);

      if (clientRes.success) {
        setClient(clientRes.data.find(c => c._id === id));
      }
      if (servicesRes.success) setServices(servicesRes.data);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (billingRes.success) setInvoices(billingRes.data);
      if (activityRes.success) setActivity(activityRes.data);

    } catch (error) {
      toast.error("Error synchronizing client profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/clients/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          clientId: id,
          team: "System",
        })
      });
      if (res.ok) {
        toast.success("Work item added to pipeline");
        setIsTaskModalOpen(false);
        setTaskForm({ title: "", priority: "Medium", status: "To Do" });
        fetchClientData();
      }
    } catch (error) {
      toast.error("Pipeline update failed");
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...serviceForm,
        clientId: id,
        category: serviceForm.category === "Other" ? serviceForm.customCategory : serviceForm.category
      };
      const res = await authFetch("/api/clients/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success("Service provisioned");
        setIsServiceModalOpen(false);
        setServiceForm({ name: "", category: "SEO", type: "Monthly" });
        fetchClientData();
      }
    } catch (error) {
      toast.error("Service provisioning failed");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-black"><Activity className="animate-spin text-indigo-600" /></div>;
  if (!client) return <div className="text-center py-20">Client not found</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layout },
    { id: "services", label: "Services", icon: Briefcase },
    { id: "tasks", label: "Kanban Board", icon: CheckSquare },
    { id: "billing", label: "Billing", icon: DollarSign },
    { id: "activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] transition-colors pb-20 font-sans">
      <UserNavbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 space-y-8">
        
        {/* Breadcrumbs & Actions */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium">
            <ChevronLeft className="w-5 h-5" /> Back to Clients
          </button>
          <div className="flex gap-3">
            <button className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>

        {/* Client Identity Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 md:p-12 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-serif font-bold shadow-xl">
              {client.companyName.charAt(0)}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white">{client.companyName}</h2>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-100 dark:border-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active Partner
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {client.clientId}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-8">
                <InfoItem icon={Building2} label="Industry" value={client.industry || "Agency Strategy"} />
                <InfoItem icon={Mail} label="Primary Email" value={client.primaryContact.email} />
                <InfoItem icon={Clock} label="Timezone" value={client.timezone} />
                <InfoItem icon={Calendar} label="Partner Since" value={new Date(client.startDate).toLocaleDateString()} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 gap-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                activeTab === tab.id 
                  ? "text-indigo-600" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <div className="pt-4">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-10">
                <section className="space-y-4">
                   <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Active Retention Services</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {services.length > 0 ? services.map(s => (
                        <ServiceSmallCard key={s._id} name={s.name} status={s.status} progress={s.status === 'Delivered' ? 100 : 45} />
                      )) : (
                        <div className="col-span-2 py-10 bg-slate-50 dark:bg-slate-900/50 rounded-3xl text-center text-slate-400 font-medium border-2 border-dashed border-slate-100 dark:border-slate-800">
                           No active services mapped yet.
                        </div>
                      )}
                   </div>
                </section>
                
                <section className="space-y-4">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Recent Work / Activity</h3>
                      <button onClick={() => setActiveTab("activity")} className="text-indigo-600 text-xs font-bold flex items-center gap-1 group">
                        View Full Log <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </button>
                   </div>
                   <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-6">
                      {activity.slice(0, 5).map((log, idx) => (
                        <TimelineItem 
                          key={log._id || idx} 
                          type={log.type} 
                          text={log.action} 
                          time={new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          user={log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "System"} 
                        />
                      ))}
                      {activity.length === 0 && <p className="text-center text-slate-400 py-4">No activity captured yet.</p>}
                   </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-6 shadow-2xl">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contractual Depth</h4>
                   <div className="space-y-1">
                      <p className="text-4xl font-serif font-bold">${client.contractValue?.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 font-medium">Billed {client.billingCycle}</p>
                   </div>
                   <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Churn Risk</span>
                         <span className="text-emerald-500 font-bold">Very Low</span>
                      </div>
                      <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Account Health</span>
                         <span className="text-indigo-400 font-bold">98%</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => setActiveTab("billing")}
                     className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition shadow-xl"
                   >
                      Manage Retention
                   </button>
                </div>

                <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Context</h4>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium">
                     {client.internalNotes || "No internal context provided for this client. High priority account focused on retention and upsell."}
                   </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                           <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {invoices.length > 0 ? invoices.map(inv => (
                          <tr key={inv._id}>
                             <td className="px-8 py-6 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                             <td className="px-8 py-6 text-sm text-slate-500">{inv.period?.start ? new Date(inv.period.start).toLocaleDateString() : 'N/A'}</td>
                             <td className="px-8 py-6 font-bold text-indigo-600">${inv.amount?.toLocaleString()}</td>
                             <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                   {inv.status}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-sm text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          </tr>
                        )) : (
                          <tr>
                             <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium">No billing records found for this partner.</td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
               <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-10 space-y-10">
                  {activity.length > 0 ? activity.map((log, idx) => (
                    <div key={log._id || idx} className="flex gap-8 relative group">
                       <div className="w-px bg-slate-100 dark:bg-slate-800 absolute left-[15px] top-8 bottom-0"></div>
                       <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Activity className="w-4 h-4" />
                       </div>
                       <div className="flex-1 pb-10">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{log.action}</p>
                                <p className="text-sm text-slate-400 mt-1 uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-800 w-max px-2 py-0.5 rounded text-[10px]">{log.type}</p>
                             </div>
                             <span className="text-xs font-medium text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          {log.details && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                               <pre className="text-xs text-slate-500 font-mono italic">{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-4">
                             <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[8px] font-bold text-indigo-600">
                                {log.userId?.firstName?.charAt(0) || "S"}
                             </div>
                             <span className="text-xs text-slate-500">Initiated by {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "System Automation"}</span>
                          </div>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center text-slate-400">Activity stream is empty.</div>
                  )}
               </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Contracted Deliverables</h3>
                   <button 
                     onClick={() => setIsServiceModalOpen(true)}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/10"
                   >
                    <Plus className="w-4 h-4" /> Provision Service
                  </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {services.length > 0 ? services.map(service => (
                    <ServiceDetailCard 
                      key={service._id}
                      name={service.name} 
                      category={service.category} 
                      sla={`${service.sla?.turnaroundDays || 3} Day SLA`}
                      deliverables={service.deliverables || []}
                    />
                  )) : (
                    <div className="col-span-2 py-20 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                       <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                       <p className="font-bold">No services currently active for this client.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Execution Pipeline</h3>
                <div className="flex gap-4">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input 
                       placeholder="Filter tasks..." 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500/20 text-slate-900 dark:text-white" 
                     />
                   </div>
                   <button 
                     onClick={() => setIsTaskModalOpen(true)}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 transition"
                   >
                     Add Work Item
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
                <KanbanColumn title="To Do" count={filteredTasks.filter(t => t.status === 'To Do').length} tasks={filteredTasks.filter(t => t.status === 'To Do')} />
                <KanbanColumn title="In Progress" count={filteredTasks.filter(t => t.status === 'In Progress').length} tasks={filteredTasks.filter(t => t.status === 'In Progress')} />
                <KanbanColumn title="Review" count={filteredTasks.filter(t => t.status === 'Review').length} tasks={filteredTasks.filter(t => t.status === 'Review')} />
                <KanbanColumn title="Completed" count={filteredTasks.filter(t => t.status === 'Completed').length} tasks={filteredTasks.filter(t => t.status === 'Completed')} />
              </div>
              {tasks.length === 0 && (
                <div className="py-20 text-center text-slate-400">No tasks generated for this partner yet.</div>
              )}
            </div>
          )}
        </div>
        
        {/* Modals */}
        {isTaskModalOpen && (
          <Modal title="Create Work Item" onClose={() => setIsTaskModalOpen(false)}>
            <form onSubmit={handleAddTask} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Task Title</label>
                  <input 
                    required 
                    value={taskForm.title} 
                    onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-transparent focus:border-indigo-500/30 transition shadow-inner font-medium text-slate-900 dark:text-white" 
                    placeholder="e.g. Weekly SEO Audit"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Priority</label>
                     <select 
                       value={taskForm.priority}
                       onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                       className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                     >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Urgent</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Initial Status</label>
                     <select 
                       value={taskForm.status}
                       onChange={e => setTaskForm({...taskForm, status: e.target.value})}
                       className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                     >
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Review</option>
                     </select>
                  </div>
               </div>
               <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition">Deploy Work Item</button>
            </form>
          </Modal>
        )}

        {isServiceModalOpen && (
          <Modal title="Provision New Service" onClose={() => setIsServiceModalOpen(false)}>
            <form onSubmit={handleAddService} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Name</label>
                  <input 
                    required 
                    value={serviceForm.name} 
                    onChange={e => setServiceForm({...serviceForm, name: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-transparent focus:border-indigo-500/30 transition shadow-inner font-medium text-slate-900 dark:text-white" 
                    placeholder="e.g. Premium Ads Pack"
                  />
               </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                        <select 
                          value={serviceForm.category}
                          onChange={e => setServiceForm({...serviceForm, category: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                        >
                           <option>SEO</option>
                           <option>Ads</option>
                           <option>Web</option>
                           <option>Design</option>
                           <option>Social</option>
                           <option>Email</option>
                           <option>Content</option>
                           <option>Other</option>
                        </select>
                     </div>
                     {serviceForm.category === "Other" && (
                        <input 
                           required 
                           value={serviceForm.customCategory} 
                           onChange={e => setServiceForm({...serviceForm, customCategory: e.target.value})}
                           className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-transparent focus:border-indigo-500/30 transition shadow-inner font-medium text-slate-900 dark:text-white" 
                           placeholder="Enter custom category"
                        />
                     )}
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</label>
                     <select 
                       value={serviceForm.type}
                       onChange={e => setServiceForm({...serviceForm, type: e.target.value})}
                       className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white"
                     >
                        <option>Monthly</option>
                        <option>One-time</option>
                        <option>Hourly</option>
                     </select>
                  </div>
               </div>
               <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition">Provision Now</button>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{value}</p>
    </div>
  );
}

function ServiceSmallCard({ name, status, progress }) {
  return (
     <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl hover:border-indigo-500/30 transition-all hover:shadow-lg group">
        <div className="flex justify-between items-start mb-4">
           <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{name}</h4>
           <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
             <Briefcase className="w-4 h-4 text-slate-400" />
           </div>
        </div>
        <div className="flex justify-between text-xs text-slate-400 font-medium mb-2">
           <span>Delivery Progress</span>
           <span className="text-indigo-600 font-black">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
           <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
     </div>
  );
}

function TimelineItem({ type, text, time, user }) {
  return (
    <div className="flex gap-4 group cursor-pointer">
       <div className="w-1.5 bg-slate-100 dark:bg-white/5 rounded-full relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-indigo-600 transition-colors"></div>
       </div>
       <div className="flex-1 pb-6">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{text}</p>
          <div className="flex items-center gap-3 mt-1">
             <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{type}</span>
             <span className="text-[10px] text-slate-400 font-medium">{time} by <span className="text-slate-600 dark:text-slate-300 font-bold">{user}</span></span>
          </div>
       </div>
    </div>
  );
}

function ServiceDetailCard({ name, category, sla, deliverables }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[32px] shadow-sm hover:shadow-md transition space-y-6">
       <div className="flex justify-between items-start">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{category}</span>
             </div>
             <h4 className="text-xl font-serif font-bold text-slate-900 dark:text-white">{name}</h4>
          </div>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-lg text-[10px] font-bold">{sla}</span>
       </div>

       <div className="space-y-3">
          {deliverables.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
               <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.status === 'Approved' ? 'bg-emerald-500' : item.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
               </div>
               <span className={`text-[9px] font-black uppercase tracking-tighter ${item.status === 'Approved' ? 'text-emerald-500' : 'text-slate-400'}`}>
                 {item.status}
               </span>
            </div>
          ))}
       </div>
       <button className="w-full py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-500/30 transition">
          View Master Checklist
       </button>
    </div>
  );
}

function KanbanColumn({ title, count, tasks }) {
  return (
    <div className="min-w-[280px] bg-slate-50/50 dark:bg-slate-900/40 rounded-[32px] p-6 space-y-4 h-full">
       <div className="flex justify-between items-center px-2">
          <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h5>
          <span className="w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-100 dark:border-slate-700">{count}</span>
       </div>
       
       <div className="space-y-4">
          {tasks.map((task, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3 cursor-grab active:cursor-grabbing hover:border-indigo-500/20 transition group">
                <div className="flex justify-between">
                   <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${task.priority === 'Urgent' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500 dark:text-slate-400 dark:bg-slate-800'}`}>
                     {task.priority}
                   </span>
                   <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <MoreHorizontal className="w-4 h-4 text-slate-400" />
                   </button>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{task.title}</p>
                <div className="flex items-center gap-2 pt-2">
                   <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                     {task.team?.charAt(0) || "S"}
                   </div>
                   <span className="text-[10px] font-medium text-slate-400">{task.team || "Unassigned"}</span>
                </div>
            </div>
          ))}
       </div>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
      >
         <div className="p-10 space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{title}</h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition">
                  <MoreHorizontal className="w-6 h-6 text-slate-400 rotate-45" />
               </button>
            </div>
            {children}
         </div>
      </div>
    </div>
  );
}
