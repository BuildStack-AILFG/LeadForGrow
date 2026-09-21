'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Send, Building2, Headphones, Handshake, Newspaper } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { MARKETING } from '@/lib/marketing/designTokens';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { submitContactForm } from '@/lib/contactForm';
import { getConsentPayloadForForms } from '@/lib/consent/client';

const CHANNELS = [
  { id: 'sales', icon: Building2, title: 'Sales', email: 'sales@leadforgrow.com', desc: 'Demos, pricing, and enterprise plans' },
  { id: 'support', icon: Headphones, title: 'Support', email: 'support@leadforgrow.com', desc: 'Technical help and account issues' },
  { id: 'partners', icon: Handshake, title: 'Partnerships', email: 'partners@leadforgrow.com', desc: 'Agency and integration partnerships' },
  { id: 'media', icon: Newspaper, title: 'Media', email: 'press@leadforgrow.com', desc: 'Press inquiries and media kit' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', topic: 'sales', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const result = await submitContactForm(form, { consent: getConsentPayloadForForms() });
    setSending(false);
    if (result.ok) {
      toast.success(result.message);
      setForm({ name: '', email: '', company: '', topic: 'sales', message: '' });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <MarketingShell>
      <section className={`${MARKETING.section} ${MARKETING.gradientHero}`}>
        <div className={MARKETING.container}>
          <div className="max-w-2xl">
            <p className={MARKETING.overline}>Contact</p>
            <h1 className={`${MARKETING.h1} mt-3 mb-5`}>We&apos;d love to hear from you.</h1>
            <p className={MARKETING.bodyLarge}>Whether you&apos;re exploring LeadForGrow or need help with your account — our team responds within one business day.</p>
          </div>
        </div>
      </section>

      <section className={MARKETING.sectionTight}>
        <div className={`${MARKETING.container} grid lg:grid-cols-5 gap-12`}>
          <div className="lg:col-span-2 space-y-4">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm({ ...form, topic: c.id })}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${form.topic === c.id ? 'border-emerald-400 bg-emerald-50/80 shadow-sm' : 'border-emerald-100 bg-white hover:border-emerald-200'}`}
              >
                <c.icon className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="font-semibold text-[#111827]">{c.title}</p>
                <p className="text-xs text-[#64748B] mt-1">{c.desc}</p>
                <p className="text-sm text-emerald-700 mt-2">{c.email}</p>
              </button>
            ))}

            <div className={`${MARKETING.card} p-5 space-y-3 mt-6`}>
              <div className="flex items-start gap-3 text-sm text-[#64748B]">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <CompanyAddress variant="public" />
              </div>
              <div className="flex items-center gap-3 text-sm text-[#64748B]">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mon–Fri, 9:00 AM – 6:00 PM IST</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            </div>
            <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <div>
              <label className="text-sm font-semibold text-[#374151]">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-[#111827]"
                placeholder="Tell us how we can help..."
              />
            </div>
            <button type="submit" disabled={sending} className={`${MARKETING.btnGreen} w-full sm:w-auto`}>
              <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}

function Input({ label, type = 'text', value, onChange, required }) {
  return (
    <div>
      <label className="text-sm font-semibold text-[#374151]">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 text-[#111827]" />
    </div>
  );
}
