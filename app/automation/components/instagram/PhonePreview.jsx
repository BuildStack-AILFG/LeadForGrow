'use client';

import { useState } from 'react';
import { ChevronLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Sparkles, Image as ImageIcon, Phone, Video, Info } from 'lucide-react';
import cx from '@/app/components/ui/cx';

/**
 * Live phone preview for Instagram automations. Rendered from the rule being edited —
 * nothing here talks to Instagram. Tabs: Post · Comments · DM (comment rules) or DM only.
 */

const firstVariant = (text) => String(text || '').split('|||')[0].trim()
  // {a|b} spintax → first option
  .replace(/\{([^{}]*\|[^{}]*)\}/g, (_, opts) => opts.split('|')[0]);

function Avatar({ src, name, size = 28, ring = false }) {
  const initial = (name || 'Y').replace('@', '').charAt(0).toUpperCase();
  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full rounded-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#2F7D66] to-[#1D4B3E] text-[10px] font-semibold text-white">{initial}</span>
  );
  return (
    <span
      className={cx('inline-flex shrink-0 rounded-full', ring && 'p-[1.5px] bg-[conic-gradient(from_200deg,#F9CE34,#EE2A7B,#6228D7,#F9CE34)]')}
      style={{ width: size, height: size }}
    >
      <span className={cx('h-full w-full rounded-full', ring && 'border border-black')}>{inner}</span>
    </span>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-white">
      <span>9:41</span>
      <span className="absolute left-1/2 top-2.5 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[1.5px]">{[4, 6, 8, 10].map((h) => <span key={h} className="w-[2.5px] rounded-sm bg-white" style={{ height: h }} />)}</span>
        <span className="ml-0.5 h-[10px] w-[20px] rounded-[3px] border border-white/70 p-[1px]"><span className="block h-full w-3/4 rounded-[1px] bg-white" /></span>
      </span>
    </div>
  );
}

function PostImage({ thumb }) {
  const [failed, setFailed] = useState(false);
  if (thumb && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumb} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="aspect-square w-full object-cover" />;
  }
  return (
    <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(120%_90%_at_20%_10%,#2F7D66_0%,#16302A_55%,#0b1512_100%)] text-white/70">
      <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
      <span className="text-[10px]">Your post or reel</span>
    </div>
  );
}

function PostView({ account, rule }) {
  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <ChevronLeft className="h-4 w-4" />
        <div className="flex-1 text-center leading-tight">
          <p className="text-[9px] uppercase tracking-wide text-white/50">{account.username || 'your_account'}</p>
          <p className="text-[12px] font-semibold">Posts</p>
        </div>
        <span className="w-4" />
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar src={account.profilePicture} name={account.username} size={26} ring />
        <span className="flex-1 text-[11px] font-semibold">{account.username || 'your_account'}</span>
        <MoreHorizontal className="h-4 w-4" />
      </div>
      <PostImage thumb={rule.mediaThumb} />
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Heart className="h-[18px] w-[18px]" />
        <MessageCircle className="h-[18px] w-[18px]" />
        <Send className="h-[18px] w-[18px]" />
        <Bookmark className="ml-auto h-[18px] w-[18px]" />
      </div>
      <p className="px-3 text-[10.5px] leading-snug text-white/85 line-clamp-3">
        <b className="font-semibold">{account.username || 'your_account'}</b>{' '}
        {rule.mediaCaption || (rule.scope === 'next' ? 'Your next post will appear here.' : rule.scope === 'all' ? 'Works on every post and reel.' : 'Choose a post on the left.')}
      </p>
      <p className="px-3 pt-1 text-[10px] text-white/45">View all comments</p>
    </div>
  );
}

