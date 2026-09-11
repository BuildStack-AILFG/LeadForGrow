import {
  Type, Mail, Phone, MessageSquare, ChevronDown, CircleDot, CheckSquare,
  Calendar, Upload, MapPin, Hash, Layers, MessageCircle, Home, GraduationCap,
  LayoutTemplate, Sparkles, PanelTop, Maximize2
} from 'lucide-react';

export const FIELD_CATEGORIES = [
  {
    id: 'basic',
    label: 'Basic',
    fields: [
      { type: 'text', label: 'Short text', desc: 'Single line input', icon: Type, defaultLabel: 'Text Field' },
      { type: 'textarea', label: 'Long text', desc: 'Multi-line paragraph', icon: MessageSquare, defaultLabel: 'Message' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    fields: [
      { type: 'email', label: 'Email', desc: 'Email with validation', icon: Mail, defaultLabel: 'Email Address' },
      { type: 'phone', label: 'Phone', desc: 'Phone number field', icon: Phone, defaultLabel: 'Phone Number' },
      { type: 'address', label: 'Address', desc: 'Street address block', icon: MapPin, defaultLabel: 'Address' },
    ],
  },
  {
    id: 'choice',
    label: 'Choice',
    fields: [
      { type: 'select', label: 'Dropdown', desc: 'Select from options', icon: ChevronDown, defaultLabel: 'Select option', options: ['Option 1', 'Option 2'] },
      { type: 'radio', label: 'Radio buttons', desc: 'Pick one option', icon: CircleDot, defaultLabel: 'Choose one', options: ['Yes', 'No'] },
      { type: 'checkbox', label: 'Checkbox', desc: 'Agreement or toggle', icon: CheckSquare, defaultLabel: 'I agree to terms' },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    fields: [
      { type: 'date', label: 'Date picker', desc: 'Calendar date input', icon: Calendar, defaultLabel: 'Preferred date' },
    ],
  },
  {
    id: 'uploads',
    label: 'Uploads',
    fields: [
      { type: 'file', label: 'File upload', desc: 'Documents & images', icon: Upload, defaultLabel: 'Upload file' },
    ],
  },
];

/** Flat list for backward compatibility */
export const FIELD_TYPES = FIELD_CATEGORIES.flatMap((c) => c.fields);

export const DEFAULT_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
  { name: 'phone', label: 'Phone Number', type: 'phone', required: true, placeholder: '+91 98765 43210' },
  { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'you@company.com' },
  { name: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'How can we help?' },
];

export const FORM_TEMPLATES = [
  {
    id: 'contact',
    name: 'Contact Form',
    desc: 'Name, phone, email & message',
    icon: Mail,
    gradient: 'from-teal-500 to-indigo-600',
    formType: 'inline',
    fields: DEFAULT_FIELDS,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Lead Form',
    desc: 'Capture leads for WhatsApp follow-up',
    icon: MessageCircle,
    gradient: 'from-emerald-500 to-teal-600',
    formType: 'floating',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
      { name: 'phone', label: 'WhatsApp Number', type: 'phone', required: true, placeholder: '+91 98765 43210' },
      { name: 'interest', label: 'What are you looking for?', type: 'select', required: true, options: ['Product info', 'Pricing', 'Support', 'Other'], placeholder: 'Select…' },
    ],
  },
  {
    id: 'consultation',
    name: 'Consultation Form',
    desc: 'Book a call or demo',
    icon: Calendar,
    gradient: 'from-violet-500 to-purple-600',
    formType: 'popup',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'you@company.com' },
      { name: 'phone', label: 'Phone', type: 'phone', required: true, placeholder: '+91…' },
      { name: 'date', label: 'Preferred date', type: 'date', required: false },
      { name: 'message', label: 'Tell us about your needs', type: 'textarea', required: false },
    ],
  },
  {
    id: 'realestate',
    name: 'Real Estate Form',
    desc: 'Property inquiry capture',
    icon: Home,
    gradient: 'from-amber-500 to-orange-600',
    formType: 'inline',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'phone', required: true },
      { name: 'budget', label: 'Budget range', type: 'select', required: true, options: ['Under ₹50L', '₹50L–1Cr', '₹1Cr+'] },
      { name: 'location', label: 'Preferred location', type: 'text', required: false },
    ],
  },
  {
    id: 'education',
    name: 'Education Inquiry',
    desc: 'Course & admission leads',
    icon: GraduationCap,
    gradient: 'from-sky-500 to-teal-600',
    formType: 'fullpage',
    fields: [
      { name: 'name', label: 'Student Name', type: 'text', required: true },
      { name: 'phone', label: 'Parent / Student Phone', type: 'phone', required: true },
      { name: 'course', label: 'Course interest', type: 'select', required: true, options: ['Engineering', 'Medical', 'MBA', 'Other'] },
      { name: 'email', label: 'Email', type: 'email', required: false },
    ],
  },
  {
    id: 'multistep',
    name: 'Multi-step Form',
    desc: 'Guided step-by-step flow',
    icon: Layers,
    gradient: 'from-rose-500 to-pink-600',
    formType: 'multistep',
    fields: [
      { name: 'name', label: 'Step 1 — Your name', type: 'text', required: true },
      { name: 'phone', label: 'Step 2 — Phone', type: 'phone', required: true },
      { name: 'email', label: 'Step 3 — Email', type: 'email', required: false },
      { name: 'message', label: 'Step 4 — Details', type: 'textarea', required: false },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Form',
    desc: 'Just name & phone',
    icon: Sparkles,
    gradient: 'from-slate-600 to-slate-800',
    formType: 'minimal',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
      { name: 'phone', label: 'Phone', type: 'phone', required: true, placeholder: '+91…' },
    ],
  },
  {
    id: 'popup',
    name: 'Popup Widget',
    desc: 'Floating capture button',
    icon: PanelTop,
    gradient: 'from-indigo-500 to-teal-600',
    formType: 'floating',
    fields: DEFAULT_FIELDS,
  },
];

