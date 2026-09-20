'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Unplug, ExternalLink, KeyRound, ChevronDown,
} from 'lucide-react';
import { InstagramIcon } from '@/app/automation/components/chat/BrandIcons';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/app/components/ConfirmProvider';
import ChannelCommentAutomations from '@/app/automation/components/settings/ChannelCommentAutomations';
import WebhookUrlField from '@/app/automation/components/settings/WebhookUrlField';
import { SHARED_WEBHOOK_PATH } from '@/lib/meta/webhookUrls';

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

/**
 * Real check of which events Meta will actually deliver for this account. The
 * dashboard toggle alone isn't enough: each account must be subscribed too, or
 * DMs can work while comments never arrive.
 */
function WebhookEvents({ connected }) {
  const [state, setState] = useState({ loading: true, fields: [], error: '', required: ['comments', 'messages'] });
  const [enabling, setEnabling] = useState(false);

  const load = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await authFetch('/api/business/settings/instagram-webhooks');
      const data = await res.json();
      setState({ loading: false, fields: data.data?.fields || [], error: data.data?.success === false ? data.data.error : '', required: data.data?.required || ['comments', 'messages'] });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Could not check Meta' }));
    }
  };
  useEffect(() => { if (connected) load(); }, [connected]);

  const enable = async () => {
    setEnabling(true);
    try {
      const res = await authFetch('/api/business/settings/instagram-webhooks', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Comment and message events enabled');
        setState((s) => ({ ...s, fields: data.data?.fields || s.fields, error: '' }));
      } else {
        toast.error(data.error || 'Meta rejected the request');
        setState((s) => ({ ...s, error: data.error || '' }));
      }
    } catch {
      toast.error('Failed to enable');
    } finally {
      setEnabling(false);
    }
  };

  if (!connected) return null;
  const missing = state.required.filter((f) => !state.fields.includes(f));
  // If Meta wouldn't let us read the list, we can't claim anything is missing — just offer the button.
  const unknown = !!state.error && state.fields.length === 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Events from Instagram</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comments and DMs only reach LeadForGrow if this account is subscribed to them on Meta.</p>
        </div>
        <button type="button" onClick={load} title="Re-check" className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} /></button>
      </div>

      {!state.loading && !unknown && (
        <div className="mt-3 space-y-1">
          {state.required.map((f) => {
            const on = state.fields.includes(f);
            return <StatusRow key={f} label={f === 'comments' ? 'Comments on your posts' : 'Direct messages'} value={on ? 'Subscribed' : 'Not subscribed'} ok={on} />;
          })}
        </div>
      )}

      {state.error && <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-2">{unknown ? `Couldn't read the current subscription (${state.error}). You can still enable it below.` : state.error}</p>}

      {(missing.length > 0 || unknown) && !state.loading && (
        <button type="button" onClick={enable} disabled={enabling} className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50">
          {enabling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Enable comment &amp; message events
        </button>
      )}
    </div>
  );
}

export default function InstagramSettingsPage() {
  const confirm = useConfirm();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pageId: '', accessToken: '', username: '' });

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

  const handleManualSave = async () => {
    if (!form.pageId.trim() || !form.accessToken.trim()) {
      toast.error('Page ID and Access Token are required');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/business/settings/instagram-connect', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Instagram connected');
        setManualOpen(false);
        setForm({ pageId: '', accessToken: '', username: '' });
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
    if (!(await confirm({
      title: 'Disconnect Instagram',
      message: 'LeadForGrow will stop reading and replying on this Instagram account: DMs and comments will no longer reach your inbox and automations will stop. Your existing leads and conversations are kept, and you can keep using Instagram normally in the app. Your automation rules stay saved but stay off until you reconnect.',
      confirmLabel: 'Disconnect',
      danger: true,
    }))) return;
    const res = await authFetch('/api/business/settings/instagram-connect', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Instagram disconnected');
      if (data.webhook?.attempted && !data.webhook?.success) {
        toast('Meta could not be told to stop sending events. Nothing will be processed here, but you can also remove LeadForGrow under Instagram > Settings > Apps and websites.', { duration: 9000 });
      }
      load();
    } else toast.error(data.error || 'Failed');
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Meta Instagram Messaging API</p>
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
                <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center">
                  <InstagramIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">@{ig.username || 'Not connected'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Page ID: {ig.pageId || '—'}</p>
              </div>
              <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${ig.enabled ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {ig.enabled ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <StatusRow label="Authorization" value={ig.enabled ? 'Active' : 'Required'} ok={ig.enabled} />
            <StatusRow label="Webhook status" value={ig.webhookStatus || 'pending'} ok={ig.webhookStatus === 'active'} />
            <StatusRow label="Last sync" value={ig.lastSyncAt ? new Date(ig.lastSyncAt).toLocaleString() : 'Never'} ok={!!ig.lastSyncAt} />
            <StatusRow label="DM receive" value={ig.enabled ? 'Enabled' : 'Disabled'} ok={ig.enabled} />
            <StatusRow label="DM send" value={ig.enabled ? 'Enabled' : 'Disabled'} ok={ig.enabled} />
          </div>

          <WebhookEvents connected={!!ig.enabled} />

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">Setup requirements</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Meta Business account with Instagram Professional account</li>
              <li>Instagram connected to a Facebook Page</li>
            </ul>
            <div className="mt-3">
              <WebhookUrlField path={SHARED_WEBHOOK_PATH} label="Webhook Callback URL">
                <p className="text-[11px]">Paste it in Meta → Instagram → Webhooks. Verify token: the <code className="text-[10px]">META_VERIFY_TOKEN</code> value set on the server.</p>
              </WebhookUrlField>
            </div>
          </div>

          {/* Manual connect — paste a Page ID + Page Access Token. For when the
              Meta OAuth app isn't set up yet, and for testing. */}
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
                    placeholder="e.g. 17841400000000000"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">The Facebook Page ID linked to your Instagram — webhook events match on this.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Page Access Token <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={form.accessToken}
                    onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                    placeholder="EAAG… (long-lived Page token)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                    autoComplete="off"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Needs scopes: instagram_manage_messages, instagram_manage_comments. Used server-side only to send replies.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Username <span className="text-slate-400">(optional)</span></label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="your_ig_handle"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleManualSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {ig.enabled ? 'Update credentials' : 'Connect Instagram'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!ig.enabled ? (
              <button type="button" onClick={handleConnect} disabled={connecting} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                <InstagramIcon className="w-4 h-4" /> Connect with Meta
              </button>
            ) : (
              <>
                <button type="button" onClick={handleConnect} disabled={connecting} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} /> Reconnect
                </button>
                <button type="button" onClick={handleDisconnect} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Unplug className="w-4 h-4" /> Disconnect
                </button>
              </>
            )}
            <a href="https://developers.facebook.com/docs/messenger-platform/instagram" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <ExternalLink className="w-4 h-4" /> Meta docs
            </a>
          </div>

          <ChannelCommentAutomations
            channel="instagram"
            key={ig.enabled ? 'connected' : 'disconnected'}
            initialRules={ig.commentAutomations || []}
            connected={!!ig.enabled}
            aiReplyEnabled={!!ig.aiReplyEnabled}
            commentLeadMode={ig.commentLeadMode}
            safety={ig.safety}
          />
        </>
      )}
    </div>
  );
}
