"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Globe, 
  Briefcase, 
  Layout, 
  Edit2, 
  Share2, 
  Send, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import UserNavbar from '../../user/Header';
import SuccessModal from '../../components/website/SuccessModal';
import PublishSettingsModal from '../../components/website/PublishSettingsModal';
import { authFetch } from '@/lib/apiClient';

function DashboardContent() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successModal, setSuccessModal] = useState({ 
    isOpen: false, 
    websiteUrl: '', 
    websiteName: '' 
  });
  const [settingsModal, setSettingsModal] = useState({
    isOpen: false,
    projectId: null,
    websiteName: ''
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/websites');
      const result = await res.json();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Fetch projects error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handlePublishClick = (project) => {
    setSettingsModal({
      isOpen: true,
      projectId: project._id,
      websiteName: project.websiteName
    });
  };

  const handlePublishConfirm = async (slug) => {
    const projectId = settingsModal.projectId;
    setSettingsModal({ ...settingsModal, isOpen: false });
    
    try {
      const res = await authFetch(`/api/websites/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', slug })
      });
      const result = await res.json();
      if (result.success) {
        const project = projects.find(p => p._id === projectId);
        const url = window.location.origin + `/s/${slug}`;
        
        setSuccessModal({
          isOpen: true,
          websiteUrl: url,
          websiteName: project.websiteName
        });
        
        fetchProjects();
      } else {
        toast.error("Failed to publish: " + result.error);
      }
    } catch (error) {
      toast.error("Error publishing website.");
    }
  };

  const handlePublish = async (projectId) => {
    // Keep this for backward compatibility or direct calls if needed, 
    // but we'll use handlePublishClick for UI
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6 lg:px-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-slate-50 rounded-full blur-[150px] -z-10"></div>
      
      <div className="max-w-7xl mx-auto w-full">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
            <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-indigo-600" /> Your Projects
                </h1>
                <p className="text-slate-500 font-medium">Manage and launch your recently created websites.</p>
            </div>
            <div className="flex items-center gap-4">
                <button 
                  onClick={fetchProjects}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all border border-slate-100"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => router.push('/website-funnel/templates')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Create New Website
                </button>
            </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Layout className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">No projects yet</h3>
             <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start by selecting a template and creating your first high-converting website funnel.</p>
             <button 
                onClick={() => router.push('/website-funnel/templates')}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                Choose a Template
              </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-[1.8fr_1fr_1fr_1.2fr_1fr_auto] gap-8 px-12 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-2">
                <span>Project Name</span>
                <span>Brand</span>
                <span>Goal</span>
                <span>Template</span>
                <span>Status</span>
                <span className="text-right pr-4">Actions</span>
            </div>

            {projects.map((project) => (
                <div key={project._id} className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.06)] hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.12)] transition-all duration-700 group overflow-hidden">
                    <div className="p-6 lg:p-10 lg:pl-12 lg:grid lg:grid-cols-[1.8fr_1fr_1fr_1.2fr_1fr_auto] lg:items-center gap-8">
                        
                        {/* Project Name Cell */}
                        <div className="flex items-center gap-6 mb-8 lg:mb-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm border border-white">
                                <Globe className="w-7 h-7 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{project.websiteName}</h3>
                                <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-widest opacity-80">{project.brandName}</p>
                            </div>
                        </div>

                        {/* Brand Cell */}
                        <div className="mb-6 lg:mb-0">
                            <span className="lg:hidden text-[9px] font-bold text-slate-300 uppercase tracking-widest block mb-2">Brand</span>
                            <div className="flex items-center gap-2 text-slate-600">
                                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <span className="text-sm font-bold">{project.brandName}</span>
                            </div>
                        </div>

                        {/* Goal Cell */}
                        <div className="mb-4 lg:mb-0">
                            <span className="lg:hidden text-[9px] font-bold text-slate-300 uppercase tracking-widest block mb-1">Goal</span>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                {project.goal}
                            </span>
                        </div>

                        {/* Template Cell */}
                        <div className="mb-4 lg:mb-0">
                            <span className="lg:hidden text-[9px] font-bold text-slate-300 uppercase tracking-widest block mb-1">Template</span>
                            <div className="flex items-center gap-2">
                                <Layout className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-sm font-bold text-slate-600 truncate max-w-[120px] uppercase tracking-tight">
                                    {project.templateId?.replace(/-/g, ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Status Cell */}
                        <div className="mb-8 lg:mb-0">
                            <span className="lg:hidden text-[9px] font-bold text-slate-300 uppercase tracking-widest block mb-1">Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${project.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                <span className={`text-sm font-bold uppercase tracking-widest ${project.status === 'published' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {project.status || 'Draft'}
                                </span>
                            </div>
                        </div>

                        {/* Action Cell */}
                        <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 text-center lg:text-left">
                            <button 
                                onClick={() => router.push(`/preview/${project.templateId}?id=${project._id}`)}
                                className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                            >
                                <Globe className="w-3.5 h-3.5" /> Open
                            </button>
                            <button 
                                onClick={() => router.push(`/editor/${project.templateId}?id=${project._id}`)}
                                className="flex-1 lg:flex-none px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-95"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin + `/preview/${project.templateId}?id=${project._id}`);
                                    toast.success('Link copied to clipboard!');
                                }}
                                className="flex-1 lg:flex-none px-4 py-2.5 bg-white text-slate-400 border border-slate-100 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:text-slate-900 hover:border-slate-300 transition-all active:scale-95"
                            >
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                            <button 
                                onClick={() => handlePublishClick(project)}
                                className="flex-1 lg:flex-none px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                            >
                                <Send className="w-3.5 h-3.5" /> Publish
                            </button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        )}
      </div>

      <SuccessModal 
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        websiteUrl={successModal.websiteUrl}
        websiteName={successModal.websiteName}
      />

      <PublishSettingsModal 
        isOpen={settingsModal.isOpen}
        onClose={() => setSettingsModal({ ...settingsModal, isOpen: false })}
        onConfirm={handlePublishConfirm}
        initialWebsiteName={settingsModal.websiteName}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <UserNavbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </>
  );
}