export const LEAD_SOURCES = [
  { id: 'website', label: 'Website' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'ads', label: 'Paid Ads' },
  { id: 'social', label: 'Social Media' },
  { id: 'referral', label: 'Referral' },
  { id: 'other', label: 'Other' },
];

export const PIPELINE_STAGES = [
  { id: 'new', label: 'New Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'won', label: 'Won' },
];

export const FORM_TYPES = [
  { id: 'inline', label: 'Inline form' },
  { id: 'popup', label: 'Popup modal' },
  { id: 'floating', label: 'Floating widget' },
  { id: 'fullpage', label: 'Full page' },
  { id: 'multistep', label: 'Multi-step' },
  { id: 'conversational', label: 'Conversational' },
];

export const FORM_THEMES = [
  { id: 'light', label: 'Light', primary: '#2563eb', bg: '#ffffff', text: '#0f172a' },
  { id: 'dark', label: 'Dark', primary: '#6366f1', bg: '#0f172a', text: '#f8fafc' },
  { id: 'minimal', label: 'Minimal', primary: '#18181b', bg: '#fafafa', text: '#18181b' },
  { id: 'gradient', label: 'Gradient', primary: '#7c3aed', bg: 'linear-gradient(135deg,#f5f3ff,#eff6ff)', text: '#1e1b4b' },
];

export function createFieldFromType(typeDef) {
  const id = `${typeDef.type}_${Date.now()}`;
  return {
    name: id.replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
    label: typeDef.defaultLabel,
    type: typeDef.type,
    required: false,
    placeholder: '',
    options: typeDef.options || [],
    width: 'full',
    helpText: '',
  };
}

export function normalizeStyling(styling = {}) {
  return {
    theme: styling.theme || 'light',
    primaryColor: styling.primaryColor || '#2563eb',
    buttonText: styling.buttonText || 'Submit',
    borderRadius: styling.borderRadius ?? 12,
    fontFamily: styling.fontFamily || 'system',
    backgroundColor: styling.backgroundColor || '',
    formType: styling.formType || 'floating',
    logoUrl: styling.logoUrl || '',
    automation: styling.automation || {
      whatsappReply: false,
      emailNotify: true,
      assignAgent: false,
      triggerAutomation: true,
      leadScoring: false,
      pipelineStage: 'new',
    },
  };
}

export function calcConversionRate(form) {
  const views = form?.metadata?.viewCount || form?.submissionCount * 3 || 0;
  if (!views) return form?.submissionCount > 0 ? 100 : 0;
  return Math.min(100, Math.round((form.submissionCount / views) * 100));
}

export function buildSampleSubmissionBody(form) {
  const body = { token: form.token };
  (form.fields || []).forEach((field) => {
    if (field.type === 'email') body[field.name] = 'john@example.com';
    else if (field.type === 'phone') body[field.name] = '+919876543210';
    else if (field.type === 'checkbox') body[field.name] = true;
    else if (field.type === 'select' || field.type === 'radio') {
      body[field.name] = (field.options && field.options[0]) || 'Option 1';
    } else if (field.name === 'name' || field.label?.toLowerCase().includes('name')) {
      body[field.name] = 'John Doe';
    } else {
      body[field.name] = field.placeholder || 'Sample value';
    }
  });
  return body;
}

export function getEmbedSnippets(form, baseUrl) {
  const token = form.token;
  const submissionUrl = `${baseUrl}/api/forms/submit`;
  const configUrl = `${baseUrl}/api/forms/config?token=${token}`;
  const hostedLink = `${baseUrl}/test-form.html?token=${token}`;
  const sampleBody = buildSampleSubmissionBody(form);

  const iframe = `<iframe src="${hostedLink}" width="100%" height="520" frameborder="0" style="border:none;border-radius:12px;" title="${form.name || 'Contact form'}"></iframe>`;

  const html = `<!-- LeadForGrow Form: ${form.name || 'Contact form'} -->
<div data-lfg-token="${token}"></div>
<script src="${baseUrl}/lfg-widget.js" async></script>`;

  const inline = `<!-- Inline form (no floating button) -->
<div data-lfg-token="${token}" data-lfg-mode="inline"></div>
<script src="${baseUrl}/lfg-widget.js" async></script>`;

  const popup = `<!-- Popup widget with optional auto-open (ms) -->
<div data-lfg-token="${token}" data-lfg-popup-delay="30000"></div>
<script src="${baseUrl}/lfg-widget.js" async></script>`;

  const curl = `curl -X POST ${submissionUrl} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleBody, null, 2).replace(/'/g, "'\\''")}'`;

  return { iframe, html, inline, popup, hostedLink, submissionUrl, configUrl, curl, sampleBody, legacy: form.embedCode };
}
