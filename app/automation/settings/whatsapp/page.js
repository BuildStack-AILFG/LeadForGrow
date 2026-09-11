'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Phone, Building2,
  Shield, Webhook, FileText, Unplug,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';

function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-1.5 ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
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

  const wa = status?.whatsapp || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/automation/settings/integrations" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">WhatsApp Business</h1>
          <p className="text-xs text-slate-500">Meta Cloud API connection & health</p>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading WhatsApp status…" height="12rem" />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{wa.displayNumber || 'Not connected'}</p>
                <p className="text-xs text-slate-500">{wa.businessName || status?.businessName || '—'}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${wa.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
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

          <div className="flex flex-wrap gap-2">
            <Link href="/automation/settings/integrations" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              {wa.enabled ? 'Edit credentials' : 'Connect WhatsApp'}
            </Link>
            <button type="button" onClick={handleSync} disabled={syncing} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sync status
            </button>
          </div>
        </>
      )}
    </div>
  );
}
