'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, Headphones, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { LANDING } from '@/app/components/landing/landingStyles';
import {
  CONTACT_FORM_TOKEN,
  getFormConfigUrl,
  getFormSubmitUrl,
} from '@/lib/publicForms';

const CONTACT_ITEMS = [
  {
    icon: Mail,
    label: 'Email us',
    value: 'sales@leadforgrow.com',
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: ['+91 8810 873 052', '+91 8076 772 797'],
    iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  },
  {
    icon: Headphones,
    label: 'Support',
    value: '24/7 live agent chat',
    iconClass: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  },
];

const FALLBACK_FIELDS = [
  { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'John Doe', width: 'half' },
  { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'john@example.com', width: 'half' },
  { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '+91 98765 43210', width: 'full' },
  { name: 'message', label: 'Your message', type: 'textarea', required: true, placeholder: 'How can we help you scale?', width: 'full' },
];

const inputClass =
  'w-full px-4 py-3 rounded-md border border-[#E2E8F0] bg-white text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors';

function fieldInputType(type) {
  if (type === 'phone') return 'tel';
  if (type === 'email') return 'email';
  if (type === 'date') return 'date';
  return 'text';
}

function FormField({ field, value, onChange }) {
  const labelClass = 'text-[10px] font-semibold uppercase tracking-wider text-slate-400';
  const id = `reach-out-${field.name}`;

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className={labelClass}>
          {field.label}
          {field.required ? ' *' : ''}
        </label>
        <textarea
          id={id}
          name={field.name}
          value={value}
          onChange={onChange}
          required={field.required}
          rows={4}
          placeholder={field.placeholder || ''}
          className={`${inputClass} resize-none`}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className={labelClass}>
          {field.label}
          {field.required ? ' *' : ''}
        </label>
        <select
          id={id}
          name={field.name}
          value={value}
          onChange={onChange}
          required={field.required}
          className={`${inputClass} appearance-none`}
        >
          <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {field.label}
        {field.required ? ' *' : ''}
      </label>
      <input
        suppressHydrationWarning
        id={id}
        type={fieldInputType(field.type)}
        name={field.name}
        value={value}
        onChange={onChange}
        required={field.required}
        placeholder={field.placeholder || ''}
        className={inputClass}
      />
    </div>
  );
}

export default function ContactFormSection() {
  const [fields, setFields] = useState(FALLBACK_FIELDS);
  const [buttonText, setButtonText] = useState('Send message');
  const [successMessage, setSuccessMessage] = useState('Thank you! We will get back to you soon.');
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const initFormData = useCallback((fieldList) => {
    const initial = {};
    fieldList.forEach((f) => {
      initial[f.name] = f.defaultValue || '';
    });
    setFormData(initial);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const res = await fetch(getFormConfigUrl());
        const json = await res.json();

        if (cancelled) return;

        if (json.success && json.data?.fields?.length) {
          setFields(json.data.fields);
          initFormData(json.data.fields);
          if (json.data.styling?.buttonText) setButtonText(json.data.styling.buttonText);
          if (json.data.successMessage) setSuccessMessage(json.data.successMessage);
          if (json.data.redirectUrl) setRedirectUrl(json.data.redirectUrl);
        } else {
          initFormData(FALLBACK_FIELDS);
        }
      } catch {
        if (!cancelled) initFormData(FALLBACK_FIELDS);
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [initFormData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      token: CONTACT_FORM_TOKEN,
      ...formData,
    };

    try {
      const res = await fetch(getFormSubmitUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        setSuccessMessage(result.message || successMessage);
        setSubmitted(true);
        initFormData(fields);
        if (result.redirectUrl || redirectUrl) {
          window.location.href = result.redirectUrl || redirectUrl;
        }
      } else {
        setError(result.error || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const halfFields = fields.filter((f) => f.width === 'half');
  const fullFields = fields.filter((f) => f.width !== 'half');
  const pairedHalf = [];
  for (let i = 0; i < halfFields.length; i += 2) {
    pairedHalf.push(halfFields.slice(i, i + 2));
  }

  return (
    <section className={`${LANDING.section} bg-white border-t border-[#E2E8F0]`}>
      <div className={LANDING.container}>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              Reach out
            </p>
            <h2 className={`${LANDING.heading} mt-2`}>
              Want to see where leads are leaking in your business?
            </h2>
            <p className={`${LANDING.subheading} mt-3 max-w-md`}>
              Every hour you wait is a lead gone cold. Our team will show you how to automate follow-ups and recover revenue.
            </p>

            <div className="mt-8 space-y-5">
              {CONTACT_ITEMS.map(({ icon: Icon, label, value, iconClass }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                    {Array.isArray(value) ? (
                      value.map((line) => (
                        <p key={line} className="text-sm font-medium text-slate-900 dark:text-white">
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${LANDING.card} p-6 md:p-8`}>
            {submitted ? (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Message sent!</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{successMessage}</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {configLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading form…</span>
                  </div>
                ) : (
                  <>
                    {pairedHalf.map((pair, idx) => (
                      <div key={`half-row-${idx}`} className="grid sm:grid-cols-2 gap-4">
                        {pair.map((field) => (
                          <FormField
                            key={field.name}
                            field={field}
                            value={formData[field.name] ?? ''}
                            onChange={handleChange}
                          />
                        ))}
                      </div>
                    ))}

                    {fullFields.map((field) => (
                      <FormField
                        key={field.name}
                        field={field}
                        value={formData[field.name] ?? ''}
                        onChange={handleChange}
                      />
                    ))}
                  </>
                )}

                {error && (
                  <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <button
                  suppressHydrationWarning
                  type="submit"
                  disabled={isSubmitting || configLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      {buttonText}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
