'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, PenLine, Rocket, Loader2, MessageCircle, Send, Hash, MessagesSquare, Clock3, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import cx from '@/app/components/ui/cx';
import { authFetch } from '@/lib/apiClient';
import { InstagramIcon } from '@/app/automation/components/chat/BrandIcons';
import PhonePreview from './PhonePreview';
import { Step, Choice, KeywordInput, VariationsInput, TextArea, ToggleRow, PostScope } from './BuilderFields';
import { DM_COOLDOWN_OPTIONS } from '@/lib/automation/dmRules';

const NEW_COMMENT = {
  name: '', scope: 'specific', mediaId: '', mediaThumb: '', mediaCaption: '', mediaPermalink: '',
  matchType: 'contains', keywords: [], publicReply: 'Thanks! Check your DMs 📩 ||| Sent you a message! ||| Just DMed you 🙌',
  dmMessage: '', replyMode: 'static', aiInstruction: '', enabled: true,
};
const NEW_DM = {
  name: '', trigger: 'keyword', keywords: [], matchType: 'contains', replyMode: 'static',
  message: '', aiInstruction: '', cooldownMinutes: 720, enabled: true,
};

const AI_BADGE = (
  <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-gold-subtle px-1.5 py-px text-[10px] font-semibold text-gold-fg">
    <Sparkles className="h-2.5 w-2.5" /> AI
  </span>
);

function validate(kind, r) {
  if (kind === 'comment') {
    if (r.scope === 'specific' && !r.mediaId) return 'Choose the post or reel this applies to.';
    if (r.matchType !== 'any' && !r.keywords.length) return 'Add at least one keyword, or choose "Any comment".';
    if (!r.publicReplyOn && !r.dmOn) return 'Turn on a public reply or a DM.';
    if (r.dmOn && r.replyMode !== 'ai' && !r.dmMessage.trim()) return 'Write the DM, or let AI write it.';
    return null;
  }
  if (r.trigger === 'keyword' && !r.keywords.length) return 'Add at least one keyword, or choose "Any message".';
  if (r.replyMode === 'static' && !r.message.trim()) return 'Write the reply, or let AI write it.';
  return null;
}

