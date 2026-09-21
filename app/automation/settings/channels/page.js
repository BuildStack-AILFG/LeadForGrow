'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, MessageSquare, Send,
  Zap, ArrowRight, Plug, Workflow, Sparkles,
} from 'lucide-react';
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from '@/app/automation/components/chat/BrandIcons';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

/** One On/Off pill for a feature row. */
function FeaturePill({ on }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${on ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
      {on ? 'On' : 'Off'}
    </span>
  );
}

function FeatureRow({ icon: Icon, label, on, note }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {note && <p className="text-[10px] text-slate-400 truncate">{note}</p>}
      </div>
      <FeaturePill on={on} />
    </div>
  );
}

/** AI toggle row — the central per-channel AI switch. */
function AiToggleRow({ channel, connected, on, saving, onToggle }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/10">
      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">AI replies</p>
        <p className="text-[10px] text-slate-400">
          {connected ? 'Context-aware DMs written by AI on this channel' : 'Connect this channel first'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={!connected || saving}
        onClick={() => onToggle(channel, !on)}
        className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-40 ${on ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function ChannelCard({ channel, onToggleAi, savingAi }) {
  const { key, name, subtitle, icon: Icon, iconClass, connected, href, features, accountLabel, ai } = channel;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white ${iconClass}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{name}</h3>
          <p className="text-[11px] text-slate-400 truncate">{connected && accountLabel ? accountLabel : subtitle}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:text-slate-400 dark:bg-slate-800'}`}>
          {connected ? <><CheckCircle2 className="w-3 h-3" /> Connected</> : 'Not connected'}
        </span>
      </div>

      <div className="px-4 py-2">
        {features.map((f) => (
          <FeatureRow key={f.label} icon={f.icon} label={f.label} on={f.on} note={f.note} />
        ))}
      </div>

      {ai && (
        <AiToggleRow
          channel={key}
          connected={connected}
          on={ai.on}
          saving={savingAi === key}
          onToggle={onToggleAi}
        />
      )}

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <Link
          href={href}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700"
        >
          {connected ? <>Manage <ArrowRight className="w-3.5 h-3.5" /></> : <><Plug className="w-3.5 h-3.5" /> Connect</>}
        </Link>
      </div>
    </div>
  );
}

export default function ChannelsHubPage() {
  const [loading, setLoading] = useState(true);
  const [wa, setWa] = useState({});
  const [ig, setIg] = useState({});
  const [fb, setFb] = useState({});
  const [savingAi, setSavingAi] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [waRes, igRes, fbRes] = await Promise.all([
        authFetch('/api/business/settings/whatsapp-status').then((r) => r.json()).catch(() => ({})),
        authFetch('/api/business/settings/instagram-status').then((r) => r.json()).catch(() => ({})),
        authFetch('/api/business/settings/facebook-status').then((r) => r.json()).catch(() => ({})),
      ]);
      setWa(waRes?.data?.whatsapp || {});
      setIg(igRes?.data?.instagram || {});
      setFb(fbRes?.data?.facebook || {});
    } catch {
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Central per-channel AI switch — flips integrationCredentials.<channel>.aiReplyEnabled.
  const toggleAi = async (channel, next) => {
    const endpoint = channel === 'instagram'
      ? '/api/business/settings/instagram-status'
      : '/api/business/settings/facebook-status';
    setSavingAi(channel);
    // optimistic
    if (channel === 'instagram') setIg((s) => ({ ...s, aiReplyEnabled: next }));
    else setFb((s) => ({ ...s, aiReplyEnabled: next }));
    try {
      const res = await authFetch(endpoint, { method: 'PATCH', body: JSON.stringify({ aiReplyEnabled: next }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`AI replies ${next ? 'on' : 'off'} for ${channel === 'instagram' ? 'Instagram' : 'Facebook'}`);
    } catch (e) {
      // revert
      if (channel === 'instagram') setIg((s) => ({ ...s, aiReplyEnabled: !next }));
      else setFb((s) => ({ ...s, aiReplyEnabled: !next }));
      toast.error(e.message || 'Failed to update');
    } finally {
      setSavingAi(null);
    }
  };

  const igRulesOn = (ig.commentAutomations || []).some((r) => r.enabled !== false);
  const fbRulesOn = (fb.commentAutomations || []).some((r) => r.enabled !== false);
  const igRuleCount = (ig.commentAutomations || []).filter((r) => r.enabled !== false).length;
  const fbRuleCount = (fb.commentAutomations || []).filter((r) => r.enabled !== false).length;

  const channels = [
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      subtitle: 'Business Cloud API',
      accountLabel: wa.displayNumber ? `+${wa.displayNumber}` : 'Connected',
      icon: WhatsAppIcon,
      iconClass: 'bg-emerald-500',
      connected: !!wa.enabled,
      href: '/automation/settings/whatsapp',
      features: [
        { icon: MessageSquare, label: 'Two-way messaging', on: !!wa.enabled },
        { icon: Workflow, label: 'Flow automation', on: !!wa.enabled, note: 'Build flows in Flow Builder' },
      ],
      ai: null, // WhatsApp AI runs via the Flow Builder's AI node, not this switch
    },
    {
      key: 'instagram',
      name: 'Instagram',
      subtitle: 'Direct + comments',
      accountLabel: ig.username ? `@${ig.username}` : 'Connected',
      icon: InstagramIcon,
      iconClass: 'bg-gradient-to-br from-pink-500 to-purple-600',
      connected: !!ig.enabled,
      href: '/automation/settings/instagram',
      features: [
        { icon: Send, label: 'DM auto-reply (flows)', on: !!ig.enabled, note: 'Instagram DM flows' },
        { icon: Zap, label: 'Comment auto-reply', on: !!ig.enabled && igRulesOn, note: igRuleCount ? `${igRuleCount} active rule${igRuleCount > 1 ? 's' : ''}` : 'No rules yet' },
      ],
      ai: { on: !!ig.aiReplyEnabled },
    },
    {
      key: 'facebook',
      name: 'Facebook',
      subtitle: 'Messenger + comments',
      accountLabel: fb.pageName || 'Connected',
      icon: FacebookIcon,
      iconClass: 'bg-blue-600',
      connected: !!fb.enabled,
      href: '/automation/settings/facebook',
      features: [
        { icon: Send, label: 'Messenger auto-reply (flows)', on: !!fb.enabled, note: 'Messenger flows' },
        { icon: Zap, label: 'Comment auto-reply', on: !!fb.enabled && fbRulesOn, note: fbRuleCount ? `${fbRuleCount} active rule${fbRuleCount > 1 ? 's' : ''}` : 'No rules yet' },
      ],
      ai: { on: !!fb.aiReplyEnabled },
    },
  ];

  const connectedCount = channels.filter((c) => c.connected).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Channels</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Every messaging channel in one place. Turn on exactly what you need — connect a channel, flip AI replies per channel, and manage its automations.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-400">Loading channels…</div>
      ) : (
        <>
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {connectedCount} of {channels.length} channels connected
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {channels.map((c) => (
              <ChannelCard key={c.key} channel={c} onToggleAi={toggleAi} savingAi={savingAi} />
            ))}
          </div>

          <div className="flex gap-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <b>AI replies, per channel:</b> flip the switch on any channel to make its auto-reply DMs context-aware (AI reads each message + your{' '}
              <Link href="/automation/ai/knowledge" className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2">Knowledge Base</Link>).
              Off = fixed replies with wording variation. You can still override a single rule on the channel&apos;s page.
            </span>
          </div>

          <div className="flex gap-2 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <Workflow className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>
              <b>Tip:</b> DM &amp; Messenger auto-replies are powered by the{' '}
              <Link href="/automation/whatsapp-flows" className="text-teal-700 dark:text-teal-400 font-medium underline underline-offset-2">Flow Builder</Link>
              {' '}— pick the channel when you create a flow. Comment auto-replies are keyword rules on each channel&apos;s page.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
