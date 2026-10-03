'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Inbox, MessageSquarePlus, Loader2, LayoutGrid, Volume2, VolumeX, PanelLeftClose } from 'lucide-react';
import EmptyState from '@/app/components/ui/EmptyState';
import Link from 'next/link';
import { INBOX_FILTERS, CHANNEL_FILTERS } from './constants';
import ConversationItem from './ConversationItem';
import { WhatsAppIcon, InstagramIcon, GmailMonoIcon } from './BrandIcons';

// Real brand marks for the channel filter pills. Rendered at inline size
// (12px) with the pill's text colour via currentColor — active pill turns
// them white against emerald, inactive pill keeps them slate. LayoutGrid
// is the neutral "all channels" mark.
const CHANNEL_ICONS = {
  all: LayoutGrid,
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  email: GmailMonoIcon,
};

// Active-pill color per channel — each channel keeps its own real brand
// color when selected (WhatsApp green, Instagram pink, Gmail blue) instead
// of flattening every tab to the same brand teal. "All channels" has no
// single identity, so it uses the app's own brand teal.
const CHANNEL_ACTIVE_BG = {
  all: 'bg-accent',
  whatsapp: 'bg-[#25D366]',
  instagram: 'bg-[#E1306C]',
  email: 'bg-[#4285F4]',
};

export default function ChatSidebar({
  conversations,
  selectedId,
  filter,
  onFilterChange,
  channelFilter,
  onChannelFilterChange,
  search,
  onSearchChange,
  searchResults,
  onSelectSearchResult,
  onSelect,
  loading,
  hasMoreConversations,
  loadingMoreConversations,
  onLoadMoreConversations,
  realtimeConnected = false,
  onCollapse,
}) {
  // Sound preference lives in localStorage — persists per browser without
  // needing a backend column. Default off so we don't ambush users with
  // audio on first load; they opt-in via the speaker icon in the header.
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('lfg_inbox_sound') === '1'; }
    catch { return false; }
  });
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem('lfg_inbox_sound', next ? '1' : '0'); } catch { /* private mode */ }
  };
  // IntersectionObserver on a sentinel at the bottom of the list.
  // When it scrolls into view, trigger loadMore. That's how the sidebar
  // pages in older conversations without a "Load more" button.
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMoreConversations || loadingMoreConversations) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onLoadMoreConversations?.();
        }
      },
      { root: null, rootMargin: '200px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMoreConversations, loadingMoreConversations, onLoadMoreConversations, conversations.length]);

  return (
    <aside className="flex flex-col h-full w-full bg-canvas dark:bg-slate-900 border-r border-line dark:border-slate-800">
      <div className="flex-shrink-0 p-3 border-b border-line dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-title font-semibold text-fg">Inbox</h1>
            {/* Live indicator: pulsing green dot when SSE is connected,
                grey static dot when disconnected. Silent — users don't need
                to know the mechanism, just whether it's live. */}
            <span
              title={realtimeConnected ? 'Live — receiving new messages in real time' : 'Reconnecting…'}
              className="inline-flex items-center"
            >
              <span className={`relative inline-flex w-2 h-2 rounded-full ${realtimeConnected ? 'bg-success' : 'bg-line-strong'}`}>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800"
              title={soundOn ? 'Mute new-message sound' : 'Play sound on new messages'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                className="hidden lg:inline-flex p-2 rounded-lg text-fg-tertiary hover:bg-muted hover:text-fg"
                title="Hide conversation list"
                aria-label="Hide conversation list"
              >
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
            <Link
              href="/automation/leads/new"
              className="p-2 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 hover:text-accent-fg"
              title="New lead"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
          <input
            type="search"
            placeholder="Search messages, leads, deals"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-md border border-line bg-canvas pl-9 pr-3 text-body text-fg placeholder:text-fg-tertiary hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          {searchResults && search.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded shadow-popover p-1.5 space-y-0.5">
              {[
                ...(searchResults.conversations || []).map((c) => ({ type: 'conversation', item: c, label: c.participantName || c.lastMessagePreview })),
                ...(searchResults.leads || []).map((l) => ({ type: 'lead', item: l, label: l.name })),
                ...(searchResults.messages || []).slice(0, 5).map((m) => ({ type: 'message', item: m, label: m.content?.body?.slice(0, 60) })),
              ].length === 0 ? (
                <p className="p-3 text-xs text-fg-tertiary">No results</p>
              ) : (
                [
                  ...(searchResults.conversations || []).map((c) => ({ type: 'conversation', item: c, label: c.participantName || c.lastMessagePreview })),
                  ...(searchResults.leads || []).map((l) => ({ type: 'lead', item: l, label: l.name })),
                  ...(searchResults.messages || []).slice(0, 5).map((m) => ({ type: 'message', item: m, label: m.content?.body?.slice(0, 60) })),
                ].map((r, i) => (
                  <button
                    key={`${r.type}-${r.item._id || i}`}
                    type="button"
                    onClick={() => onSelectSearchResult?.(r)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-accent-subtle dark:hover:bg-slate-800"
                  >
                    <span className="text-meta text-fg-tertiary">{r.type}</span>
                    <p className="truncate text-fg-secondary dark:text-fg-disabled">{r.label}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {CHANNEL_FILTERS.map((f) => {
            const Icon = CHANNEL_ICONS[f.id] || LayoutGrid;
            const active = channelFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChannelFilterChange(f.id)}
                className={`inline-flex h-7 items-center gap-1.5 px-2.5 text-meta font-medium rounded-md whitespace-nowrap transition-colors ${
                  active
                    ? `${CHANNEL_ACTIVE_BG[f.id] || CHANNEL_ACTIVE_BG.all} text-white`
                    : 'border border-line bg-canvas text-fg-secondary hover:bg-subtle'
                }`}
              >
                <Icon
                  className={active ? 'text-white' : 'text-fg-tertiary dark:text-fg-tertiary'}
                  size={12}
                />
                {f.label}
              </button>
            );
          })}
        </div>
        <div role="tablist" aria-label="Conversation status" className="-mb-3 flex gap-4 overflow-x-auto border-t border-line pt-1 scrollbar-hide">
          {INBOX_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => onFilterChange(f.id)}
              className={`-mb-px h-8 whitespace-nowrap border-b-2 text-dense transition-colors ${
                filter === f.id ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} role={i === 1 ? 'status' : undefined} aria-label={i === 1 ? 'Loading conversations' : undefined} className="flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 rounded-full bg-muted motion-safe:animate-pulse" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-1/2 rounded-sm bg-muted motion-safe:animate-pulse" />
                  <span className="block h-3 w-4/5 rounded-sm bg-muted motion-safe:animate-pulse" />
                </span>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState compact icon={Inbox} title="No conversations here." description="Try another channel, status or search." />
        ) : (
          <>
            {conversations.map((chat) => (
              <ConversationItem
                key={chat._id}
                chat={chat}
                active={selectedId === chat._id}
                onClick={() => onSelect(chat)}
              />
            ))}
            {/* Sentinel — IntersectionObserver above triggers loadMore when this scrolls into view */}
            {hasMoreConversations && (
              <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-4 text-xs text-fg-tertiary">
                {loadingMoreConversations ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-fg" />
                    <span>Loading older conversations…</span>
                  </>
                ) : (
                  <span className="text-fg-tertiary">Scroll for more</span>
                )}
              </div>
            )}
            {!hasMoreConversations && conversations.length > 20 && (
              <div className="text-center py-4 text-meta text-fg-tertiary">
                {conversations.length} conversations
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
