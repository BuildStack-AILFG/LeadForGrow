'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Filter, MessageSquarePlus, Loader2, LayoutGrid, Volume2, VolumeX } from 'lucide-react';
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
    <aside className="flex flex-col h-full w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex-shrink-0 p-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Unified Inbox</h1>
            {/* Live indicator: pulsing green dot when SSE is connected,
                grey static dot when disconnected. Silent — users don't need
                to know the mechanism, just whether it's live. */}
            <span
              title={realtimeConnected ? 'Live — receiving new messages in real time' : 'Reconnecting…'}
              className="inline-flex items-center"
            >
              <span className={`relative inline-flex w-2 h-2 rounded-full ${realtimeConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                {realtimeConnected && (
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                )}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={soundOn ? 'Mute new-message sound' : 'Play sound on new messages'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <Link
              href="/automation/leads/new"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600"
              title="New lead"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search messages, leads, deals..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          {searchResults && search.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
              {[
                ...(searchResults.conversations || []).map((c) => ({ type: 'conversation', item: c, label: c.participantName || c.lastMessagePreview })),
                ...(searchResults.leads || []).map((l) => ({ type: 'lead', item: l, label: l.name })),
                ...(searchResults.messages || []).slice(0, 5).map((m) => ({ type: 'message', item: m, label: m.content?.body?.slice(0, 60) })),
              ].length === 0 ? (
                <p className="p-3 text-xs text-slate-500">No results</p>
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
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <span className="text-[10px] uppercase text-slate-400">{r.type}</span>
                    <p className="truncate text-slate-700 dark:text-slate-300">{r.label}</p>
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
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon
                  className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}
                  size={12}
                />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {INBOX_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-center gap-2 py-3 text-xs font-medium text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Loading conversations…</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-800/60 dark:to-slate-800 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Filter className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No conversations</p>
            <p className="text-xs text-slate-400 mt-1">Try a different filter or search term.</p>
          </div>
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
              <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                {loadingMoreConversations ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>Loading older conversations…</span>
                  </>
                ) : (
                  <span className="text-slate-400">Scroll for more</span>
                )}
              </div>
            )}
            {!hasMoreConversations && conversations.length > 20 && (
              <div className="text-center py-4 text-[10px] text-slate-400 uppercase tracking-wider">
                End of list · {conversations.length} conversations
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