export default function InstagramAutomationBuilder({ kind, id }) {
  const router = useRouter();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState({ connected: false, username: '', profilePicture: '', aiReplyEnabled: false });
  const [rule, setRule] = useState(null);
  const [focus, setFocus] = useState(1);
  const [tab, setTab] = useState('post');
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await authFetch('/api/automation/instagram-automations');
        const data = await res.json();
        if (!alive) return;
        if (!data.success) throw new Error(data.error);
        setAccount(data.data.account);
        if (isNew) {
          setRule(kind === 'comment' ? { ...NEW_COMMENT, publicReplyOn: true, dmOn: true } : { ...NEW_DM });
        } else {
          const found = (data.data[kind] || []).find((r) => r.id === id);
          if (!found) { toast.error('Automation not found'); router.replace('/automation/instagram-automation'); return; }
          setRule(kind === 'comment'
            ? { ...found, scope: found.scope || 'all', publicReplyOn: !!found.publicReply, dmOn: !!found.dmMessage || found.replyMode === 'ai' }
            : found);
        }
      } catch {
        toast.error('Could not load Instagram automations');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [kind, id, isNew, router]);

  const set = (patch) => setRule((r) => ({ ...r, ...patch }));
  const step = (n, previewTab) => () => { setFocus(n); if (previewTab) setTab(previewTab); };

  const defaultName = useMemo(() => {
    if (!rule) return '';
    const words = rule.keywords?.length ? rule.keywords.slice(0, 2).join(', ') : null;
    if (kind === 'comment') return words ? `Comment “${words}” → DM` : 'Any comment → DM';
    return words ? `DM “${words}” auto-reply` : 'Reply to every DM';
  }, [rule, kind]);

  const save = async (goLive) => {
    const err = validate(kind, rule);
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const payloadRule = kind === 'comment'
        ? {
            ...rule,
            name: rule.name || defaultName,
            publicReply: rule.publicReplyOn ? rule.publicReply.split('|||').map((s) => s.trim()).filter(Boolean).join(' ||| ') : '',
            dmMessage: rule.dmOn ? rule.dmMessage : '',
            replyMode: rule.dmOn ? rule.replyMode : 'static',
            enabled: goLive ? true : rule.enabled,
          }
        : { ...rule, name: rule.name || defaultName, enabled: goLive ? true : rule.enabled };
      const res = await authFetch('/api/automation/instagram-automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind, rule: payloadRule }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || 'Could not save'); return; }
      toast.success(goLive ? 'Live on Instagram' : 'Saved');
      if (isNew) router.replace(`/automation/instagram-automation/${data.data.savedId}?type=${kind}`);
      else set({ enabled: payloadRule.enabled, name: payloadRule.name });
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !rule) {
    return <div className="flex h-[calc(100vh-48px)] items-center justify-center lg:h-screen"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>;
  }

  const live = !isNew && rule.enabled;

  return (
    <div className="flex h-[calc(100vh-48px)] min-h-[640px] flex-col bg-subtle lg:h-screen">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4">
        <Link href="/automation/instagram-automation" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-fg-secondary hover:bg-subtle hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Instagram automations</span>
        </Link>
        <span className="h-5 w-px bg-line" />
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#F9CE34_0%,#EE2A7B_50%,#6228D7_100%)] text-white">
          <InstagramIcon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              value={rule.name}
              placeholder={defaultName}
              onChange={(e) => set({ name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              maxLength={120}
              className="w-full max-w-md rounded-md border border-brand px-2 py-1 text-[14px] font-semibold text-fg outline-none ring-2 ring-brand/15"
            />
          ) : (
            <button type="button" onClick={() => setEditingName(true)} className="group flex max-w-full items-center gap-1.5 truncate text-left text-[14px] font-semibold text-fg">
              <span className="truncate">{rule.name || defaultName}</span>
              <PenLine className="h-3.5 w-3.5 shrink-0 text-fg-tertiary opacity-60 group-hover:opacity-100" />
            </button>
          )}
          <p className="text-[11.5px] text-fg-tertiary">{kind === 'comment' ? 'Comment to DM' : 'DM auto-reply'}</p>
        </div>
        <span className={cx('hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium sm:inline-flex', live ? 'bg-success-subtle text-success' : 'bg-muted text-fg-secondary')}>
          <span className={cx('h-1.5 w-1.5 rounded-full', live ? 'bg-success' : 'bg-fg-tertiary')} />
          {live ? 'Live' : isNew ? 'New' : 'Paused'}
        </span>
        <button type="button" disabled={saving} onClick={() => save(false)} className="h-8 rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-fg hover:bg-subtle disabled:opacity-60">
          Save
        </button>
        <button type="button" disabled={saving} onClick={() => save(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
          {live ? 'Update' : 'Go live'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left: settings */}
        <aside className="order-2 w-full shrink-0 overflow-y-auto border-line bg-subtle p-4 lg:order-1 lg:w-[420px] lg:border-r">
          {!account.connected && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-subtle p-3 text-[12.5px] text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Instagram isn&apos;t connected, so this won&apos;t run yet. <Link href="/automation/settings/instagram" className="font-semibold underline">Connect Instagram</Link></span>
            </div>
          )}

          <div className="space-y-3">
            {kind === 'comment' ? (
              <>
                <Step n={1} title="When someone comments on" active={focus === 1} onFocus={step(1, 'post')}>
                  <PostScope rule={rule} set={set} />
                </Step>

                <Step n={2} title="And the comment has" active={focus === 2} onFocus={step(2, 'comments')}>
                  <Choice checked={rule.matchType !== 'any'} onSelect={() => set({ matchType: rule.matchType === 'exact' ? 'exact' : 'contains' })} icon={Hash} label="Specific words" />
                  {rule.matchType !== 'any' && (
                    <div className="pl-1">
                      <KeywordInput value={rule.keywords} onChange={(keywords) => set({ keywords })} examples={['Price', 'Link', 'Details']} />
                      <label className="mt-2 flex items-center gap-2 text-[12px] text-fg-secondary">
                        <input type="checkbox" checked={rule.matchType === 'exact'} onChange={(e) => set({ matchType: e.target.checked ? 'exact' : 'contains' })} className="accent-[#1D4B3E]" />
                        Only when the comment is exactly the word
                      </label>
                    </div>
                  )}
                  <Choice checked={rule.matchType === 'any'} onSelect={() => set({ matchType: 'any' })} icon={MessagesSquare} label="Any comment" desc="Every comment on the post triggers it." />
                </Step>

                <Step n={3} title="Reply under the comment" hint="A short public reply tells others the commenter got a DM." active={focus === 3} onFocus={step(3, 'comments')}>
                  <ToggleRow label="Reply publicly" checked={rule.publicReplyOn} onChange={(v) => set({ publicReplyOn: v })} />
                  {rule.publicReplyOn && (
                    <VariationsInput value={rule.publicReply} onChange={(publicReply) => set({ publicReply })} placeholders={['Thanks! Check your DMs 📩', 'Sent you a message!', 'Just DMed you 🙌']} />
                  )}
                </Step>

                <Step n={4} title="They will get a DM" hint="Sent privately to the person who commented." active={focus === 4} onFocus={step(4, 'dm')}>
                  <ToggleRow label="Send a DM" checked={rule.dmOn} onChange={(v) => set({ dmOn: v })} />
                  {rule.dmOn && (
                    <>
                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="DM type">
                        <Choice checked={rule.replyMode !== 'ai'} onSelect={() => set({ replyMode: 'static' })} icon={Send} label="Fixed message" />
                        <Choice checked={rule.replyMode === 'ai'} onSelect={() => set({ replyMode: 'ai' })} icon={Sparkles} label="AI writes it" />
                      </div>
                      {rule.replyMode === 'ai' ? (
                        <>
                          <p className="text-[12px] leading-snug text-fg-tertiary">AI reads the comment and your AI knowledge base and writes a personal DM for each person. Add guidance (optional):</p>
                          <TextArea value={rule.aiInstruction} onChange={(aiInstruction) => set({ aiInstruction })} rows={3} placeholder="e.g. Share the price list and offer a free consultation. Keep it under 3 lines." />
                          <p className="text-[11.5px] text-fg-tertiary">If AI isn&apos;t available, the fixed message below is sent instead.</p>
                          <TextArea value={rule.dmMessage} onChange={(dmMessage) => set({ dmMessage })} rows={3} placeholder="Fallback message (optional)" />
                        </>
                      ) : (
                        <TextArea value={rule.dmMessage} onChange={(dmMessage) => set({ dmMessage })} rows={5} placeholder={'Hey! Thanks for your interest 😊\nHere is the link you asked for: https://…'} />
                      )}
                    </>
                  )}
                </Step>
              </>
            ) : (
              <>
                <Step n={1} title="When someone sends a DM" active={focus === 1} onFocus={step(1)}>
                  <Choice checked={rule.trigger !== 'any'} onSelect={() => set({ trigger: 'keyword' })} icon={Hash} label="That contains specific words" />
                  {rule.trigger !== 'any' && (
                    <div className="pl-1">
                      <KeywordInput value={rule.keywords} onChange={(keywords) => set({ keywords })} examples={['Price', 'Catalogue', 'Booking']} />
                      <label className="mt-2 flex items-center gap-2 text-[12px] text-fg-secondary">
                        <input type="checkbox" checked={rule.matchType === 'exact'} onChange={(e) => set({ matchType: e.target.checked ? 'exact' : 'contains' })} className="accent-[#1D4B3E]" />
                        Only when the message is exactly the word
                      </label>
                    </div>
                  )}
                  <Choice checked={rule.trigger === 'any'} onSelect={() => set({ trigger: 'any' })} icon={MessageCircle} label="Any message" desc="Used when no keyword reply matches." />
                  {rule.trigger === 'any' && (
                    <div className="flex items-center gap-2 pl-1 text-[12.5px] text-fg-secondary">
                      <Clock3 className="h-3.5 w-3.5 text-fg-tertiary" />
                      Reply at most once every
                      <select value={rule.cooldownMinutes} onChange={(e) => set({ cooldownMinutes: Number(e.target.value) })} className="rounded-md border border-line bg-canvas px-2 py-1 text-[12.5px] text-fg outline-none focus:border-brand">
                        {DM_COOLDOWN_OPTIONS.map((o) => <option key={o.minutes} value={o.minutes}>{o.label}</option>)}
                      </select>
                      per person
                    </div>
                  )}
                </Step>

                <Step n={2} title="Reply with" hint="Sent straight away. Paused when a team member takes over the chat." active={focus === 2} onFocus={step(2)}>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Reply type">
                    <Choice checked={rule.replyMode !== 'ai'} onSelect={() => set({ replyMode: 'static' })} icon={Send} label="Fixed message" />
                    <Choice checked={rule.replyMode === 'ai'} onSelect={() => set({ replyMode: 'ai' })} icon={Sparkles} label="AI reply" badge={AI_BADGE} />
                  </div>
                  {rule.replyMode === 'ai' ? (
                    <>
                      <p className="text-[12px] leading-snug text-fg-tertiary">AI reads the message and your AI knowledge base and answers like your team would. Add guidance (optional):</p>
                      <TextArea value={rule.aiInstruction} onChange={(aiInstruction) => set({ aiInstruction })} rows={3} placeholder="e.g. Answer questions about our services and prices. Ask for their phone number to book a call." />
                      <p className="text-[11.5px] text-fg-tertiary">Fallback if AI isn&apos;t available (optional):</p>
                      <TextArea value={rule.message} onChange={(message) => set({ message })} rows={3} placeholder="Thanks for your message! Our team will reply shortly." />
                    </>
                  ) : (
                    <TextArea value={rule.message} onChange={(message) => set({ message })} rows={5} placeholder={'Hi! 👋 Thanks for reaching out.\nHere’s our price list: https://…'} />
                  )}
                </Step>
              </>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="relative order-1 flex min-h-[720px] flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(29,75,62,0.10)_1px,transparent_0)] [background-size:22px_22px] p-6 lg:order-2 lg:min-h-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(230,244,238,0.9),transparent_70%)]" aria-hidden />
          <span className="absolute left-5 top-4 text-[12px] font-medium uppercase tracking-wide text-fg-tertiary">Preview</span>
          <div className="relative">
            <PhonePreview kind={kind} account={account} rule={rule} tab={tab} onTab={setTab} />
          </div>
        </main>
      </div>
    </div>
  );
}
