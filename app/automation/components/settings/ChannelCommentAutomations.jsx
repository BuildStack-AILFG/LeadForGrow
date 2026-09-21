'use client';

import { useState } from 'react';
import { Plus, Trash2, MessageSquare, Send, Zap, X, Info, Save, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/app/components/ConfirmProvider';
import PostScopeField from './PostScopeField';
import WarningNote from '@/app/components/ui/WarningNote';

/**
 * Shared keyword comment-automation UI for any social channel (Instagram,
 * Facebook, …). Channel-specific bits — accent colour, API endpoint, labels —
 * come from CHANNEL_CONFIG below, so there's one implementation instead of a
 * near-identical copy per channel.
 */
const CHANNEL_CONFIG = {
  instagram: {
    name: 'Instagram',
    endpoint: '/api/business/settings/instagram-status',
    dmLabel: 'Send them a DM',
    dmExtraNote: null,
    publicPlaceholder: 'e.g. Just sent you a DM! 📩',
    postNoun: 'post or reel',
    intro: 'Auto-reply to comments and DM the commenter when they use a keyword.',
    howItWorks: 'on a post or reel',
    accent: {
      scopeActive: 'border-pink-400 bg-pink-50/60 dark:bg-pink-950/20 ring-1 ring-pink-100 dark:ring-pink-900/50',
      keywordFocus: 'focus-within:border-pink-400 focus-within:ring-1 focus-within:ring-pink-100 dark:focus-within:ring-pink-900/50',
      chip: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300',
      chipRemoveHover: 'hover:bg-pink-100 dark:hover:bg-pink-900',
      radio: 'accent-pink-500',
      inputFocus: 'focus:border-pink-400',
      zap: 'text-pink-500',
      infoBox: 'bg-pink-50/60 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/40',
      infoIcon: 'text-pink-500',
      saveBtn: 'bg-pink-600 hover:bg-pink-700',
    },
  },
  facebook: {
    name: 'Facebook',
    endpoint: '/api/business/settings/facebook-status',
    dmLabel: 'Send them a private message',
    dmExtraNote: 'Facebook allows one private reply per comment, sent from your Page inbox.',
    publicPlaceholder: 'e.g. Just sent you a message! 📩',
    postNoun: 'post',
    intro: 'Auto-reply to Page post comments and privately message the commenter on a keyword.',
    howItWorks: 'on a Page post',
    accent: {
      scopeActive: 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/20 ring-1 ring-blue-100 dark:ring-blue-900/50',
      keywordFocus: 'focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/50',
      chip: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      chipRemoveHover: 'hover:bg-blue-100 dark:hover:bg-blue-900',
      radio: 'accent-blue-500',
      inputFocus: 'focus:border-blue-400',
      zap: 'text-blue-500',
      infoBox: 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40',
      infoIcon: 'text-blue-500',
      saveBtn: 'bg-blue-600 hover:bg-blue-700',
    },
  },
};

const MODE_OPTIONS = [
  { id: 'auto', label: 'Channel default' },
  { id: 'ai', label: 'AI' },
  { id: 'static', label: 'Fixed' },
];

function newRule() {
  return {
    id: `car_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    keywords: [],
    matchType: 'contains',
    scope: 'all',
    mediaId: '',
    mediaThumb: '',
    mediaCaption: '',
    mediaPermalink: '',
    publicReply: '',
    dmMessage: '',
    replyMode: 'auto',
    aiInstruction: '',
    enabled: true,
    triggeredCount: 0,
  };
}

function VariationHint() {
  return (
    <p className="text-[11px] text-slate-400 mt-1">
      Tip: vary the wording so it isn&apos;t identical spam — use <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{Hi|Hey|Hello}'}</code> for options, or separate full versions with <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">|||</code>.
    </p>
  );
}

function KeywordInput({ value = [], onChange, accent }) {
  const [draft, setDraft] = useState('');
  const commit = (raw) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((p) => { if (!next.some((k) => k.toLowerCase() === p.toLowerCase())) next.push(p); });
    onChange(next);
    setDraft('');
  };
  return (
    <div className={`flex flex-wrap items-center gap-1.5 w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg ${accent.keywordFocus}`}>
      {value.map((kw, i) => (
        <span key={`${kw}-${i}`} className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs border ${accent.chip}`}>
          {kw}
          <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className={`rounded p-0.5 ${accent.chipRemoveHover}`}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); commit(draft); }
          else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={value.length ? '' : 'e.g. price, link, info'}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-xs py-0.5 placeholder:text-slate-400"
      />
    </div>
  );
}

