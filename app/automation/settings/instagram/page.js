'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Instagram, Unplug, ExternalLink,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

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

export default function InstagramSettingsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/business/settings/instagram-status');
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch {
      toast.error('Failed to load Instagram status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await authFetch('/api/business/settings/instagram-connect', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      } else if (data.success) {
        toast.success('Instagram connected');
        load();
      } else {
        toast.error(data.error || 'Connect failed');
      }
    } catch {
      toast.error('Connect failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Instagram?')) return;
    const res = await authFetch('/api/business/settings/instagram-connect', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Disconnected'); load(); }
    else toast.error(data.error || 'Failed');
  };

  const ig = status?.instagram || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/automation/settings/integrations" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Instagram Direct</h1>
          <p className="text-xs text-slate-500">Meta Instagram Messaging API</p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {ig.profilePicture ? (
                <img src={ig.profilePicture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-pink-600" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">@{ig.username || 'Not connected'}</p>
                <p className="text-xs text-slate-500">Page ID: {ig.pageId || '—'}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${ig.enabled ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
                {ig.enabled ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <StatusRow label="Authorization" value={ig.enabled ? 'Active' : 'Required'} ok={ig.enabled} />
            <StatusRow label="Webhook status" value={ig.webhookStatus || 'pending'} ok={ig.webhookStatus === 'active'} />
            <StatusRow label="Last sync" value={ig.lastSyncAt ? new Date(ig.lastSyncAt).toLocaleString() : 'Never'} ok={!!ig.lastSyncAt} />
            <StatusRow label="DM receive" value={ig.enabled ? 'Enabled' : 'Disabled'} ok={ig.enabled} />
            <StatusRow label="DM send" value={ig.enabled ? 'Enabled' : 'Disabled'} ok={ig.enabled} />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">Setup requirements</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Meta Business account with Instagram Professional account</li>
              <li>Instagram connected to a Facebook Page</li>
              <li>Webhook URL: <code className="text-[10px] bg-white dark:bg-slate-900 px-1 rounded">/api/webhooks/meta</code></li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {!ig.enabled ? (
              <button type="button" onClick={handleConnect} disabled={connecting} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                <Instagram className="w-4 h-4" /> Connect with Meta
              </button>
            ) : (
              <>
                <button type="button" onClick={handleConnect} disabled={connecting} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">
                  <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} /> Reconnect
                </button>
                <button type="button" onClick={handleDisconnect} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                  <Unplug className="w-4 h-4" /> Disconnect
                </button>
              </>
            )}
            <a href="https://developers.facebook.com/docs/messenger-platform/instagram" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              <ExternalLink className="w-4 h-4" /> Meta docs
            </a>
          </div>
        </>
      )}
    </div>
  );
}