function CommentsView({ account, rule, sample }) {
  const reply = firstVariant(rule.publicReply);
  return (
    <div className="relative flex h-full flex-col bg-black text-white">
      <div className="h-[32%] overflow-hidden opacity-60"><PostImage thumb={rule.mediaThumb} /></div>
      <div className="absolute inset-x-0 bottom-0 top-[26%] flex flex-col rounded-t-2xl bg-[#262626]">
        <span className="mx-auto mt-2 h-1 w-8 rounded-full bg-white/30" />
        <p className="py-2 text-center text-[11.5px] font-semibold">Comments</p>
        <div className="flex-1 space-y-3 overflow-hidden px-3 pt-1">
          <div className="flex gap-2">
            <Avatar name="u" size={24} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold">customer <span className="font-normal text-white/45">now</span></p>
              <p className="text-[11px] leading-snug">{sample}</p>
              <p className="mt-0.5 text-[9px] text-white/45">Reply</p>
            </div>
            <Heart className="mt-1 h-3 w-3 text-white/50" />
          </div>
          {rule.publicReplyOn && reply ? (
            <div className="ml-7 flex gap-2">
              <Avatar src={account.profilePicture} name={account.username} size={20} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold">{account.username || 'your_account'} <span className="font-normal text-white/45">now</span></p>
                <p className="text-[11px] leading-snug">{reply}</p>
                <p className="mt-0.5 text-[9px] text-white/45">Reply</p>
              </div>
              <Heart className="mt-1 h-3 w-3 text-white/50" />
            </div>
          ) : (
            <p className="ml-7 text-[10px] italic text-white/40">No public reply — only the DM is sent.</p>
          )}
        </div>
        <div className="flex justify-between px-3 pb-2 text-[14px]">{['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((e) => <span key={e}>{e}</span>)}</div>
        <div className="mx-3 mb-3 flex items-center gap-2">
          <Avatar src={account.profilePicture} name={account.username} size={22} />
          <div className="flex-1 rounded-full border border-white/20 px-3 py-1.5 text-[10px] text-white/40">Add a comment…</div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ out, children, ai }) {
  return (
    <div className={cx('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[78%] whitespace-pre-wrap break-words rounded-[18px] px-3 py-2 text-[11px] leading-snug',
          out ? 'bg-[linear-gradient(135deg,#3B5BDB_0%,#7048E8_55%,#AE3EC9_100%)] text-white' : 'bg-[#262626] text-white',
          ai && 'border border-white/10'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DmView({ account, incoming, reply, ai, aiHint, context }) {
  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <ChevronLeft className="h-4 w-4" />
        <Avatar name="c" size={26} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[11.5px] font-semibold">customer</p>
          <p className="text-[9px] text-white/50">Active now</p>
        </div>
        <Phone className="h-4 w-4" /><Video className="h-4 w-4" /><Info className="h-4 w-4" />
      </div>
      <div className="flex flex-col items-center gap-1 py-4">
        <Avatar src={account.profilePicture} name={account.username} size={52} />
        <p className="text-[12px] font-semibold">{account.username || 'your_account'}</p>
        <p className="text-[9.5px] text-white/50">Instagram · Business account</p>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden px-3">
        {context && <p className="text-center text-[9px] text-white/40">{context}</p>}
        {incoming && <Bubble>{incoming}</Bubble>}
        {ai ? (
          <Bubble out ai>
            <span className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-white/80"><Sparkles className="h-3 w-3" /> AI reply</span>
            {aiHint}
          </Bubble>
        ) : reply ? (
          <Bubble out>{reply}</Bubble>
        ) : (
          <p className="text-center text-[10px] italic text-white/40">Write the DM on the left to preview it.</p>
        )}
      </div>
      <div className="m-3 flex items-center gap-2 rounded-full bg-[#262626] px-3 py-2 text-[10px] text-white/40">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3B5BDB] text-white">📷</span>
        Message…
      </div>
    </div>
  );
}

/**
 * @param kind  'comment' | 'dm'
 * @param tab   current tab id; @param onTab change handler
 */
export default function PhonePreview({ kind, account, rule, tab, onTab }) {
  const tabs = kind === 'comment' ? ['post', 'comments', 'dm'] : ['dm'];
  const sample = rule.matchType === 'any' || rule.trigger === 'any'
    ? (kind === 'comment' ? 'Love this! 😍' : 'Hi! Is this still available?')
    : (rule.keywords?.[0] || (kind === 'comment' ? 'price' : 'price'));

  let body;
  if (kind === 'dm') {
    body = (
      <DmView
        account={account}
        incoming={sample}
        reply={firstVariant(rule.message)}
        ai={rule.replyMode === 'ai'}
        aiHint={rule.aiInstruction ? `Writes a personal reply following: “${rule.aiInstruction.slice(0, 120)}”` : 'Writes a personal reply to each message using your AI knowledge base.'}
      />
    );
  } else if (tab === 'post') {
    body = <PostView account={account} rule={rule} />;
  } else if (tab === 'comments') {
    body = <CommentsView account={account} rule={rule} sample={sample} />;
  } else {
    const ai = rule.replyMode === 'ai' || (rule.replyMode === 'auto' && account.aiReplyEnabled);
    body = rule.dmOn === false ? (
      <DmView account={account} context="Replied to your comment" incoming={null} reply="" ai={false} />
    ) : (
      <DmView
        account={account}
        context={`Replied to your comment “${sample}”`}
        reply={firstVariant(rule.dmMessage)}
        ai={ai}
        aiHint={rule.aiInstruction ? `Writes a personal DM following: “${rule.aiInstruction.slice(0, 120)}”` : 'Writes a personal DM to each commenter using your AI knowledge base.'}
      />
    );
  }

  const activeTab = kind === 'dm' ? 'dm' : tab;

  const tabBar = tabs.length > 1 && (
    <div className="inline-flex rounded-full border border-line bg-canvas/90 p-1 shadow-sm backdrop-blur" role="tablist" aria-label="Preview">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={activeTab === t}
          onClick={() => onTab?.(t)}
          className={cx(
            'rounded-full px-4 py-1 text-[12px] font-medium transition-colors',
            activeTab === t ? 'bg-brand text-white shadow-sm' : 'text-fg-secondary hover:text-fg'
          )}
        >
          {t === 'dm' ? 'DM' : t === 'post' ? 'Post' : 'Comments'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {tabBar}
      <div
        className="relative rounded-[48px] bg-[#0b0b0c] p-[10px] shadow-[0_40px_80px_-20px_rgba(16,40,32,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        style={{ width: 296, height: 'min(600px, calc(100vh - 150px))', minHeight: 520 }}
      >
        <span className="absolute -left-[3px] top-28 h-10 w-[3px] rounded-l bg-[#1c1c1e]" aria-hidden />
        <span className="absolute -right-[3px] top-36 h-16 w-[3px] rounded-r bg-[#1c1c1e]" aria-hidden />
        <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-black">
          <StatusBar />
          <div className="relative min-h-0 flex-1">{body}</div>
          <span className="mx-auto mb-1.5 mt-1 h-1 w-24 rounded-full bg-white/60" aria-hidden />
        </div>
      </div>
    </div>
  );
}