function RuleCard({ rule, onChange, onDelete, cfg, channel }) {
  const set = (patch) => onChange({ ...rule, ...patch });
  const { accent } = cfg;
  const mode = rule.replyMode || 'auto';
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <input
          value={rule.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Automation name (optional)"
          className="flex-1 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 placeholder:font-normal"
        />
        {rule.triggeredCount > 0 && (
          <span className="text-[10px] font-medium text-slate-400 tabular-nums">Fired {rule.triggeredCount}×</span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={rule.enabled}
          onClick={() => set({ enabled: !rule.enabled })}
          className={`relative w-9 h-5 rounded-full transition-colors ${rule.enabled ? accent.saveBtn.split(' ')[0] : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-transform ${rule.enabled ? 'translate-x-4' : ''}`} />
        </button>
        <button type="button" onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <Zap className={`w-3.5 h-3.5 ${accent.zap}`} /> When someone comments
          </label>
          <KeywordInput value={rule.keywords} onChange={(keywords) => set({ keywords })} accent={accent} />
          <div className="flex items-center gap-3 mt-2">
            <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <input type="radio" checked={rule.matchType === 'contains'} onChange={() => set({ matchType: 'contains' })} className={accent.radio} />
              Comment contains keyword
            </label>
            <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <input type="radio" checked={rule.matchType === 'exact'} onChange={() => set({ matchType: 'exact' })} className={accent.radio} />
              Exact match
            </label>
          </div>
        </div>

        <PostScopeField rule={rule} set={set} channel={channel} cfg={cfg} />

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Reply publicly under the comment <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={rule.publicReply}
            onChange={(e) => set({ publicReply: e.target.value })}
            rows={2}
            placeholder={cfg.publicPlaceholder}
            className={`w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 outline-none resize-none ${accent.inputFocus}`}
          />
          <VariationHint />
        </div>

        {/* Private message / DM — reply mode follows the channel by default */}
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Send className="w-3.5 h-3.5 text-blue-500" /> {cfg.dmLabel}
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
              {MODE_OPTIONS.map((opt) => {
                const active = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => set({ replyMode: opt.id })}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md inline-flex items-center gap-1 ${active ? (opt.id === 'ai' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-slate-100') : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {opt.id === 'ai' && <Sparkles className="w-3 h-3" />}{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === 'auto' && (
            <p className="text-[11px] text-slate-400 mb-1.5">Follows the channel&apos;s AI switch (above). Fill in both — the right one is used automatically.</p>
          )}

          {mode !== 'static' && (
            <div className="mb-2">
              <label className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> AI guidance {mode === 'auto' && <span className="text-slate-400 font-normal">(when AI is on)</span>}</label>
              <textarea
                value={rule.aiInstruction}
                onChange={(e) => set({ aiInstruction: e.target.value })}
                rows={2}
                placeholder="e.g. 'Answer their question, be friendly, share the booking link.'"
                className="w-full px-3 py-2 text-xs border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 outline-none focus:border-indigo-400 resize-none"
              />
            </div>
          )}

          {mode !== 'ai' && (
            <div>
              <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">Fixed reply {mode === 'auto' && <span className="text-slate-400">(when AI is off)</span>}</label>
              <textarea
                value={rule.dmMessage}
                onChange={(e) => set({ dmMessage: e.target.value })}
                rows={2}
                placeholder="e.g. Hey! Here's the link you asked for: https://…"
                className={`w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 outline-none resize-none ${accent.inputFocus}`}
              />
              <VariationHint />
            </div>
          )}
          {cfg.dmExtraNote && <p className="text-[11px] text-slate-400 mt-1">{cfg.dmExtraNote}</p>}
        </div>
      </div>
    </div>
  );
}

const LEAD_MODES = [
  { id: 'matched', label: 'Only comments that trigger an automation', hint: 'Recommended — keeps spam and random comments out of your leads.' },
  { id: 'all', label: 'Every comment', hint: 'Anyone who comments becomes a lead and you get a notification.' },
];

/**
 * Ban-safety status: a red banner while the platform has blocked messaging (automation is
 * paused), an amber one when the connection needs attention, else a one-line explainer of
 * the warm-up limits so a client understands why a new automation starts slowly.
 */
function SafetyNotice({ safety, cfg }) {
  if (!safety) return null;
  const fmt = (d) => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  if (safety.blocked) {
    return (
      <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-3">
        <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
          <p className="font-semibold">{cfg.name} has temporarily limited messaging on this account</p>
          <p className="mt-0.5">Automated replies are <b>paused until {fmt(safety.blockedUntil)}</b> so we don&apos;t make the restriction last longer.
            They will restart slowly afterwards. You can also check <b>Account Status</b> in the {cfg.name} app.</p>
        </div>
      </div>
    );
  }

  if (safety.issue && ['token_expired', 'permission'].includes(safety.issue.kind)) {
    return (
      <div className="flex gap-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <b>{cfg.name} needs to be reconnected.</b> {safety.issue.message}
        </p>
      </div>
    );
  }

  const { dm, reply } = safety.limits || {};
  return (
    <div className="flex gap-2.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        <p>
          <b className="text-slate-700 dark:text-slate-300">Account safety:</b> new automations start slowly so {cfg.name} doesn&apos;t flag your account.
          Right now (day {safety.warmupDay}): up to <b>{dm?.hour}</b> messages/hour and <b>{reply?.hour}</b> public replies/hour. Limits rise on their own over about 2 weeks.
        </p>
        {safety.heldBackToday > 0 && (
          <p className="mt-1 text-amber-700 dark:text-amber-300">{safety.heldBackToday} repl{safety.heldBackToday === 1 ? 'y was' : 'ies were'} held back today by this limit.</p>
        )}
      </div>
    </div>
  );
}

export default function ChannelCommentAutomations({ channel, initialRules = [], connected, aiReplyEnabled = false, commentLeadMode = 'matched', safety = null }) {
  const cfg = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.instagram;
  const { accent } = cfg;
  const confirm = useConfirm();
  const [rules, setRules] = useState(initialRules.length ? initialRules : []);
  const [saving, setSaving] = useState(false);
  const [aiOn, setAiOn] = useState(!!aiReplyEnabled);
  const [savingAi, setSavingAi] = useState(false);
  const [leadMode, setLeadMode] = useState(commentLeadMode === 'all' ? 'all' : 'matched');
  const [savingMode, setSavingMode] = useState(false);

  const changeLeadMode = async (next) => {
    if (next === leadMode || savingMode) return;
    const prev = leadMode;
    setLeadMode(next);
    setSavingMode(true);
    try {
      const res = await authFetch(cfg.endpoint, { method: 'PATCH', body: JSON.stringify({ commentLeadMode: next }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(next === 'all' ? 'Every comment will now become a lead' : 'Only matching comments will become leads');
    } catch (e) {
      setLeadMode(prev);
      toast.error(e.message || 'Failed to update');
    } finally {
      setSavingMode(false);
    }
  };

  const toggleAi = async () => {
    const next = !aiOn;
    setAiOn(next);
    setSavingAi(true);
    try {
      const res = await authFetch(cfg.endpoint, { method: 'PATCH', body: JSON.stringify({ aiReplyEnabled: next }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`AI replies ${next ? 'on' : 'off'} for ${cfg.name}`);
    } catch (e) {
      setAiOn(!next);
      toast.error(e.message || 'Failed to update');
    } finally {
      setSavingAi(false);
    }
  };

  const updateRule = (idx, next) => setRules((rs) => rs.map((r, i) => (i === idx ? next : r)));
  const removeRule = async (idx) => {
    if (!(await confirm({ title: 'Delete automation', message: 'Delete this comment automation?', confirmLabel: 'Delete', danger: true }))) return;
    setRules((rs) => rs.filter((_, i) => i !== idx));
  };

  const save = async () => {
    for (const r of rules) {
      if (!r.keywords.length) { toast.error('Each automation needs at least one keyword'); return; }
      if (r.scope === 'specific' && !r.mediaId) { toast.error(`Choose which ${cfg.postNoun} to use, or pick “Any ${cfg.postNoun}”`); return; }
      const mode = r.replyMode || 'auto';
      const hasAction = r.publicReply.trim() || r.dmMessage.trim() || mode !== 'static';
      if (!hasAction) { toast.error('Add a public reply, a fixed message, or use AI for each automation'); return; }
    }
    setSaving(true);
    try {
      const res = await authFetch(cfg.endpoint, { method: 'PATCH', body: JSON.stringify({ commentAutomations: rules }) });
      const data = await res.json();
      if (data.success) { toast.success('Automations saved'); setRules(data.data.commentAutomations || rules); }
      else toast.error(data.error || 'Failed to save');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Zap className={`w-4 h-4 ${accent.zap}`} /> Comment automations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cfg.intro}</p>
        </div>
        <button
          type="button"
          onClick={() => setRules((rs) => [...rs, newRule()])}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add automation
        </button>
      </div>

      {/* Channel-level AI switch — the central control. */}
      <div className="flex items-center gap-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 px-3 py-2.5">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">AI replies for {cfg.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">On = AI writes a unique reply per comment (rules set to “Channel default”). Off = fixed text.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={aiOn}
          disabled={savingAi}
          onClick={toggleAi}
          className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 shrink-0 ${aiOn ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 transition-transform ${aiOn ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <SafetyNotice safety={safety} cfg={cfg} />

      {/* Which comments become leads — channel-level, saves immediately. */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Create a lead from</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {LEAD_MODES.map((m) => {
            const active = leadMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={savingMode}
                onClick={() => changeLeadMode(m.id)}
                className={`text-left rounded-lg border p-2.5 transition-colors disabled:opacity-60 ${active ? accent.scopeActive : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{m.label}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{m.hint}</span>
              </button>
            );
          })}
        </div>
        {leadMode === 'matched' && (
          <p className="text-[11px] text-slate-400 mt-2">Other comments stay on {cfg.name} only — they aren&apos;t added to your inbox or leads.</p>
        )}
      </div>

      <div className={`flex gap-2 rounded-lg border p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 ${accent.infoBox}`}>
        <Info className={`w-4 h-4 shrink-0 mt-0.5 ${accent.infoIcon}`} />
        <span>
          <b>How it works:</b> Someone comments your keyword (e.g. <b>“price”</b>) {cfg.howItWorks} →
          LeadForGrow instantly posts your public reply under their comment <i>and/or</i> messages them.
          Works on any {cfg.postNoun}, one {cfg.postNoun} you pick, or just your next one.
        </span>
      </div>

      {!connected && (
        <WarningNote>
          Connect {cfg.name} above first. Automations only run once your account is connected.
        </WarningNote>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">
          No automations yet. Click <b>Add automation</b> to create your first keyword auto-reply.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onChange={(next) => updateRule(idx, next)}
              onDelete={() => removeRule(idx)}
              cfg={cfg}
              channel={channel}
            />
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${accent.saveBtn}`}
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save automations'}
          </button>
        </div>
      )}
    </div>
  );
}
