'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Filter, UserPlus, Loader2, LayoutGrid, Volume2, VolumeX, PenSquare, FileText, Clock, CheckCircle2, Archive, X, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import ComposeEmailModal from './ComposeEmailModal';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';
import { INBOX_FILTERS, CHANNEL_FILTERS } from './constants';
import InboxViewTabs from './InboxViewTabs';
import EmailFolderBar from './EmailFolderBar';
import SocialFilterBar from './SocialFilterBar';
import ConversationItem from './ConversationItem';
import { buildSearchRows } from '@/lib/omnichannel/searchRows';
import { WhatsAppIcon, InstagramIcon, FacebookIcon, GmailIcon, GmailMonoIcon } from './BrandIcons';

// Real brand marks for the channel filter pills. Inactive pill: the official coloured mark. Active pill
// (solid channel-colour background): a white monochrome mark so it doesn't vanish against its own colour.
// LayoutGrid is the neutral "all channels" mark.
/** Compact "how long waiting" formatter for the triage bar. */
function fmtWait(ms) {
  const h = ms / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

const CHANNEL_ICONS = {
  all: { color: LayoutGrid, mono: LayoutGrid },
  whatsapp: { color: WhatsAppIcon, mono: WhatsAppIcon },
  instagram: { color: InstagramIcon, mono: InstagramIcon },
  facebook: { color: FacebookIcon, mono: FacebookIcon },
  email: { color: GmailIcon, mono: GmailMonoIcon },
};

// Active-pill color per channel — each channel keeps its own real brand
// color when selected (WhatsApp green, Instagram pink, Gmail blue) instead
// of flattening every tab to the same brand teal. "All channels" has no
// single identity, so it uses the app's own brand teal.
const CHANNEL_ACTIVE_BG = {
  all: 'bg-brand',
  whatsapp: 'bg-[#25D366]',
  instagram: 'bg-[#E1306C]',
  facebook: 'bg-[#1877F2]',
  email: 'bg-[#4285F4]',
};

export default function ChatSidebar({
  conversations,
  selectedId,
  filter,
  onFilterChange,
  channelFilter,
  onChannelFilterChange,
  emailFolder = 'inbox',
  onEmailFolderChange,
  socialFilter = 'all',
  onSocialFilterChange,
  search,
  onSearchChange,
  searchResults,
  onSelectSearchResult,
  viewCounts,
  onMarkDone,
  onAssignToMe,
  onAssignTo,
  teamMembers,
  currentUserId,
  onSelect,
  loading,
  hasMoreConversations,
  loadingMoreConversations,
  onLoadMoreConversations,
  onRefresh,
  realtimeConnected = false,
  onCollapse,
}) {
  const searchRows = buildSearchRows(searchResults);
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

  const [composeOpen, setComposeOpen] = useState(false);

  // Bulk-select triage: pick several conversations, then Done / Archive at once.
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());
  // Selections don't carry across a different view (the ids may not be listed).
  useEffect(() => { setSelectedIds(new Set()); }, [channelFilter, emailFolder, filter]);
  const runBulk = async (action) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await authFetch('/api/automation/inbox/conversations/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`${action === 'done' ? 'Marked done' : 'Archived'} ${d.modified} conversation${d.modified !== 1 ? 's' : ''}`);
        clearSelection();
        onRefresh?.();
      } else {
        toast.error(d.error || 'Bulk action failed');
      }
    } catch {
      toast.error('Bulk action failed');
    } finally {
      setBulkBusy(false);
    }
  };

  // Per-channel "waiting for reply" counts for the red badges on the channel
  // tabs. Polled on a light 60s cadence (one grouped query) — not tied to the
  // list refresh, so high-traffic inboxes don't pay for it on every fetch.
  const [channelWaiting, setChannelWaiting] = useState({});
  // Channels with at least one conversation; null until loaded (show all meanwhile).
  const [usedChannels, setUsedChannels] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => authFetch('/api/automation/inbox/channel-waiting')
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d.success) return;
        setChannelWaiting(d.data || {});
        if (Array.isArray(d.channels)) setUsedChannels(d.channels);
      })
      .catch(() => {});
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Drafts folder (email tab): the list shows saved drafts, which aren't
  // conversations, so they're fetched + rendered separately.
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const showDrafts = channelFilter === 'email' && emailFolder === 'drafts';
  useEffect(() => {
    if (!showDrafts) return;
    setDraftsLoading(true);
    authFetch('/api/automation/inbox/email/folders?folder=drafts')
      .then((r) => r.json())
      .then((d) => { if (d.success) setDrafts(d.data || []); })
      .catch(() => {})
      .finally(() => setDraftsLoading(false));
  }, [showDrafts]);

  return (
    <aside className="flex flex-col h-full w-full bg-canvas dark:bg-slate-900 border-r border-line dark:border-slate-800">
      <ComposeEmailModal open={composeOpen} onClose={() => setComposeOpen(false)} />
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
              <span className={`relative inline-flex w-2 h-2 rounded-full ${realtimeConnected ? 'bg-accent' : 'bg-slate-300'}`}>
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            {channelFilter === 'email' && (
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-accent text-white hover:bg-accent-hover"
                title="Compose a new email"
              >
                <PenSquare className="w-3.5 h-3.5" /> Compose
              </button>
            )}
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-lg text-fg-tertiary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800"
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
              className="p-2 rounded-lg text-fg-tertiary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 hover:text-brand-ink"
              title="New lead"
            >
              <UserPlus className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
          <input
            type="search"
            placeholder="Search messages, leads, deals..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          {searchResults && search.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded shadow-popover p-1.5 space-y-0.5">
              {searchRows.length === 0 ? (
                <p className="p-3 text-xs text-fg-tertiary dark:text-fg-tertiary">No results</p>
              ) : (
                searchRows.map((r, i) => (
                  <button
                    key={`${r.type}-${r.item._id || i}`}
                    type="button"
                    onClick={() => onSelectSearchResult?.(r)}
                    className="w-full text-left px-3 py-2 text-xs rounded hover:bg-brand-tint dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-meta text-fg-tertiary">{r.type}</span>
                      {r.type === 'lead' && !r.hasChat && (
                        <span className="text-meta font-medium px-1.5 py-px rounded bg-accent-subtle dark:bg-emerald-950/40 text-accent-fg dark:text-accent-fg">
                          Start new chat
                        </span>
                      )}
                    </span>
                    <p className="truncate text-fg-secondary dark:text-fg-disabled">{r.label}</p>
                    {r.sub && <p className="truncate text-meta text-fg-tertiary dark:text-fg-tertiary">{r.sub}</p>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pt-1.5 pb-0.5 scrollbar-hide">
          {CHANNEL_FILTERS.filter((f) => (
            // Hide a channel nobody has used yet; keep it if it's the active filter.
            f.id === 'all' || !usedChannels || usedChannels.includes(f.id) || channelFilter === f.id
          )).map((f) => {
            const active = channelFilter === f.id;
            const iconSet = CHANNEL_ICONS[f.id] || CHANNEL_ICONS.all;
            // Gmail's mark is multi-colour on white — a solid blue pill with a
            // white "M" reads as the wrong brand. So the email tab keeps its real
            // multi-colour mark and shows selection as a light pill + blue ring.
            const isEmail = f.id === 'email';
            const Icon = active && !isEmail ? iconSet.mono : iconSet.color;
            const waiting = channelWaiting[f.id] || 0;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChannelFilterChange(f.id)}
                // Icon-only: five labelled pills no longer fit the narrower list; the name is on hover / for screen readers.
                title={waiting > 0 ? `${f.label} — ${waiting} waiting for reply` : f.label}
                aria-label={f.label}
                aria-pressed={active}
                className={`relative inline-flex items-center justify-center flex-shrink-0 w-9 h-7 rounded transition-colors ${
                  active
                    ? (isEmail
                        ? 'bg-canvas dark:bg-slate-900 ring-2 ring-inset ring-[#4285F4]'
                        : `${CHANNEL_ACTIVE_BG[f.id] || CHANNEL_ACTIVE_BG.all} text-white`)
                    : 'bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-700'
                }`}
              >
                <Icon
                  {...(f.id !== 'all' && (!active || isEmail) ? { colored: true } : {})}
                  className={active && !isEmail ? 'text-white' : f.id === 'all' ? 'text-fg-tertiary dark:text-fg-tertiary' : ''}
                  size={15}
                />
                {waiting > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-danger text-white text-meta font-semibold flex items-center justify-center tabular-nums ring-1 ring-white dark:ring-slate-900">
                    {waiting > 99 ? '99+' : waiting}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {channelFilter === 'email' ? (
          // Email gets Gmail-style folders (Inbox/Sent/Drafts/Trash) instead of
          // the chat queues, which don't map to how email is triaged.
          <EmailFolderBar active={emailFolder} onChange={onEmailFolderChange} needsReplyCount={viewCounts?.needs_reply} />
        ) : (channelFilter === 'instagram' || channelFilter === 'facebook') ? (
          // Instagram / Facebook split DMs from public post comments.
          <SocialFilterBar active={socialFilter} onChange={onSocialFilterChange} channel={channelFilter} needsReplyCount={viewCounts?.needs_reply} />
        ) : (
          <InboxViewTabs filter={filter} onChange={onFilterChange} counts={viewCounts} />
        )}
      </div>

      {/* Triage bar: at-a-glance backlog health — who's waiting, how many are
          past the 4h SLA, and how long the oldest has waited. One click on
          "waiting" jumps to the Needs-reply queue (longest waiter first). */}
      {viewCounts?.needs_reply > 0 && (
        <button
          type="button"
          onClick={() => (channelFilter === 'email' ? onEmailFolderChange?.('needs_reply') : onFilterChange?.('needs_reply'))}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-meta border-b border-line dark:border-slate-800 bg-warning-subtle/60 dark:bg-amber-950/15 hover:bg-warning-subtle/60 dark:hover:bg-amber-950/25"
        >
          <Clock className="w-3.5 h-3.5 text-warning dark:text-amber-400 shrink-0" />
          <span className="font-semibold text-fg dark:text-slate-200">{viewCounts.needs_reply} waiting</span>
          {viewCounts.overdue > 0 && (
            <span className="font-semibold text-danger dark:text-rose-400">· {viewCounts.overdue} overdue</span>
          )}
          {viewCounts.oldestWaitMs > 0 && (
            <span className="ml-auto text-fg-tertiary dark:text-fg-tertiary">oldest {fmtWait(viewCounts.oldestWaitMs)}</span>
          )}
        </button>
      )}

      {/* Bulk-select action bar — appears when one or more rows are ticked. */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line dark:border-teal-900/50 bg-accent-subtle dark:bg-teal-950/30">
          <span className="text-xs font-semibold text-fg dark:text-slate-200">{selectedIds.size} selected</span>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk('done')} className="inline-flex items-center gap-1 px-2 py-1 text-meta font-medium rounded-md bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-700 disabled:opacity-50">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg dark:text-accent-fg" /> Done
          </button>
          <button type="button" disabled={bulkBusy} onClick={() => runBulk('archive')} className="inline-flex items-center gap-1 px-2 py-1 text-meta font-medium rounded-md bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-700 disabled:opacity-50">
            <Archive className="w-3.5 h-3.5 text-fg-tertiary dark:text-fg-tertiary" /> Archive
          </button>
          <button type="button" onClick={clearSelection} className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-meta text-fg-tertiary dark:text-fg-tertiary hover:text-fg-secondary dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {showDrafts ? (
          draftsLoading ? (
            <div className="p-6 text-center text-xs text-fg-tertiary">Loading drafts…</div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-10 h-10 text-fg-disabled mb-2" />
              <p className="text-sm font-medium text-fg-secondary dark:text-fg-tertiary">No drafts</p>
              <p className="text-xs text-fg-tertiary mt-1">Saved email drafts appear here.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {drafts.map((d) => (
                <div key={d._id} className="flex items-start gap-2.5 p-3 rounded-lg hover:bg-subtle dark:hover:bg-slate-800/60">
                  <FileText className="w-4 h-4 text-fg-tertiary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg dark:text-slate-100 truncate">{d.subject || '(no subject)'}</p>
                    <p className="text-xs text-fg-tertiary dark:text-fg-tertiary truncate">
                      {(Array.isArray(d.to) && d.to[0]?.email) || 'No recipient'} · {(d.bodyText || d.bodyHtml || '').replace(/<[^>]+>/g, '').slice(0, 60) || 'Empty draft'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="p-6 space-y-3">
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
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Filter className="w-10 h-10 text-fg-disabled mb-2" />
            <p className="text-sm font-medium text-fg-secondary dark:text-fg-tertiary">
              {search ? 'No conversations match' : (INBOX_FILTERS.find((f) => f.id === filter)?.empty || 'No conversations')}
            </p>
            <p className="text-xs text-fg-tertiary mt-1">
              {search
                ? 'A lead who never messaged shows in the results above: pick it to start a new chat.'
                : filter !== 'all' ? 'Switch to All to see every conversation.' : 'Try a different filter or search term.'}
            </p>
          </div>
        ) : (
          <>
            {conversations.map((chat) => (
              <ConversationItem
                key={chat._id}
                chat={chat}
                active={selectedId === chat._id}
                onClick={() => onSelect(chat)}
                onDone={onMarkDone}
                onAssignToMe={onAssignToMe}
                onAssignTo={onAssignTo}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
                showAssignToMe={filter === 'unassigned'}
                selected={selectedIds.has(chat._id)}
                onToggleSelect={toggleSelect}
                selectionMode={selectedIds.size > 0}
              />
            ))}
            {/* Sentinel — IntersectionObserver above triggers loadMore when this scrolls into view */}
            {hasMoreConversations && (
              <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-4 text-xs text-fg-tertiary dark:text-fg-tertiary">
                {loadingMoreConversations ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-fg dark:text-accent-fg" />
                    <span>Loading older conversations…</span>
                  </>
                ) : (
                  <span className="text-fg-tertiary">Scroll for more</span>
                )}
              </div>
            )}
            {!hasMoreConversations && conversations.length > 20 && (
              <div className="text-center py-4 text-meta text-fg-tertiary">
                End of list · {conversations.length} conversations
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
