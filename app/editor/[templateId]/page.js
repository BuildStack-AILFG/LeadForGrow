"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Share2, 
  Send, 
  ChevronLeft, 
  Eye, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Layout as LayoutIcon,
  Sparkles,
  CheckCircle2,
  X,
  User,
  ShoppingBag,
  Globe,
  Link as LinkIcon,
  Mail,
  Phone,
  MessageCircle,
  Activity,
  Heart
} from 'lucide-react';
import TemplateRenderer from '../../components/templates/TemplateRenderer';
import { defaultContent } from '../../components/templates/content/defaultContent';
import SuccessModal from '../../components/website/SuccessModal';
import PublishSettingsModal from '../../components/website/PublishSettingsModal';

function EditorContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = params.templateId;
  const projectId = searchParams.get('id');
  
  const [content, setContent] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [successModal, setSuccessModal] = useState({ 
    isOpen: false, 
    websiteUrl: '', 
    websiteName: '' 
  });
  const [settingsModal, setSettingsModal] = useState({
    isOpen: false,
    websiteName: ''
  });

  // Initial Load
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        try {
          const res = await fetch(`/api/websites/${projectId}`);
          const result = await res.json();
          if (result.success) {
            const project = result.data;
            // Merge defaults with saved content if empty
            const base = defaultContent[templateId];
            if (Object.keys(project.content || {}).length === 0) {
              const websiteName = project.websiteName;
              const brandName = project.brandName;
              const initial = {
                ...base,
                hero: {
                  ...base.hero,
                  heading: websiteName ? `${websiteName}: ${base.hero.heading}` : base.hero.heading
                },
                footer: {
                  ...base.footer,
                  companyName: brandName || base.footer.companyName
                }
              };
              setContent(initial);
            } else {
              setContent(project.content);
            }
          }
        } catch (error) {
          console.error("Failed to load project:", error);
        }
      } else {
        // Fallback for demo or direct access without ID
        const base = defaultContent[templateId];
        if (base) {
          setContent(base);
        }
      }
    };
    loadProject();
  }, [templateId, projectId]);

  const handleUpdate = (section, key, value) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!projectId) {
      toast.error("No project ID found to save.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/websites/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const result = await res.json();
      if (result.success) {
        setIsSaving(false);
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      } else {
        toast.error("Failed to save: " + result.error);
        setIsSaving(false);
      }
    } catch (error) {
      toast.error("Error saving project.");
      setIsSaving(false);
    }
  };

  const handlePublishClick = () => {
    setSettingsModal({
      isOpen: true,
      websiteName: content.hero?.heading?.split(':')[0] || ''
    });
  };

  const handlePublishConfirm = async (slug) => {
    setSettingsModal({ ...settingsModal, isOpen: false });
    setIsSaving(true);
    try {
      const res = await fetch(`/api/websites/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, status: 'published', slug })
      });
      const result = await res.json();
      if (result.success) {
        setIsSaving(false);
        const url = window.location.origin + `/s/${slug}`;
        setSuccessModal({
          isOpen: true,
          websiteUrl: url,
          websiteName: content.hero?.heading?.split(':')[0] || 'Your Site'
        });
      } else {
        toast.error("Failed to publish: " + result.error);
        setIsSaving(false);
      }
    } catch (error) {
      toast.error("Error publishing project.");
      setIsSaving(false);
    }
  };

  if (!content) return <div className="min-h-screen flex items-center justify-center font-bold">Initializing Editor...</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <header className="h-20 border-b border-slate-100 px-6 flex items-center justify-between bg-white z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Website Editor
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Currently Editing: <span className="text-indigo-600">{templateId.replace(/-/g, ' ')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showStatus && (
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" /> Changes Saved!
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 ${isSaving ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} /> 
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <div className="w-[1px] h-6 bg-slate-100 mx-2"></div>
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all">
             <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button 
            onClick={handlePublishClick}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50"
          >
             <Send className="w-3.5 h-3.5" /> Publish Site
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-96 border-r border-slate-100 bg-white flex flex-col">
          <div className="flex border-b border-slate-100">
            {[
              { id: 'text', icon: Type, label: 'Content' },
              { id: 'navbar', icon: LinkIcon, label: 'Navbar' },
              { id: 'style', icon: Palette, label: 'Theme' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 flex flex-col items-center gap-2 transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            {activeTab === 'text' && (
              <div className="space-y-10">
                {/* Hero Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <LayoutIcon className="w-4 h-4 text-indigo-600" /> Hero Section
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Heading</label>
                      <textarea 
                        value={content.hero?.heading || ''}
                        onChange={(e) => handleUpdate('hero', 'heading', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-sm h-32"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-text</label>
                      <textarea 
                        value={content.hero?.subheading || ''}
                        onChange={(e) => handleUpdate('hero', 'subheading', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all font-medium text-slate-500 text-sm h-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hero Image URL</label>
                      <input 
                        type="text"
                        value={content.hero?.visualUrl || ''}
                        onChange={(e) => handleUpdate('hero', 'visualUrl', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button Text</label>
                        <input 
                          type="text"
                          value={content.hero?.ctaText || ''}
                          onChange={(e) => handleUpdate('hero', 'ctaText', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button Link</label>
                        <input 
                          type="text"
                          value={content.hero?.ctaHref || ''}
                          onChange={(e) => handleUpdate('hero', 'ctaHref', e.target.value)}
                          placeholder="#contact"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Specific Dynamic Lists */}
                {templateId === 'hospital' && content.doctors && (
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-500" /> Doctors Directory
                    </h3>
                    <div className="space-y-4">
                      {content.doctors.items.map((doc, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                          <button 
                            onClick={() => {
                              const newItems = [...content.doctors.items];
                              newItems.splice(i, 1);
                              handleUpdate('doctors', 'items', newItems);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="space-y-3">
                            <input 
                              type="text" value={doc.name} 
                              onChange={(e) => {
                                const newItems = [...content.doctors.items];
                                newItems[i].name = e.target.value;
                                handleUpdate('doctors', 'items', newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" placeholder="Doctor Name"
                            />
                            <input 
                              type="text" value={doc.role} 
                              onChange={(e) => {
                                const newItems = [...content.doctors.items];
                                newItems[i].role = e.target.value;
                                handleUpdate('doctors', 'items', newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Role (e.g. Surgeon)"
                            />
                            <input 
                              type="text" value={doc.image} 
                              onChange={(e) => {
                                const newItems = [...content.doctors.items];
                                newItems[i].image = e.target.value;
                                handleUpdate('doctors', 'items', newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="Image URL"
                            />
                          </div>
                        </div>
                      ))}
                      <button 
                         onClick={() => {
                           const newItems = [...content.doctors.items, { name: "New Doctor", role: "Specialist", image: "" }];
                           handleUpdate('doctors', 'items', newItems);
                         }}
                         className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-bold uppercase hover:border-sky-500 hover:text-sky-500 transition-all"
                      >
                        + Add Doctor
                      </button>
                    </div>
                  </div>
                )}

                {templateId === 'ecommerce' && content.products && (
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <ShoppingBag className="w-4 h-4 text-emerald-500" /> Products Catalog
                    </h3>
                    <div className="space-y-4">
                      {content.products.items.map((prod, i) => (
                        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                          <button 
                            onClick={() => {
                              const newItems = [...content.products.items];
                              newItems.splice(i, 1);
                              handleUpdate('products', 'items', newItems);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                               <input 
                                 type="text" value={prod.name} 
                                 onChange={(e) => {
                                   const newItems = [...content.products.items];
                                   newItems[i].name = e.target.value;
                                   handleUpdate('products', 'items', newItems);
                                 }}
                                 className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" placeholder="Product Name"
                               />
                               <input 
                                 type="text" value={prod.price} 
                                 onChange={(e) => {
                                   const newItems = [...content.products.items];
                                   newItems[i].price = e.target.value;
                                   handleUpdate('products', 'items', newItems);
                                 }}
                                 className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Price"
                               />
                            </div>
                            <input 
                              type="text" value={prod.image} 
                              onChange={(e) => {
                                const newItems = [...content.products.items];
                                newItems[i].image = e.target.value;
                                handleUpdate('products', 'items', newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px]" placeholder="Image URL"
                            />
                            <textarea 
                              value={prod.description} 
                              onChange={(e) => {
                                const newItems = [...content.products.items];
                                newItems[i].description = e.target.value;
                                handleUpdate('products', 'items', newItems);
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] h-16" placeholder="Description"
                            />
                          </div>
                        </div>
                      ))}
                      <button 
                         onClick={() => {
                           const newItems = [...content.products.items, { id: Date.now().toString(), name: "New Item", price: "$0.00", image: "", description: "" }];
                           handleUpdate('products', 'items', newItems);
                         }}
                         className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-[10px] font-bold uppercase hover:border-emerald-500 hover:text-emerald-500 transition-all"
                      >
                        + Add Product
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Sections (Reviews, Trust Badges) */}
                {(content.reviews || content.trustBadges) && (
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-amber-500" /> Social Proof & Trust
                    </h3>
                    <div className="space-y-6">
                       {content.reviews && (
                         <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Section Title</label>
                            <input type="text" value={content.reviews.title} onChange={(e) => handleUpdate('reviews', 'title', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" />
                            <div className="space-y-3 pt-3">
                               {content.reviews.items.map((rev, i) => (
                                 <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                    <input type="text" value={rev.name} onChange={(e) => {
                                      const newItems = [...content.reviews.items];
                                      newItems[i].name = e.target.value;
                                      handleUpdate('reviews', 'items', newItems);
                                    }} className="w-full px-2 py-1.5 bg-white border-transparent text-xs font-bold" />
                                    <textarea value={rev.text} onChange={(e) => {
                                      const newItems = [...content.reviews.items];
                                      newItems[i].text = e.target.value;
                                      handleUpdate('reviews', 'items', newItems);
                                    }} className="w-full px-2 py-1.5 bg-white border-transparent text-[10px] h-12" />
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* Branding & Contacts */}
                <div className="space-y-4 pt-8 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" /> Contacts & Footer
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Email</label>
                       <input 
                         type="text"
                         value={content.footer?.contactInfo?.email || ''}
                         onChange={(e) => handleUpdate('footer', 'contactInfo', { ...content.footer.contactInfo, email: e.target.value })}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Phone</label>
                       <input 
                         type="text"
                         value={content.footer?.contactInfo?.phone || ''}
                         onChange={(e) => handleUpdate('footer', 'contactInfo', { ...content.footer.contactInfo, phone: e.target.value })}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                       />
                    </div>
                    {content.whatsapp && (
                       <div className="space-y-4 pt-4 border-t border-slate-50">
                          <div className="flex items-center justify-between">
                             <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">WhatsApp Button</label>
                             <input type="checkbox" checked={content.whatsapp.enabled} onChange={(e) => handleUpdate('whatsapp', 'enabled', e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Number</label>
                             <input type="text" value={content.whatsapp.phone} onChange={(e) => handleUpdate('whatsapp', 'phone', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs" placeholder="+1234..." />
                          </div>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'navbar' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-indigo-600" /> Navigation Links
                  </h3>
                  <div className="space-y-4">
                    {(content.navbar?.links || []).map((link, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link {i + 1}</span>
                          <button 
                            onClick={() => {
                              const newLinks = [...content.navbar.links];
                              newLinks.splice(i, 1);
                              handleUpdate('navbar', 'links', newLinks);
                            }}
                            className="text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const newLinks = [...content.navbar.links];
                              newLinks[i].label = e.target.value;
                              handleUpdate('navbar', 'links', newLinks);
                            }}
                            placeholder="Label"
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-600"
                          />
                          <input 
                            type="text"
                            value={link.href}
                            onChange={(e) => {
                              const newLinks = [...content.navbar.links];
                              newLinks[i].href = e.target.value;
                              handleUpdate('navbar', 'links', newLinks);
                            }}
                            placeholder="URL (#about)"
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newLinks = [...(content.navbar?.links || []), { label: 'New Link', href: '#' }];
                        handleUpdate('navbar', 'links', newLinks);
                      }}
                      className="w-full py-3 border-2 border-dashed border-slate-100 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Header CTA
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button Text</label>
                      <input 
                        type="text"
                        value={content.navbar?.ctaText || ''}
                        onChange={(e) => handleUpdate('navbar', 'ctaText', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button Link</label>
                      <input 
                        type="text"
                        value={content.navbar?.ctaHref || ''}
                        onChange={(e) => handleUpdate('navbar', 'ctaHref', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'style' && (
               <div className="space-y-8">
                  <div className="space-y-6">
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Palette className="w-4 h-4 text-indigo-600" /> Site Theme
                     </h3>
                     
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Color</label>
                           <div className="flex items-center gap-3">
                              <input 
                                type="color" 
                                value={content.theme?.primaryColor || '#2563eb'}
                                onChange={(e) => handleUpdate('theme', 'primaryColor', e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                              />
                              <input 
                                type="text" 
                                value={content.theme?.primaryColor || '#2563eb'}
                                onChange={(e) => handleUpdate('theme', 'primaryColor', e.target.value)}
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-600"
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Background Color</label>
                           <div className="flex items-center gap-3">
                              <input 
                                type="color" 
                                value={content.theme?.backgroundColor || '#ffffff'}
                                onChange={(e) => handleUpdate('theme', 'backgroundColor', e.target.value)}
                                className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                              />
                              <input 
                                type="text" 
                                value={content.theme?.backgroundColor || '#ffffff'}
                                onChange={(e) => handleUpdate('theme', 'backgroundColor', e.target.value)}
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-600"
                              />
                           </div>
                        </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secondary/Accent Color</label>
                            <div className="flex items-center gap-3">
                               <input 
                                 type="color" 
                                 value={content.theme?.accentColor || '#f59e0b'}
                                 onChange={(e) => handleUpdate('theme', 'accentColor', e.target.value)}
                                 className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                               />
                               <input 
                                 type="text" 
                                 value={content.theme?.accentColor || '#f59e0b'}
                                 onChange={(e) => handleUpdate('theme', 'accentColor', e.target.value)}
                                 className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-600"
                               />
                            </div>
                         </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Text Color</label>
                            <div className="flex items-center gap-3">
                               <input 
                                 type="color" 
                                 value={content.theme?.textColor || '#1e293b'}
                                 onChange={(e) => handleUpdate('theme', 'textColor', e.target.value)}
                                 className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                               />
                               <input 
                                 type="text" 
                                 value={content.theme?.textColor || '#1e293b'}
                                 onChange={(e) => handleUpdate('theme', 'textColor', e.target.value)}
                                 className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-600"
                               />
                            </div>
                         </div>
                      </div>
                  </div>

                  <div className="space-y-4 pt-10 border-t border-slate-50">
                     <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Type className="w-4 h-4 text-indigo-600" /> Typography
                     </h3>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Font</label>
                           <select 
                             value={content.theme?.bodyFont || 'Inter'}
                             onChange={(e) => handleUpdate('theme', 'bodyFont', e.target.value)}
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-600 transition-all font-bold text-sm appearance-none"
                           >
                              <option value="Inter">Inter (Sans)</option>
                              <option value="Outfit">Outfit (Modern)</option>
                              <option value="Playfair Display">Playfair (Classic)</option>
                              <option value="Space Grotesk">Space Grotesk</option>
                              <option value="Roboto">Roboto</option>
                           </select>
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </aside>

        {/* Real-time Preview */}
         <main className="flex-1 bg-slate-100 overflow-y-auto relative custom-scrollbar p-6 lg:p-12">
            <div className="w-full h-fit min-h-full bg-white shadow-2xl rounded-t-[3rem] overflow-hidden editor-preview-container relative">
               <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                     <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                     <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Live Preview</div>
                  <div className="w-10"></div>
               </div>
               <div className="preview-content">
                  <TemplateRenderer templateId={templateId} content={content} />
               </div>
            </div>

           {/* Preview Toggle for Mobile */}
           <button className="fixed bottom-10 right-10 lg:hidden w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center">
              <Eye className="w-6 h-6" />
           </button>
        </main>
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

       <style jsx global>{`
         .custom-scrollbar::-webkit-scrollbar { width: 5px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
         
         /* Fix fixed navbar in preview */
         .editor-preview-container nav.fixed {
           position: absolute !important;
         }
         .preview-content {
           position: relative;
         }
       `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black animate-pulse">BOOTING EDITOR ENGINE...</div>}>
      <EditorContent />
    </Suspense>
  );
}
