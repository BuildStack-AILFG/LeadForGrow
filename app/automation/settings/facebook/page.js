'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Unplug, ExternalLink, KeyRound, ChevronDown,
} from 'lucide-react';
import { FacebookIcon } from '@/app/automation/components/chat/BrandIcons';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/app/components/ConfirmProvider';
import ChannelCommentAutomations from '@/app/automation/components/settings/ChannelCommentAutomations';

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

export default function FacebookSettingsPage() {
  const confirm = useConfirm();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pageId: '', accessToken: '', pageName: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/business/settings/facebook-status');
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch {
      toast.error('Failed to load Facebook status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleManualSave = async () => {
    if (!form.pageId.trim() || !form.accessToken.trim()) {
      toast.error('Page ID and Access Token are required');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/business/settings/facebook-status', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Facebook connected');
        setManualOpen(false);
        setForm({ pageId: '', accessToken: '', pageName: '' });
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

  const handleDisconnect = async () => {
    if (!(await confirm({ title: 'Disconnect Facebook', message: 'Disconnect Facebook Page?', confirmLabel: 'Disconnect', danger: true }))) return;
    const res = await authFetch('/api/business/settings/facebook-status', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast.success('Disconnected'); load(); }
    else toast.error(data.error || 'Failed');
  };

  const fb = status?.facebook || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/automation/settings/integrations" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Facebook Page</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Messenger DMs + post comment automation</p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <FacebookIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{fb.pageName || 'Not connected'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Page ID: {fb.pageId || '—'}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${fb.enabled ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {fb.enabled ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <StatusRow label="Authorization" value={fb.enabled ? 'Active' : 'Required'} ok={fb.enabled} />
            <StatusRow label="Webhook status" value={fb.webhookStatus || 'pending'} ok={fb.webhookStatus === 'active'} />
            <StatusRow label="Last verified" value={fb.lastVerified ? new Date(fb.lastVerified).toLocaleString() : 'Never'} ok={!!fb.lastVerified} />
            <StatusRow label="Messenger receive" value={fb.enabled ? 'Enabled' : 'Disabled'} ok={fb.enabled} />
            <StatusRow label="Messenger send" value={fb.enabled ? 'Enabled' : 'Disabled'} ok={fb.enabled} />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">Setup requirements</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>A Facebook Page (Business/Creator) you manage</li>
              <li>Page Access Token with scopes: pages_messaging, pages_manage_metadata, pages_manage_engagement, pages_read_engagement</li>
              <li>Webhook URL: <code className="text-[10px] bg-white dark:bg-slate-900 px-1 rounded">/api/webhooks/meta</code> — subscribe fields <code className="text-[10px]">messages</code>, <code className="text-[10px]">feed</code></li>
            </ul>
          </div>

          {/* Manual connect — paste a Page ID + Page Access Token. */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              Connect manually (Page ID + Access Token)
              <ChevronDown className={`w-4 h-4 ml-auto text-slate-400 transition-transform ${manualOpen ? 'rotate-180' : ''}`} />
            </button>
            {manualOpen && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Page ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.pageId}
                    onChange={(e) => setForm((f) => ({ ...f, pageId: e.target.value }))}
                    placeholder="e.g. 1078xxxxxxxxxxx"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">The Facebook Page ID — webhook events (entry.id) match on this.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Page Access Token <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={form.accessToken}
                    onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                    placeholder="EAAG… (long-lived Page token)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    autoComplete="off"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Stored encrypted at rest. Used server-side only to send replies.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Page name <span className="text-slate-400">(optional)</span></label>
                  <input
                    type="text"
                    value={form.pageName}
                    onChange={(e) => setForm((f) => ({ ...f, pageName: e.target.value }))}
                    placeholder="Your Page name"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {fb.enabled ? 'Update credentials' : 'Connect Facebook'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {fb.enabled && (
              <button type="button" onClick={handleDisconnect} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                <Unplug className="w-4 h-4" /> Disconnect
              </button>
            )}
            <a href="https://developers.facebook.com/docs/messenger-platform" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <ExternalLink className="w-4 h-4" /> Meta docs
            </a>
          </div>

          <ChannelCommentAutomations
            channel="facebook"
            key={fb.enabled ? 'connected' : 'disconnected'}
            initialRules={fb.commentAutomations || []}
            connected={!!fb.enabled}
            aiReplyEnabled={!!fb.aiReplyEnabled}
            commentLeadMode={fb.commentLeadMode}
            safety={fb.safety}
          />
        </>
      )}
    </div>
  );
}
