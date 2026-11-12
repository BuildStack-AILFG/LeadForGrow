'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Sparkles, ArrowRight, Pencil, Trash2, Loader2, Hash, LayoutGrid, CalendarClock, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import cx from '@/app/components/ui/cx';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { InstagramIcon } from '@/app/automation/components/chat/BrandIcons';

const IG_GRADIENT = 'bg-[linear-gradient(135deg,#F9CE34_0%,#EE2A7B_50%,#6228D7_100%)]';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand' : 'bg-line-strong')}
    >
      <span className={cx('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
    </button>
  );
}

function CreateCard({ href, icon: Icon, title, desc, points, accent, badge }) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-canvas p-5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_18px_40px_-24px_rgba(29,75,62,0.45)]"
    >
      <span className={cx('pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-[0.12] blur-2xl', accent)} aria-hidden />
      <div className="flex items-center gap-3">
        <span className={cx('flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm', accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">{title}{badge}</h3>
          <p className="text-[12.5px] text-fg-tertiary">{desc}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[12.5px] text-fg-secondary">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {p}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-ink">
        Create automation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function triggerSummary(type, r) {
  if (type === 'comment') {
    const words = r.matchType === 'any' ? 'Any comment' : r.keywords.map((k) => `“${k}”`).join(', ');
    const where = r.scope === 'all' ? 'any post' : r.scope === 'next' ? (r.mediaId ? 'next post (attached)' : 'next post') : 'one post';
    return { words, where, ScopeIcon: r.scope === 'all' ? LayoutGrid : r.scope === 'next' ? CalendarClock : null };
  }
  return { words: r.trigger === 'any' ? 'Any message' : r.keywords.map((k) => `“${k}”`).join(', '), where: null, ScopeIcon: null };
}

function RuleRow({ type, rule, onToggle, onDelete }) {
  const { words, where, ScopeIcon } = triggerSummary(type, rule);
  const ai = type === 'comment' ? rule.replyMode === 'ai' : rule.replyMode === 'ai';
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-subtle/70 sm:flex-nowrap">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-subtle">
        {type === 'comment' && rule.mediaThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rule.mediaThumb} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-brand-ink">
            {ScopeIcon ? <ScopeIcon className="h-4 w-4" /> : type === 'comment' ? <MessageCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/automation/instagram-automation/${rule.id}?type=${type}`} className="block truncate text-[13.5px] font-semibold text-fg hover:text-brand-ink">
          {rule.name || words}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-fg-tertiary">
          <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" />{words}</span>
          {where && <span>· {where}</span>}
          <span>· {ai ? 'AI reply' : 'Fixed reply'}</span>
        </p>
      </div>
      <span className="hidden text-right sm:block">
        <span className="block text-[14px] font-semibold tabular-nums text-fg">{rule.triggeredCount || 0}</span>
        <span className="block text-[11px] text-fg-tertiary">triggered</span>
      </span>
      <Toggle checked={rule.enabled} onChange={(v) => onToggle(rule, v)} label={`Turn ${rule.enabled ? 'off' : 'on'} ${rule.name || words}`} />
      <Link href={`/automation/instagram-automation/${rule.id}?type=${type}`} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary hover:bg-muted hover:text-fg">
        <Pencil className="h-4 w-4" />
      </Link>
      <button type="button" aria-label="Delete" onClick={() => onDelete(rule)} className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary hover:bg-danger-subtle hover:text-danger">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function InstagramAutomationsPage() {
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('comment');

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/instagram-automations');
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.error || 'Could not load');
    } catch {
      toast.error('Could not load Instagram automations');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (rule, enabled) => {
    setData((d) => ({ ...d, [tab]: d[tab].map((r) => (r.id === rule.id ? { ...r, enabled } : r)) }));
    const res = await authFetch('/api/automation/instagram-automations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: tab, id: rule.id, enabled }),
    }).then((r) => r.json()).catch(() => null);
    if (!res?.success) { toast.error(res?.error || 'Could not update'); load(); }
    else toast.success(enabled ? 'Turned on' : 'Turned off');
  };

  const remove = async (rule) => {
    const ok = await confirm({ title: 'Delete this automation?', message: `“${rule.name || 'This automation'}” will stop replying. This can't be undone.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    const res = await authFetch(`/api/automation/instagram-automations?type=${tab}&id=${encodeURIComponent(rule.id)}`, { method: 'DELETE' }).then((r) => r.json()).catch(() => null);
    if (res?.success) { setData(res.data); toast.success('Deleted'); } else toast.error('Could not delete');
  };

  const account = data?.account;
  const list = data?.[tab] || [];
  const live = (data?.comment || []).filter((r) => r.enabled).length + (data?.dm || []).filter((r) => r.enabled).length;
  const fired = [...(data?.comment || []), ...(data?.dm || [])].reduce((s, r) => s + (r.triggeredCount || 0), 0);

  return (
    <div className="min-h-full bg-subtle">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-line bg-canvas">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(238,42,123,0.10),transparent_65%)]" aria-hidden />
        <div className="pointer-events-none absolute -left-16 bottom-[-120px] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(29,75,62,0.10),transparent_65%)]" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-6">
          <span className={cx('flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-10px_rgba(238,42,123,0.6)]', IG_GRADIENT)}>
            <InstagramIcon size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold text-fg">Instagram automations</h1>
            <p className="text-[13px] text-fg-tertiary">Turn comments into conversations and answer DMs instantly — even while you sleep.</p>
          </div>
          {account && (account.connected ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-[12.5px] text-fg-secondary">
              <span className="h-2 w-2 rounded-full bg-success" /> Connected{account.username ? ` as @${account.username}` : ''}
            </span>
          ) : (
            <Link href="/automation/settings/instagram" className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning-subtle px-3 py-1.5 text-[12.5px] font-medium text-warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Connect Instagram
            </Link>
          ))}
        </div>
        <div className="relative border-t border-line"><div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-line px-0 sm:px-6">
          {[['Live automations', live], ['Times triggered', fired], ['AI replies', account?.aiReplyEnabled ? 'On' : 'Per rule']].map(([k, v]) => (
            <div key={k} className="px-4 py-3 first:pl-0 sm:first:pl-0">
              <p className="text-[11.5px] uppercase tracking-wide text-fg-tertiary">{k}</p>
              <p className="text-[18px] font-semibold tabular-nums text-fg">{data ? v : '—'}</p>
            </div>
          ))}
        </div></div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <CreateCard
            href="/automation/instagram-automation/new?type=comment"
            icon={MessageCircle}
            accent={IG_GRADIENT}
            title="Comment to DM"
            desc="Someone comments a keyword → they get a DM"
            points={['Pick one post, any post or your next post', 'Public reply under the comment', 'Fixed DM or AI-written DM']}
          />
          <CreateCard
            href="/automation/instagram-automation/new?type=dm"
            icon={Zap}
            accent="bg-[linear-gradient(135deg,#2F7D66_0%,#1D4B3E_100%)]"
            title="DM auto-reply"
            badge={<span className="inline-flex items-center gap-0.5 rounded-full bg-gold-subtle px-1.5 py-px text-[10px] font-semibold text-gold-fg"><Sparkles className="h-2.5 w-2.5" /> AI</span>}
            desc="Answer DMs instantly, by keyword or AI"
            points={['Reply to keywords like “price” or “booking”', 'Or answer every new DM, once per person', 'Pauses when your team takes over the chat']}
          />
        </div>

        <section className="overflow-hidden rounded-2xl border border-line bg-canvas">
          <div className="flex items-center gap-1 border-b border-line px-3 pt-2" role="tablist">
            {[['comment', 'Comment to DM'], ['dm', 'DM auto-reply']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cx('relative px-3 pb-2.5 pt-1.5 text-[13px] font-medium', tab === id ? 'text-fg' : 'text-fg-tertiary hover:text-fg-secondary')}
              >
                {label}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-fg-secondary">{data?.[id]?.length ?? 0}</span>
                {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold" />}
              </button>
            ))}
          </div>
          {!data ? (
            <div className="flex items-center justify-center py-14"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-brand-ink">
                {tab === 'comment' ? <MessageCircle className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </span>
              <p className="text-[14px] font-semibold text-fg">{tab === 'comment' ? 'No comment automations yet' : 'No DM auto-replies yet'}</p>
              <p className="mt-1 max-w-sm text-[12.5px] text-fg-tertiary">
                {tab === 'comment' ? 'Ask people to comment a word like “PRICE” and send them the details in DM automatically.' : 'Reply instantly to common questions, or let AI answer every new DM.'}
              </p>
              <Link href={`/automation/instagram-automation/new?type=${tab}`} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:brightness-110">
                Create your first one <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            list.map((r) => <RuleRow key={r.id} type={tab} rule={r} onToggle={toggle} onDelete={remove} />)
          )}
        </section>
      </div>
    </div>
  );
}
