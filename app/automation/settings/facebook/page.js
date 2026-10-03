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
import WebhookUrlField from '@/app/automation/components/settings/WebhookUrlField';
import { SHARED_WEBHOOK_PATH } from '@/lib/meta/webhookUrls';

function StatusRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line dark:border-slate-800 last:border-0">
      <span className="text-sm text-fg-secondary dark:text-fg-tertiary">{label}</span>
      <span className={`text-sm font-medium flex items-center gap-1.5 ${ok ? 'text-accent-fg dark:text-accent-fg' : 'text-warning dark:text-amber-400'}`}>
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
  const [form, setForm] = useState({ pageId: '', accessToken: '', pageName: '', appSecret: '' });

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
        setForm({ pageId: '', accessToken: '', pageName: '', appSecret: '' });
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
        <Link href="/automation/settings/integrations" className="p-2 rounded-lg hover:bg-muted dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-page font-semibold text-fg">Facebook Page</h1>
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">Messenger DMs + post comment automation</p>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-canvas border border-line dark:bg-blue-950/30 flex items-center justify-center">
                <FacebookIcon className="w-5 h-5 text-fg-secondary dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-fg dark:text-slate-50">{fb.pageName || 'Not connected'}</p>
                <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">Page ID: {fb.pageId || '—'}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${fb.enabled ? 'bg-info-subtle dark:bg-blue-900/30 text-info dark:text-blue-300' : 'bg-muted dark:bg-slate-800 text-fg-tertiary dark:text-fg-tertiary'}`}>
                {fb.enabled ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <StatusRow label="Authorization" value={fb.enabled ? 'Active' : 'Required'} ok={fb.enabled} />
            <StatusRow label="Webhook status" value={fb.webhookStatus || 'pending'} ok={fb.webhookStatus === 'active'} />
            <StatusRow
              label="Message verification"
              value={fb.hasAppSecret || fb.platformAppSecret ? 'Secured' : 'App secret needed'}
              ok={!!(fb.hasAppSecret || fb.platformAppSecret)}
            />
            <StatusRow label="Last verified" value={fb.lastVerified ? new Date(fb.lastVerified).toLocaleString() : 'Never'} ok={!!fb.lastVerified} />
            <StatusRow label="Messenger receive" value={fb.enabled ? 'Enabled' : 'Disabled'} ok={fb.enabled} />
            <StatusRow label="Messenger send" value={fb.enabled ? 'Enabled' : 'Disabled'} ok={fb.enabled} />
          </div>

          <div className="bg-subtle dark:bg-slate-800/50 rounded-lg p-4 text-xs text-fg-secondary dark:text-fg-tertiary">
            <p className="font-medium text-fg dark:text-slate-200 mb-1">Setup requirements</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>A Facebook Page (Business/Creator) you manage</li>
              <li>Page Access Token with scopes: pages_messaging, pages_manage_metadata, pages_manage_engagement, pages_read_engagement</li>
            </ul>
            <div className="mt-3">
              <WebhookUrlField path={SHARED_WEBHOOK_PATH} label="Webhook Callback URL">
                <p className="text-meta">Paste it in Meta → Webhooks → Page, and subscribe to <code className="text-meta">messages</code> and <code className="text-meta">feed</code>. Verify token: the <code className="text-meta">META_VERIFY_TOKEN</code> value set on the server.</p>
              </WebhookUrlField>
            </div>
          </div>

          {/* Manual connect — paste a Page ID + Page Access Token. */}
          <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setManualOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-fg dark:text-slate-200 hover:bg-subtle dark:hover:bg-slate-800/50"
            >
              <KeyRound className="w-4 h-4 text-fg-tertiary dark:text-fg-tertiary" />
              Connect manually (Page ID + Access Token)
              <ChevronDown className={`w-4 h-4 ml-auto text-fg-tertiary transition-transform ${manualOpen ? 'rotate-180' : ''}`} />
            </button>
            {manualOpen && (
              <div className="px-5 pb-5 pt-1 space-y-3 border-t border-line dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Page ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={form.pageId}
                    onChange={(e) => setForm((f) => ({ ...f, pageId: e.target.value }))}
                    placeholder="e.g. 1078xxxxxxxxxxx"
                    className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                  <p className="text-meta text-fg-tertiary mt-1">The Facebook Page ID — webhook events (entry.id) match on this.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Page Access Token <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    value={form.accessToken}
                    onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                    placeholder="EAAG… (long-lived Page token)"
                    className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    autoComplete="off"
                  />
                  <p className="text-meta text-fg-tertiary mt-1">Stored encrypted at rest. Used server-side only to send replies.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Page name <span className="text-fg-tertiary">(optional)</span></label>
                  <input
                    type="text"
                    value={form.pageName}
                    onChange={(e) => setForm((f) => ({ ...f, pageName: e.target.value }))}
                    placeholder="Your Page name"
                    className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">
                    Meta App Secret {!(fb.hasAppSecret || fb.platformAppSecret) && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="password"
                    value={form.appSecret}
                    onChange={(e) => setForm((f) => ({ ...f, appSecret: e.target.value }))}
                    placeholder={fb.hasAppSecret ? 'Saved. Leave blank to keep it' : 'Paste the Meta app secret'}
                    className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    autoComplete="off"
                  />
                  <p className="text-meta text-fg-tertiary mt-1">
                    Meta → your app → App settings → Basic → <b>App secret</b>. We use it only to confirm incoming
                    Messenger messages and comments really come from Meta. Without it, they are rejected.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-info text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {fb.enabled ? 'Update credentials' : 'Connect Facebook'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {fb.enabled && (
              <button type="button" onClick={handleDisconnect} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-danger dark:text-red-400 border border-danger/30 dark:border-red-800 rounded-lg hover:bg-danger-subtle dark:hover:bg-red-950/30">
                <Unplug className="w-4 h-4" /> Disconnect
              </button>
            )}
            <a href="https://developers.facebook.com/docs/messenger-platform" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-fg-secondary dark:text-fg-disabled border border-line dark:border-slate-700 rounded-md hover:bg-subtle dark:hover:bg-slate-800/50">
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
