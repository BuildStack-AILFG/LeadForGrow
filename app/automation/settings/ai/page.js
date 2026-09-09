'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Sparkles, Save, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import AutoPageIntro from '../../components/shared/tour/AutoPageIntro';

const TONES = ['professional', 'friendly', 'formal', 'casual', 'persuasive'];
const PERSONALITIES = ['helpful sales advisor', 'consultative expert', 'energetic closer', 'empathetic support'];

export default function AiSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/settings');
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch {
      toast.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSettings(data.data);
      toast.success('AI settings saved');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  if (loading) {
    return (
      <PageLoader label="Loading settings…" height="40vh" />
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/automation/settings" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" /> AI Settings
          </h1>
          <p className="text-sm text-slate-500">Configure Grovia — tone, handoff, languages, and agent behavior</p>
        </div>
      </div>

      <AutoPageIntro />

      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${settings?.configured ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {settings?.configured ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        <span className="text-sm">{settings?.configured ? 'AI provider configured' : 'Set GROQ_API_KEY for full AI features'}</span>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">General</h2>
        <Toggle label="Enable AI" checked={settings?.enabled !== false} onChange={(v) => update('enabled', v)} />
        <Toggle label="AI Sales Agent (customer-facing)" checked={settings?.agentEnabled !== false} onChange={(v) => update('agentEnabled', v)} />
        <Toggle label="AI Reply Assist (inbox)" checked={settings?.replyAssistEnabled !== false} onChange={(v) => update('replyAssistEnabled', v)} />
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Toggle
            label="WhatsApp AI Agent — auto-reply to customers"
            checked={settings?.whatsappAutoReply === true}
            onChange={(v) => update('whatsappAutoReply', v)}
          />
          <p className="text-xs text-slate-500 mt-1 ml-1">
            When ON, the AI answers incoming WhatsApp messages automatically using your Knowledge Base
            (instead of only suggesting a reply). Skipped while a flow is running or a human has taken over.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Personality</h2>
        <Field label="Tone">
          <select value={settings?.tone || 'professional'} onChange={(e) => update('tone', e.target.value)} className="w-full text-sm px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Business personality">
          <select value={settings?.personality || PERSONALITIES[0]} onChange={(e) => update('personality', e.target.value)} className="w-full text-sm px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800">
            {PERSONALITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Languages (comma separated)">
          <input
            type="text"
            value={(settings?.languages || ['en']).join(', ')}
            onChange={(e) => update('languages', e.target.value.split(',').map((l) => l.trim()).filter(Boolean))}
            className="w-full text-sm px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
          />
        </Field>
        <Field label="Custom instructions">
          <textarea
            rows={4}
            value={settings?.customInstructions || ''}
            onChange={(e) => update('customInstructions', e.target.value)}
            placeholder="e.g. Always mention our 30-day money-back guarantee..."
            className="w-full text-sm px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
          />
        </Field>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Handoff & Escalation</h2>
        <Toggle label="Enable human handoff" checked={settings?.handoffEnabled !== false} onChange={(v) => update('handoffEnabled', v)} />
        <Field label="Handoff keywords (comma separated)">
          <input
            type="text"
            value={(settings?.handoffKeywords || [
              'human', 'agent', 'call me', 'speak to someone', 'talk to someone',
              'refund', 'cancel', 'cancellation', 'complaint', 'complain',
              'chargeback', 'lawyer', 'legal', 'sue', 'unhappy', 'angry', 'scam', 'fraud',
            ]).join(', ')}
            onChange={(e) => update('handoffKeywords', e.target.value.split(',').map((k) => k.trim()).filter(Boolean))}
            className="w-full text-sm px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800"
          />
          <p className="text-xs text-slate-500 mt-1">
            Any message containing one of these words skips auto-reply and waits for a human —
            covers both explicit requests for a person and topics too sensitive to answer unsupervised.
          </p>
        </Field>
        <Field label={`Confidence threshold (${Math.round((settings?.confidenceThreshold ?? 0.6) * 100)}%)`}>
          <input
            type="range"
            min="0.3"
            max="0.95"
            step="0.05"
            value={settings?.confidenceThreshold ?? 0.6}
            onChange={(e) => update('confidenceThreshold', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-slate-500 mt-1">
            Below this confidence, the AI leaves the message for a human instead of auto-sending a guess.
          </p>
        </Field>
        <Toggle label="AI only during working hours" checked={!!settings?.workingHoursOnly} onChange={(v) => update('workingHoursOnly', v)} />
        <p className="text-xs text-slate-500 -mt-2 ml-1">
          Outside your configured business hours, messages wait for a human instead of getting an auto-reply.
        </p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save settings
        </button>
        <Link href="/automation/ai/knowledge" className="inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          Manage Knowledge Base
        </Link>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
