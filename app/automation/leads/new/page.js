'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MessageSquare,
  Briefcase,
  UserPlus,
  Tag,
  Globe,
  MapPin,
  Sparkles,
  Zap,
  Inbox,
  BarChart3,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch, getAuthToken } from '@/lib/apiClient';
import { PRIORITY_CONFIG, SOURCE_OPTIONS } from '../../components/leads/constants';

const BLUE = '#059669';
const BLUE_LIGHT = '#E8EFFC';
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const MANUAL_SOURCES = SOURCE_OPTIONS.filter((s) => s.value && !['whatsapp', 'bot'].includes(s.value));

const STEPS = [
  { id: 1, label: 'Contact', icon: User },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Details', icon: Briefcase },
];

const inputClass =
  'w-full h-10 px-3 text-[13px] rounded-lg border border-[#E5E7EB] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#059669]/15 focus:border-[#059669] transition-all';

function Field({ label, required, children, hint, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[#98A2B3] leading-snug">{hint}</p>}
    </div>
  );
}

function Section({ step, title, subtitle, children, activeStep }) {
  const isActive = step === activeStep;
  return (
    <section
      className={`bg-white border rounded-xl overflow-hidden transition-shadow duration-200 ${
        isActive
          ? 'border-[#059669]/30 shadow-[0_4px_16px_rgba(26,69,165,0.08)]'
          : 'border-[#E5E7EB] shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      }`}
    >
      <div className="px-5 py-4 border-b border-[#F2F4F7] flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold text-white"
          style={{ backgroundColor: isActive ? BLUE : '#98A2B3' }}
        >
          {step}
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-[#101828]">{title}</h2>
          {subtitle && <p className="text-[12px] text-[#667085] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PreviewPanel({ formData }) {
  const locationLine = [
    formData.location.city,
    formData.location.state,
    formData.location.country,
  ].filter(Boolean).join(', ');

  const priorityCfg = PRIORITY_CONFIG[formData.priority];

  return (
    <div className="sticky top-6 space-y-4">
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F2F4F7]" style={{ backgroundColor: BLUE_LIGHT }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: BLUE }} />
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: BLUE }}>
              Live preview
            </p>
          </div>
          <p className="text-[12px] text-[#667085]">How this lead will appear in your CRM</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[14px] font-semibold shrink-0"
              style={{ backgroundColor: BLUE }}
            >
              {(formData.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#101828] truncate">
                {formData.name || 'Lead name'}
              </p>
              <p className="text-[12px] text-[#667085] truncate">
                {formData.phone || 'No phone yet'}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-[12px]">
            {formData.email && (
              <div className="flex items-center gap-2 text-[#475467]">
                <Mail className="w-3.5 h-3.5 text-[#98A2B3]" />
                <span className="truncate">{formData.email}</span>
              </div>
            )}
            {formData.serviceInterest && (
              <div className="flex items-center gap-2 text-[#475467]">
                <Briefcase className="w-3.5 h-3.5 text-[#98A2B3]" />
                <span className="truncate">{formData.serviceInterest}</span>
              </div>
            )}
            {locationLine && (
              <div className="flex items-center gap-2 text-[#475467]">
                <MapPin className="w-3.5 h-3.5 text-[#98A2B3]" />
                <span className="truncate">{locationLine}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#F2F4F7] text-[#475467] border border-[#E5E7EB] capitalize">
              {MANUAL_SOURCES.find((s) => s.value === formData.source)?.label || formData.source}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${priorityCfg?.badge || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {priorityCfg?.label || formData.priority}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#E8EFFC] text-[#059669] border border-[#C7D7F5]">
              New Lead
            </span>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] text-[#667085]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFBFC] p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#667085]">On save</p>
        {[
          { icon: BarChart3, text: 'Added to lead pipeline' },
          { icon: Inbox, text: 'Synced to inbox & activity feed' },
          { icon: Zap, text: 'Automations triggered if configured' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 text-[12px] text-[#475467]">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#E5E7EB]">
              <Icon className="w-3.5 h-3.5" style={{ color: BLUE }} />
            </span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceInterest: '',
    source: 'manual',
    message: '',
    priority: 'medium',
    tags: [],
    location: { street: '', city: '', state: '', postalCode: '', country: '' },
  });

  const set = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));
  const setLocation = (key, value) =>
    setFormData((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));

  const completion = useMemo(() => {
    let score = 0;
    if (formData.name.trim()) score += 35;
    if (formData.phone.trim()) score += 35;
    if (formData.email.trim()) score += 10;
    if (formData.serviceInterest.trim()) score += 10;
    if (formData.location.city || formData.location.country) score += 10;
    return Math.min(100, score);
  }, [formData]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || formData.tags.includes(tag)) return;
    set('tags', [...formData.tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag) => set('tags', formData.tags.filter((t) => t !== tag));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Full name is required');
      setActiveStep(1);
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      setActiveStep(1);
      return;
    }

    setLoading(true);
    try {
      if (!getAuthToken()) {
        toast.error('Please login to continue');
        router.push('/user/register?mode=login');
        return;
      }

      const location = Object.fromEntries(
        Object.entries(formData.location).filter(([, value]) => String(value || '').trim())
      );
      const { location: _location, ...leadFields } = formData;

      const res = await authFetch('/api/automation/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadFields,
          whatsapp: formData.phone,
          ...(Object.keys(location).length ? { location } : {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Lead created successfully');
        router.push(data.data?._id ? `/automation/leads/${data.data._id}` : '/automation/leads');
      } else {
        toast.error(data.error || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FAFBFC]">
      {/* Top bar */}
      <div className="border-b border-[#E5E7EB] bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/automation/leads"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] hover:text-[#059669] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Leads
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((s) => {
              const done = s.id < activeStep;
              const active = s.id === activeStep;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStep(s.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    active
                      ? 'text-white'
                      : done
                        ? 'text-[#059669] bg-[#E8EFFC]'
                        : 'text-[#98A2B3] hover:bg-[#F2F4F7]'
                  }`}
                  style={active ? { backgroundColor: BLUE } : undefined}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 min-w-[100px] justify-end">
            <span className="text-[11px] text-[#98A2B3] hidden sm:inline">{completion}% complete</span>
            <div className="w-16 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${completion}%`, backgroundColor: BLUE }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: BLUE }}
            >
              <UserPlus className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-[#101828] tracking-tight">Add New Lead</h1>
              <p className="text-[13px] text-[#667085] mt-1 max-w-lg">
                Register a new enquiry manually. It will sync to your pipeline, inbox, and dashboard instantly.
              </p>
            </div>
          </div>
        </div>

        <form id="new-lead-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            <div className="space-y-5">
              <div onFocus={() => setActiveStep(1)}>
                <Section step={1} title="Contact details" subtitle="Name, phone, and email" activeStep={activeStep}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full name" required>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="e.g. S.Singh"
                        className={inputClass}
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Phone" required hint="Used for WhatsApp & calls">
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className={inputClass}
                        autoComplete="tel"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="name@company.com"
                        className={inputClass}
                        autoComplete="email"
                      />
                    </Field>
                    <Field label="Service interest">
                      <input
                        type="text"
                        value={formData.serviceInterest}
                        onChange={(e) => set('serviceInterest', e.target.value)}
                        placeholder="e.g. CRM setup, SEO"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              <div onFocus={() => setActiveStep(2)}>
                <Section step={2} title="Location" subtitle="Powers customer location analytics" activeStep={activeStep}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Country">
                      <input
                        type="text"
                        value={formData.location.country}
                        onChange={(e) => setLocation('country', e.target.value)}
                        placeholder="India"
                        className={inputClass}
                        autoComplete="country-name"
                      />
                    </Field>
                    <Field label="City">
                      <input
                        type="text"
                        value={formData.location.city}
                        onChange={(e) => setLocation('city', e.target.value)}
                        placeholder="Mumbai"
                        className={inputClass}
                        autoComplete="address-level2"
                      />
                    </Field>
                    <Field label="State / Region">
                      <input
                        type="text"
                        value={formData.location.state}
                        onChange={(e) => setLocation('state', e.target.value)}
                        placeholder="Maharashtra"
                        className={inputClass}
                        autoComplete="address-level1"
                      />
                    </Field>
                    <Field label="Postal code">
                      <input
                        type="text"
                        value={formData.location.postalCode}
                        onChange={(e) => setLocation('postalCode', e.target.value)}
                        placeholder="400001"
                        className={inputClass}
                        autoComplete="postal-code"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Street address">
                        <input
                          type="text"
                          value={formData.location.street}
                          onChange={(e) => setLocation('street', e.target.value)}
                          placeholder="Street, building, area"
                          className={inputClass}
                          autoComplete="street-address"
                        />
                      </Field>
                    </div>
                  </div>
                </Section>
              </div>

              <div onFocus={() => setActiveStep(3)}>
                <Section step={3} title="Lead context" subtitle="Source, priority, tags & notes" activeStep={activeStep}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Field label="Source">
                      <select
                        value={formData.source}
                        onChange={(e) => set('source', e.target.value)}
                        className={inputClass}
                      >
                        {MANUAL_SOURCES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Priority">
                      <div className="flex flex-wrap gap-2">
                        {PRIORITIES.map((p) => {
                          const active = formData.priority === p;
                          const cfg = PRIORITY_CONFIG[p];
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => set('priority', p)}
                              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all ${
                                active
                                  ? 'text-white border-transparent shadow-sm'
                                  : 'text-[#475467] border-[#E5E7EB] bg-white hover:border-[#C7D7F5] hover:bg-[#F9FAFB]'
                              }`}
                              style={active ? { backgroundColor: BLUE } : undefined}
                            >
                              {cfg?.label || p}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>

                  <Field label="Tags" hint="Press Enter to add">
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border"
                          style={{ backgroundColor: BLUE_LIGHT, color: BLUE, borderColor: '#C7D7F5' }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="opacity-60 hover:opacity-100 hover:text-red-500"
                            aria-label={`Remove ${tag}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                      }}
                      placeholder="hot, enterprise, referral…"
                      className={inputClass}
                    />
                  </Field>

                  <div className="mt-4">
                    <Field label="Notes">
                      <textarea
                        value={formData.message}
                        onChange={(e) => set('message', e.target.value)}
                        placeholder="Requirements, context, or first conversation summary…"
                        rows={4}
                        className={`${inputClass} h-auto py-2.5 resize-none`}
                      />
                    </Field>
                  </div>
                </Section>
              </div>
            </div>

            <PreviewPanel formData={formData} />
          </div>
        </form>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 sm:px-6 py-4 shadow-[0_-4px_16px_rgba(16,24,40,0.06)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <p className="text-[12px] text-[#667085] hidden md:flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: BLUE }} />
            Manual entry · syncs to pipeline & inbox
          </p>
          <div className="flex items-center gap-3 ml-auto w-full md:w-auto">
            <button
              type="button"
              onClick={() => router.push('/automation/leads')}
              className="flex-1 md:flex-none h-10 px-5 text-[13px] font-medium text-[#344054] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="new-lead-form"
              disabled={loading}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 h-10 px-6 text-[13px] font-semibold text-white rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: BLUE }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? 'Saving…' : 'Create Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
