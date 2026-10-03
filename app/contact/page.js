'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MarketingShell from '@/app/components/marketing/MarketingShell';
import { SITE } from '@/lib/marketing/designTokens';
import CompanyAddress from '@/app/components/marketing/CompanyAddress';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { submitContactForm } from '@/lib/contactForm';
import { getConsentPayloadForForms } from '@/lib/consent/client';

const CHANNELS = [
  { id: 'sales', title: 'Sales', email: 'sales@leadforgrow.com', desc: 'Demos, pricing and enterprise plans' },
  { id: 'support', title: 'Support', email: 'support@leadforgrow.com', desc: 'Technical help and account issues' },
  { id: 'partners', title: 'Partnerships', email: 'partners@leadforgrow.com', desc: 'Agency and integration partnerships' },
  { id: 'media', title: 'Media', email: 'press@leadforgrow.com', desc: 'Press enquiries and brand assets' },
];

const EMPTY = { name: '', email: '', company: '', topic: 'sales', message: '' };
const field = 'mt-2 block w-full border-0 border-b border-[#CFCCC2] bg-transparent px-0 py-2.5 text-[16px] text-[#0B1712] placeholder:text-[#A3A199] focus:border-[#1D4B3E] focus:outline-none focus:ring-0';

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
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
      <section className={`${SITE.top} pb-20`}>
        <div className={`${SITE.wrap} grid gap-16 lg:grid-cols-[1fr_1.05fr]`}>
          {/* Directory */}
          <div>
            <p className={SITE.label}>Contact</p>
            <h1 className={`${SITE.serifXL} mt-6`}>Talk to a person.</h1>
            <p className={`${SITE.prose} mt-6 max-w-md`}>
              Whether you’re exploring LeadForGrow or need help with your account, write to the right team below — or use the form.
            </p>

            <table className="mt-12 w-full border-t-2 border-[#0B1712] text-left">
              <caption className="sr-only">Departments</caption>
              <tbody>
                {CHANNELS.map((c) => (
                  <tr key={c.id} className={`border-b ${SITE.rule} align-top`}>
                    <th scope="row" className="w-36 py-5 pr-4 text-[15px] font-semibold text-[#0B1712]">{c.title}</th>
                    <td className="py-5">
                      <a href={`mailto:${c.email}`} className={`${SITE.link} break-all text-[15px]`}>{c.email}</a>
                      <p className="mt-1 text-sm text-[#6B6B63]">{c.desc}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-12 grid gap-10 sm:grid-cols-2">
              <div className="text-sm leading-relaxed text-[#4B4D46]">
                <p className={SITE.label}>Office</p>
                <CompanyAddress variant="public" className="mt-3" />
              </div>
              <div className="text-sm text-[#4B4D46]">
                <p className={SITE.label}>Hours</p>
                <p className="mt-3 text-[#0B1712]">Mon–Fri, 9:00 AM – 6:00 PM IST</p>
                <a href="https://wa.me/918810873052" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-medium text-[#0B1712] hover:text-[#1D4B3E]">
                  <WhatsAppIcon colored className="h-4 w-4" /> Message us on WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={`self-start border ${SITE.rule} ${SITE.paper} p-6 sm:p-10`}>
            <h2 className={`${SITE.serif} text-2xl`}>Send us a message</h2>
            <p className="mt-2 text-sm text-[#6B6B63]">We usually reply within one business day.</p>

            <fieldset className="mt-8">
              <legend className={SITE.label}>Topic</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <label key={c.id} className={`cursor-pointer border px-4 py-2 text-sm transition-colors ${form.topic === c.id ? 'border-[#0B1712] bg-[#0B1712] text-white' : `${SITE.rule} bg-white text-[#0B1712] hover:border-[#0B1712]`}`}>
                    <input type="radio" name="topic" value={c.id} checked={form.topic === c.id} onChange={() => setForm({ ...form, topic: c.id })} className="sr-only" />
                    {c.title}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <label className="block"><span className={SITE.label}>Name</span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} autoComplete="name" /></label>
              <label className="block"><span className={SITE.label}>Email</span>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} autoComplete="email" /></label>
            </div>
            <label className="mt-8 block"><span className={SITE.label}>Company <span className="normal-case tracking-normal text-[#A3A199]">(optional)</span></span>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={field} autoComplete="organization" /></label>
            <label className="mt-8 block"><span className={SITE.label}>Message</span>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-y`} placeholder="Tell us how we can help…" /></label>

            <button type="submit" disabled={sending} className={`${SITE.btn} mt-10 w-full disabled:opacity-60 sm:w-auto`}>
              {sending ? 'Sending…' : 'Send message'} {!sending && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </section>
    </MarketingShell>
  );
}
