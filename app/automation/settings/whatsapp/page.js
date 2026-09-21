'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Phone, Building2,
  Shield, Webhook, FileText, Unplug, KeyRound, ChevronDown,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import WebhookUrlField from '@/app/automation/components/settings/WebhookUrlField';
import { businessWebhookPath } from '@/lib/meta/webhookUrls';

function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-1.5 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        {value}
      </span>
    </div>
  );
}

export default function WhatsAppSettingsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    accessToken: '', phoneNumberId: '', businessAccountId: '', appId: '', appSecret: '', verifyToken: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/business/settings/whatsapp-status');
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch {
      toast.error('Failed to load WhatsApp status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await authFetch('/api/business/settings/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifyOnly: true }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Sync complete'); load(); }
      else toast.error(data.error || 'Sync failed');
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSave = async () => {
    if (!form.accessToken.trim() && !status?.whatsapp?.hasAccessToken) {
      toast.error('Access Token is required');
      return;
    }
    if (!form.phoneNumberId.trim() && !status?.whatsapp?.phoneNumberId) {
      toast.error('Phone Number ID is required');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/business/settings/whatsapp-status', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('WhatsApp credentials saved');
        setManualOpen(false);
        setForm({ accessToken: '', phoneNumberId: '', businessAccountId: '', appId: '', appSecret: '', verifyToken: '' });
        load();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const wa = status?.whatsapp || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/automation/settings/integrations" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">WhatsApp Business</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Meta Cloud API connection & health</p>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading WhatsApp status…" height="12rem" />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{wa.displayNumber || 'Not connected'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{wa.businessName || status?.businessName || '—'}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${wa.enabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {wa.enabled ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <StatusRow label="Provider" value={wa.provider || 'meta'} ok />
            <StatusRow label="Phone Number ID" value={wa.phoneNumberId ? '••••' + wa.phoneNumberId.slice(-4) : '—'} ok={!!wa.phoneNumberId} />
            <StatusRow label="Quality rating" value={wa.qualityRating || 'Unknown'} ok={wa.qualityRating === 'GREEN' || wa.qualityRating === 'HIGH'} />
            <StatusRow label="Verification" value={wa.verificationStatus || (wa.enabled ? 'Verified' : 'Pending')} ok={wa.enabled} />
            <StatusRow label="Webhook" value={wa.webhookStatus || 'Active'} ok={wa.webhookStatus !== 'error'} />
            <StatusRow label="Templates synced" value={String(wa.templateCount ?? 0)} ok={(wa.templateCount ?? 0) > 0} />
            <StatusRow label="Last verified" value={wa.lastVerified ? new Date(wa.lastVerified).toLocaleString() : 'Never'} ok={!!wa.lastVerified} />
          </div>

          {/* Where to point Meta's webhook: the client copies this instead of building the URL by hand. */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Webhook setup</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              In the Meta developer dashboard open <span className="font-medium">WhatsApp → Configuration → Webhook</span>,
              paste this Callback URL, enter your Verify token, then subscribe to <code className="text-[11px]">messages</code>.
            </p>
            {status?.businessId ? (
              <WebhookUrlField path={businessWebhookPath(status.businessId)}>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Verify token: {wa.hasVerifyToken
                    ? 'saved. Use the same value you saved under "Webhook Verify Token" below.'
                    : 'not set yet. Save one under "Webhook Verify Token" below first, then use the same value in Meta.'}
                </p>
              </WebhookUrlField>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Webhook URL is not available yet.</p>
            )}
          </div>

          {/* Manual credential entry — saves straight to the DB (reliable). */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              {wa.enabled ? 'Edit credentials manually' : 'Connect manually (enter credentials)'}
              <ChevronDown className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${manualOpen ? 'rotate-180' : ''}`} />
            </button>
            {manualOpen && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
                {[
                  { key: 'accessToken', label: 'Permanent Access Token', ph: 'EAAG…', secret: true, req: true, hint: wa.hasAccessToken ? 'Already set — leave blank to keep' : 'From Meta System User' },
                  { key: 'phoneNumberId', label: 'Phone Number ID', ph: 'e.g. 123456789012345', req: true },
                  { key: 'businessAccountId', label: 'WhatsApp Business Account ID (WABA)', ph: 'e.g. 987654321098765' },
                  { key: 'appId', label: 'Meta App ID', ph: 'e.g. 1122334455' },
                  { key: 'appSecret', label: 'App Secret', ph: '••••', secret: true, hint: wa.hasAppSecret ? 'Already set — leave blank to keep' : 'Meta App → Settings → Basic' },
                  { key: 'verifyToken', label: 'Webhook Verify Token', ph: 'any string, same as in Meta', secret: true, hint: wa.hasVerifyToken ? 'Already set — leave blank to keep' : 'Must match the token you enter in Meta webhook config' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {f.label} {f.req && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={f.secret ? 'password' : 'text'}
                      value={form[f.key]}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      placeholder={f.ph}
                      autoComplete="off"
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    {f.hint && <p className="text-[11px] text-slate-400 mt-1">{f.hint}</p>}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {wa.enabled ? 'Update credentials' : 'Save & connect'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleSync} disabled={syncing} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sync status
            </button>
          </div>
        </>
      )}
    </div>
  );
}
