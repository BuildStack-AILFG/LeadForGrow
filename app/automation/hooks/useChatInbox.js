'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';
import { computeLeadIntelligence } from '@/lib/leadIntelligence';
import { useRealtime, REALTIME_EVENTS } from '@/app/automation/hooks/useRealtime';
import { defaultInboxView, isServerView } from '@/lib/omnichannel/inboxViews';
import { isNewChat } from '@/lib/omnichannel/newChat';
import { INBOX_VIEW_IDS } from '@/app/automation/components/chat/constants';
import { showUndoToast } from '@/app/automation/components/chat/UndoToast';
import { showIncomingMessageToast } from '@/app/automation/components/chat/IncomingMessageToast';

const VIEW_STORAGE_KEY = 'lfg_ui_inbox_view';

export function useChatInbox() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [leadDetail, setLeadDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  // Same first value on the server render and the first client render; the real starting view (remembered choice, else
  // by role) is applied in an effect right after mount, so there is no hydration mismatch.
  const [filter, setFilterState] = useState('needs_reply');
  const [viewCounts, setViewCounts] = useState(null);
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [businessName, setBusinessName] = useState('us');
  const [conversationDetail, setConversationDetail] = useState(null);
  const [labels, setLabels] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Conversation-list pagination (separate from message pagination above)
  const [convPage, setConvPage] = useState(1);
  const [convHasMore, setConvHasMore] = useState(false);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const CONV_PAGE_SIZE = 50;
  const [emailSubject, setEmailSubject] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  // Composer fields are per-conversation. This ref tracks which conversation
  // the current draft belongs to so switching threads clears it (see effect
  // below) — otherwise one thread's subject/Cc/Bcc leaks into the next.
  const composerConvIdRef = useRef(null);
  const [subjectAutofilled, setSubjectAutofilled] = useState(false);
  const initialLeadId = useRef(searchParams.get('leadId'));
  const selectedLeadIdRef = useRef(null);
  selectedLeadIdRef.current = selectedChat?.leadId?._id;

  // A view the user picked is remembered in this browser; a first visit starts on the role's view: the owner / manager
  // sees who is waiting, an agent sees their own conversations. A deep link to one lead's chat starts on All so the
  // conversation is always found.
  const setFilter = useCallback((view) => {
    setFilterState(view);
    try { localStorage.setItem(VIEW_STORAGE_KEY, view); } catch { /* storage blocked: the choice just isn't remembered */ }
  }, []);
  useEffect(() => {
    if (initialLeadId.current) { setFilterState('all'); return; }
    let saved = null;
    let role = 'member';
    try { saved = localStorage.getItem(VIEW_STORAGE_KEY); role = localStorage.getItem('userRole') || 'member'; } catch { /* ignore */ }
    setFilterState(saved && INBOX_VIEW_IDS.includes(saved) ? saved : defaultInboxView(role));
  }, []);
  const convRequestRef = useRef(0); // only the newest list request may write the list (a view switch mid-load must not be overwritten)

  const buildConvParams = useCallback((page) => {
    const params = new URLSearchParams();
    if (channelFilter !== 'all') params.set('channel', channelFilter);
    // Queues (needs_reply / mine / unassigned / taken_over) are decided by the server, with the same rules as the tab counts.
    // While searching, a queue must not hide matches: search looks across everything (like a mailbox search).
    if (isServerView(filter)) { if (!search) params.set('view', filter); }
    else if (filter === 'unread') params.set('inboxStatus', 'unread');
    else if (filter === 'pinned') params.set('pinned', 'true');
    else if (filter === 'archived') params.set('archived', 'true');
    // New: origin filters. 'automated' is the shortcut for everything the
    // system sent; 'user' shows human-composed only.
    else if (filter === 'automated') params.set('origin', 'automated');
    else if (filter === 'human') params.set('origin', 'user');
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(CONV_PAGE_SIZE));
    return params;
  }, [filter, channelFilter, search]);

  const fetchConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // The tab numbers refresh with every list refresh (realtime events already trigger this), so they never drift.
      authFetch('/api/automation/inbox/counts')
        .then((r) => r.json())
        .then((d) => { if (d.success) setViewCounts(d.data); })
        .catch(() => {});
      const requestId = ++convRequestRef.current;
      const res = await authFetch(`/api/automation/inbox/conversations?${buildConvParams(1)}`);
      const data = await res.json();
      if (requestId !== convRequestRef.current) return;
      if (data.success) {
        // `status` (open/closed/lost) and `inboxStatus` (unread/read/intervened) are
        // separate fields server-side — previously this overwrote `status` with
        // `inboxStatus`, which meant `status === 'closed'` could never be true here even
        // though the backend correctly persisted it, breaking the Close-conversation UI.
        const normalized = data.data || [];
        setConversations(normalized);
        setConvPage(1);
        // Prefer the API's authoritative hasMore (page-size heuristic) so we
        // don't rely on countDocuments — which the endpoint now skips beyond
        // page 1 for perf. Fall back to totalPages on older responses.
        const hasMore = typeof data.pagination?.hasMore === 'boolean'
          ? data.pagination.hasMore
          : 1 < (data.pagination?.pages || 1);
        setConvHasMore(hasMore);
      }
    } catch {
      if (!silent) toast.error('Failed to load conversations');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [buildConvParams]);

  const loadMoreConversations = useCallback(async () => {
    if (loadingMoreConversations || !convHasMore) return;
    setLoadingMoreConversations(true);
    try {
      const nextPage = convPage + 1;
      const res = await authFetch(`/api/automation/inbox/conversations?${buildConvParams(nextPage)}`);
      const data = await res.json();
      if (data.success) {
        const normalized = (data.data || []).map((c) => ({
          ...c,
          status: c.inboxStatus || c.status,
        }));
        // Dedupe just in case an item shifts between pages during a refresh
        setConversations((prev) => {
          const seen = new Set(prev.map((c) => String(c._id)));
          const additions = normalized.filter((c) => !seen.has(String(c._id)));
          return [...prev, ...additions];
        });
        setConvPage(nextPage);
        const hasMore = typeof data.pagination?.hasMore === 'boolean'
          ? data.pagination.hasMore
          : nextPage < (data.pagination?.pages || nextPage);
        setConvHasMore(hasMore);
      }
    } catch {
      /* silent — sidebar sentinel will retry when the user scrolls again */
    } finally {
      setLoadingMoreConversations(false);
    }
  }, [buildConvParams, convHasMore, convPage, loadingMoreConversations]);

  const fetchMessages = useCallback(async (chat, showLoading = false) => {
    if (!chat) return;
    const leadId = chat.leadId?._id || chat.leadId;
    const conversationId = chat._id && !String(chat._id).startsWith('temp_') ? chat._id : null;
    try {
      if (showLoading) setMessagesLoading(true);
      const q = conversationId
        ? `conversationId=${conversationId}`
        : `leadId=${leadId}`;
      const res = await authFetch(`/api/automation/inbox/messages?${q}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch {
      if (showLoading) toast.error('Failed to load messages');
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  }, []);

  const fetchConversationDetail = useCallback(async (conversationId) => {
    if (!conversationId || String(conversationId).startsWith('temp_')) {
      setConversationDetail(null);
      return;
    }
    const res = await authFetch(`/api/automation/inbox/conversations/${conversationId}`);
    const data = await res.json();
    if (data.success) setConversationDetail(data.data);
  }, []);

  const fetchLabels = useCallback(async () => {
    const res = await authFetch('/api/automation/inbox/labels');
    const data = await res.json();
    if (data.success) setLabels(data.data || []);
  }, []);

  const fetchLeadDetail = useCallback(async (leadId) => {
    if (!leadId) return;
    try {
      const res = await authFetch(`/api/automation/leads/${leadId}`);
      const data = await res.json();
      if (data.success) setLeadDetail(data.data);
    } catch (err) {
      console.warn('[ChatInbox] Failed to load lead detail:', err?.message || err);
    }
  }, []);

  const fetchTeam = useCallback(async () => {
    const res = await authFetch('/api/automation/team');
    const data = await res.json();
    if (data.success) {
      setTeamMembers(
        data.data
          .map((m) => ({
            _id: m.userId?._id,
            firstName: m.userId?.firstName || 'Team',
            lastName: m.userId?.lastName || '',
            email: m.userId?.email
          }))
          .filter((m) => m._id)
      );
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await authFetch('/api/automation/templates');
    const data = await res.json();
    if (data.success) setTemplates(data.manual || []);
  }, []);

  useEffect(() => {
    async function init() {
      const me = await authFetch('/api/auth/me').then((r) => r.json());
      if (me.success) {
        setBusinessName(me.data.companyName || 'us');
        setCurrentUserId(me.data._id || me.data.userId);
      }
      await Promise.all([fetchTeam(), fetchTemplates(), fetchLabels()]);
    }
    init();
  }, [fetchTeam, fetchTemplates, fetchLabels]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (search.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/automation/inbox/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data.success) setSearchResults(data.data);
      } catch {
        setSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const realtime = useRealtime({
    onEvent: useCallback((event) => {
      if (
        event.type === REALTIME_EVENTS.CHAT_MESSAGE ||
        event.type === REALTIME_EVENTS.CHAT_READ ||
        event.type === REALTIME_EVENTS.CHAT_MESSAGE_STATUS ||
        event.type === REALTIME_EVENTS.NOTIFICATION
      ) {
        if (event.type === REALTIME_EVENTS.NOTIFICATION) {
          return;
        }
        fetchConversations(true);
        const eventLeadId = event.data?.leadId;
        const eventConvId = event.data?.conversationId;
        const isCurrentConversation =
          (eventLeadId && eventLeadId === selectedLeadIdRef.current) ||
          (eventConvId && eventConvId === selectedChat?._id);

        if (isCurrentConversation) {
          if (event.type === REALTIME_EVENTS.CHAT_MESSAGE_STATUS) {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === event.data?.messageId || m.messageId === event.data?.externalMessageId
                  ? { ...m, status: event.data.status }
                  : m
              )
            );
          } else {
            fetchMessages(selectedChat, false);
            if (event.type === REALTIME_EVENTS.CHAT_MESSAGE) {
              fetchLeadDetail(eventLeadId);
            }
          }
        } else if (
          event.type === REALTIME_EVENTS.CHAT_MESSAGE &&
          event.data?.direction === 'incoming'
        ) {
          // New INBOUND message on a conversation the user isn't currently
          // viewing → surface a toast so they don't miss it. Silent for
          // outbound (they know they just sent it) and silent for the
          // active conversation (message pops into the pane, no toast).
          // The server puts the sender's name on the event; the list on screen only knows conversations of the current
          // view, so it is just a fallback.
          const known = conversations.find((c) => c._id === eventConvId);
          showIncomingMessageToast({
            channel: event.data.channel,
            senderName: event.data.senderName || known?.leadId?.name || known?.participantName || null,
            preview: event.data.preview,
            messageId: event.data.messageId,
          });

          // Optional sound — muted by default via user pref check.
          try {
            if (typeof window !== 'undefined' && localStorage.getItem('lfg_inbox_sound') === '1') {
              const a = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
              a.volume = 0.3;
              a.play().catch(() => {});
            }
          } catch { /* localStorage may throw in private mode */ }
        }
      }
    }, [fetchConversations, fetchMessages, fetchLeadDetail, selectedChat, conversations]),
  });

  useEffect(() => {
    if (!selectedChat) return;
    const leadId = selectedChat.leadId?._id || selectedChat.leadId;

    // Messages fetch works with just conversationId — must always run so
    // clicking a lead-less conversation (e.g. email from unknown sender)
    // actually swaps the thread instead of showing the previous one.
    fetchMessages(selectedChat, true);

    // Lead-related state must sync EVERY conversation switch — otherwise
    // the previous conversation's customer profile lingers on the right
    // pane when the newly-clicked one has no lead attached.
    if (leadId) {
      fetchLeadDetail(leadId);
    } else {
      setLeadDetail(null);
    }

    if (selectedChat._id) fetchConversationDetail(selectedChat._id);
  }, [selectedChat, fetchMessages, fetchLeadDetail, fetchConversationDetail]);

  // #1 — Draft isolation. Clear the email composer fields when the user
  // switches to a DIFFERENT conversation (gated on _id via a ref so a mere
  // list refresh that swaps selectedChat's object identity — same thread —
  // never wipes a draft the user is actively typing).
  useEffect(() => {
    const convId = selectedChat?._id || null;
    if (convId === composerConvIdRef.current) return;
    composerConvIdRef.current = convId;
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject('');
    setSubjectAutofilled(false);
  }, [selectedChat?._id]);

  // #2 — Prefill "Re: <subject>" for email replies once this thread's
  // messages have loaded. Runs only while the subject is empty and hasn't
  // been auto-filled yet for this conversation, so it never clobbers a subject
  // the user typed (or deliberately cleared). Gated on conversationId match so
  // it can't read a stale thread's messages during the fetch gap.
  useEffect(() => {
    if (selectedChat?.channel !== 'email') return;
    if (subjectAutofilled || emailSubject) return;
    const convId = selectedChat?._id;
    const firstEmailMsg = messages.find(
      (m) => m.type === 'email' && m.subject && String(m.conversationId) === String(convId),
    );
    if (!firstEmailMsg) return;
    const clean = firstEmailMsg.subject.replace(/^(Re:|Fwd?:|Fw:)\s*/i, '').trim();
    if (clean) {
      setEmailSubject(`Re: ${clean}`);
      setSubjectAutofilled(true);
    }
  }, [messages, selectedChat?._id, selectedChat?.channel, subjectAutofilled, emailSubject]);

  const filteredConversations = useMemo(() => {
    // The server already applied the queues and Unread; only the lead-based views are still filtered here.
    let list = [...conversations];
    if (filter === 'hot') {
      list = list.filter((c) => {
        const p = c.leadId?.priority;
        return p === 'high' || p === 'urgent';
      });
    } else if (filter === 'followup') {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      list = list.filter((c) => c.leadId?.nextFollowUpAt && new Date(c.leadId.nextFollowUpAt) <= today);
    }
    return list;
  }, [conversations, filter]);

  const intelligence = useMemo(
    () => (leadDetail ? computeLeadIntelligence(leadDetail).intelligence : null),
    [leadDetail]
  );

  const markAsRead = useCallback(async (chat) => {
    const conversationId = chat._id;
    if (conversationId && !String(conversationId).startsWith('temp_')) {
      await authFetch(`/api/automation/inbox/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markRead: true }),
      });
    } else {
      const leadId = chat.leadId?._id || chat.leadId;
      await authFetch('/api/automation/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status: 'read' }),
      });
    }
    setConversations((prev) =>
      prev.map((c) =>
        c._id === chat._id ? { ...c, status: 'read', inboxStatus: 'read', unreadCount: 0 } : c
      )
    );
  }, []);

  const selectChat = useCallback(
    (chat) => {
      setSelectedChat(chat);
      if (chat.inboxStatus === 'unread' || chat.status === 'unread' || chat.unreadCount > 0) {
        markAsRead(chat);
      }
    },
    [markAsRead]
  );

  useEffect(() => {
    if (!initialLeadId.current || !conversations.length) return;
    const match = conversations.find(
      (c) => c.leadId?._id === initialLeadId.current || c.leadId === initialLeadId.current
    );
    if (match) {
      selectChat(match);
      initialLeadId.current = null;
    }
  }, [conversations, selectChat]);

  const intervene = useCallback(
    async (showToast = true) => {
      if (!selectedChat?.leadId?._id) return;
      const leadId = selectedChat.leadId._id;
      try {
        // Mark the conversation as human-handled. Do NOT auto-send any message
        // to the customer — intervening should silently pause the AI/automation.
        await authFetch('/api/automation/chat/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, status: 'intervened' })
        });
        setSelectedChat((prev) => ({ ...prev, status: 'intervened' }));
        setConversations((prev) =>
          prev.map((c) => (c.leadId?._id === leadId ? { ...c, status: 'intervened' } : c))
        );
        if (showToast) toast.success('Chat taken over');
      } catch {
        toast.error('Intervene failed');
      }
    },
    [selectedChat]
  );

  // Hand the conversation back to the AI agent: clears the 'intervened' state
  // in both stores so the AI resumes auto-replying to new messages.
  const releaseIntervene = useCallback(async () => {
    if (!selectedChat) return;
    const conversationId = selectedChat._id;
    const leadId = selectedChat.leadId?._id || selectedChat.leadId;
    try {
      if (conversationId && !String(conversationId).startsWith('temp_')) {
        await authFetch(`/api/automation/inbox/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markRead: true }),
        });
      }
      if (leadId) {
        await authFetch('/api/automation/chat/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, status: 'read' }),
        });
      }
      setSelectedChat((prev) => (prev ? { ...prev, status: 'read', inboxStatus: 'read' } : prev));
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, status: 'read', inboxStatus: 'read' } : c))
      );
      toast.success('Handed back to AI — it will reply to new messages');
    } catch {
      toast.error('Failed to hand back to AI');
    }
  }, [selectedChat]);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedChat || loadingMore || !hasMoreMessages) return;
    const oldest = messages[0]?.timestamp;
    if (!oldest) return;
    const leadId = selectedChat.leadId?._id || selectedChat.leadId;
    const conversationId = selectedChat._id;
    const q = conversationId
      ? `conversationId=${conversationId}&before=${new Date(oldest).toISOString()}`
      : `leadId=${leadId}&before=${new Date(oldest).toISOString()}`;
    try {
      setLoadingMore(true);
      const res = await authFetch(`/api/automation/inbox/messages?${q}`);
      const data = await res.json();
      if (data.success && data.data?.length) {
        setMessages((prev) => [...data.data, ...prev]);
        setHasMoreMessages(data.hasMore);
      } else {
        setHasMoreMessages(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [selectedChat, messages, loadingMore, hasMoreMessages]);

  const sendMessage = useCallback(
    async (text, options = {}) => {
      const {
        isInternal = false,
        media,
        attachments = [],
        bodyHtml,
        subject,
        cc,
        bcc,
        scheduledAt,
        template, // { name, language, headerMediaUrl, variables }
        emailAccountId, // From-picker choice for email sends
        replyToMessageId,
      } = options;
      const hasMedia = media?.url || attachments.length > 0;
      const hasTemplate = !!template?.name;
      if (!selectedChat?.leadId?._id || (!text?.trim() && !hasMedia && !hasTemplate)) return false;
      const leadId = selectedChat.leadId._id;
      const mediaItem = media || attachments[0];
      const temp = {
        _id: Date.now(),
        direction: 'outgoing',
        type: mediaItem?.mimeType ? (mediaItem.mimeType.startsWith('image/') ? 'image' : 'document') : 'text',
        content: {
          body: text || (hasTemplate ? `[Template: ${template.name}]` : ''),
          mediaUrl: mediaItem?.url,
          fileName: mediaItem?.fileName,
          mimeType: mediaItem?.mimeType,
        },
        timestamp: new Date(),
        status: 'sending',
        isInternal,
      };
      setMessages((prev) => [...prev, temp]);
      try {
        const res = await authFetch('/api/automation/inbox/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedChat._id?.startsWith?.('temp_') ? undefined : selectedChat._id,
            leadId,
            channel: selectedChat.channel || 'whatsapp',
            message: text || '',
            isInternal,
            subject: subject ?? emailSubject,
            cc,
            bcc,
            bodyHtml,
            scheduledAt,
            mediaUrl: mediaItem?.url,
            mimeType: mediaItem?.mimeType,
            fileName: mediaItem?.fileName,
            attachments,
            templateName: template?.name,
            templateLanguage: template?.language,
            templateHeaderMediaUrl: template?.headerMediaUrl,
            templateVariables: template?.variables,
            emailAccountId,
            replyToMessageId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (data.scheduled) {
            toast.success('Email scheduled');
            return true;
          }
          setMessages((prev) =>
            prev.map((m) => (m._id === temp._id ? { ...m, status: 'sent', _id: data.data?._id || data.messageId || m._id } : m))
          );
          if (!isInternal && selectedChat.channel === 'whatsapp' && selectedChat.inboxStatus !== 'intervened' && selectedChat.status !== 'intervened') {
            await intervene(false);
          }
          await fetchMessages(selectedChat, false);
          if (isInternal) fetchConversationDetail(selectedChat._id);
          return true;
        }
        setMessages((prev) => prev.map((m) => (m._id === temp._id ? { ...m, status: 'failed' } : m)));
        toast.error(data.error || 'Send failed');
        return false;
      } catch {
        setMessages((prev) => prev.map((m) => (m._id === temp._id ? { ...m, status: 'failed' } : m)));
        toast.error('Connection error');
        return false;
      }
    },
    [selectedChat, fetchMessages, intervene, fetchConversationDetail, emailSubject]
  );

  const conversationAction = useCallback(
    async (action, data = {}) => {
      if (!selectedChat?._id) return;
      const res = await authFetch(`/api/automation/inbox/conversations/${selectedChat._id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      const result = await res.json();
      if (result.success) {
        if (action === 'export') {
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conversation-${selectedChat._id}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Exported');
        } else if (action === 'delete') {
          setSelectedChat(null);
          fetchConversations(true);
          toast.success('Deleted');
        } else {
          setSelectedChat((prev) => ({ ...prev, ...result.data }));
          fetchConversations(true);
          toast.success('Updated');
        }
      } else {
        toast.error(result.error || 'Action failed');
      }
    },
    [selectedChat, fetchConversations]
  );

  const saveEmailDraft = useCallback(
    async (draft) => {
      const res = await authFetch('/api/automation/inbox/email/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat?._id,
          leadId: selectedChat?.leadId?._id,
          subject: draft.subject,
          bodyHtml: draft.body,
          cc: draft.cc ? draft.cc.split(',').map((e) => ({ email: e.trim() })) : [],
          bcc: draft.bcc ? draft.bcc.split(',').map((e) => ({ email: e.trim() })) : [],
        }),
      });
      const data = await res.json();
      // silent=true is used by the auto-save timer so we don't spam a
      // toast every 2 seconds while the user types.
      if (data.success && !draft.silent) toast.success('Draft saved');
    },
    [selectedChat]
  );

  /**
   * Star / unstar / trash / restore a single message. Optimistically updates
   * local state so the UI reacts instantly; if the API rejects, we roll back.
   * Reused by MessageBubble's hover actions and the folder empty states.
   */
  const messageAction = useCallback(async (messageId, action) => {
    if (!messageId || !action) return;

    // "Reply" isn't a persisted message state — it just tells the composer
    // to focus. Dispatch a DOM event that ChatInput listens for; keeps the
    // wiring loose so the hook doesn't need a ref to the input. Also
    // early-returns so we don't hit the PATCH endpoint with an unknown action.
    if (action === 'reply') {
      try {
        const target = messages.find((m) => m._id === messageId);
        const preview = (target?.content?.body || target?.content?.caption || '').slice(0, 140);
        window.dispatchEvent(new CustomEvent('lfg:reply-to-message', { detail: { messageId, preview } }));
      } catch { /* SSR/no-window safety */ }
      return;
    }

    // Optimistic update.
    const patch =
      action === 'star' ? { starred: true }
      : action === 'unstar' ? { starred: false }
      : action === 'trash' ? { isDeleted: true }
      : action === 'restore' ? { isDeleted: false }
      : {};
    setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, ...patch } : m)));

    try {
      const res = await authFetch(`/api/automation/inbox/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
    } catch (err) {
      // Roll back local state on failure. The user will re-try or see the
      // toast; we don't want the UI lying about persisted state.
      const rollback =
        action === 'star' ? { starred: false }
        : action === 'unstar' ? { starred: true }
        : action === 'trash' ? { isDeleted: false }
        : action === 'restore' ? { isDeleted: true }
        : {};
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, ...rollback } : m)));
      toast.error(err.message || 'Message action failed');
    }
  }, [messages]);

  // A new chat has no conversation record yet, so the assignment goes to the LEAD (the conversation, once it exists, falls
  // back to the lead's assignee).
  const assignNewChatLead = useCallback(async (chat, assigneeId) => {
    const res = await authFetch(`/api/automation/leads/${chat.leadId._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: assigneeId || null, performedBy: getUserId() }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Assign failed');
    const assignedTo = data.data?.assignedTo || null;
    setSelectedChat((prev) => (prev?._id === chat._id ? { ...prev, assignedTo, leadId: { ...prev.leadId, assignedTo } } : prev));
    fetchLeadDetail(chat.leadId._id);
    toast.success(assigneeId ? 'Lead assigned' : 'Lead unassigned');
  }, [fetchLeadDetail]);

  const assignChat = useCallback(
    async (assigneeId) => {
      if (!selectedChat) return;
      if (isNewChat(selectedChat)) {
        try { await assignNewChatLead(selectedChat, assigneeId); } catch (e) { toast.error(e.message || 'Assign failed'); }
        return;
      }
      const conversationId = selectedChat._id;
      const endpoint = conversationId && !String(conversationId).startsWith('temp_')
        ? `/api/automation/inbox/conversations/${conversationId}/assign`
        : '/api/automation/chat/assign';
      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assigneeId, conversationId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChat((prev) => ({ ...prev, assignedTo: data.data.assignedTo }));
        fetchConversationDetail(conversationId);
        toast.success('Conversation assigned');
      }
    },
    [selectedChat, fetchConversationDetail, assignNewChatLead]
  );

  const claimConversation = useCallback(async () => {
    if (!selectedChat?._id) return;
    if (isNewChat(selectedChat)) {
      try { await assignNewChatLead(selectedChat, getUserId()); } catch (e) { toast.error(e.message || 'Could not claim'); }
      return;
    }
    const res = await authFetch(`/api/automation/inbox/conversations/${selectedChat._id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim: true }),
    });
    const data = await res.json();
    if (data.success) {
      setSelectedChat((prev) => ({ ...prev, assignedTo: data.data.assignedTo }));
      fetchConversationDetail(selectedChat._id);
      toast.success('Conversation claimed');
    }
  }, [selectedChat, fetchConversationDetail, assignNewChatLead]);

  const updateConversation = useCallback(
    async (updates) => {
      if (!selectedChat?._id) return;
      const res = await authFetch(`/api/automation/inbox/conversations/${selectedChat._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChat((prev) => ({ ...prev, ...updates }));
        setConversations((prev) =>
          prev.map((c) => (c._id === selectedChat._id ? { ...c, ...updates } : c))
        );
        if (updates.isArchived) toast.success('Archived');
        else if (updates.isSpam) toast.success('Marked as spam');
        else if (updates.isPinned !== undefined) toast.success(updates.isPinned ? 'Pinned' : 'Unpinned');
        fetchConversations(true);
      }
    },
    [selectedChat, fetchConversations]
  );

  // "Done": nothing more to reply. The conversation is closed (a new customer message reopens it, see
  // upsertConversation) and leaves the queue it was in; Undo puts it back.
  const markDone = useCallback(
    async (chat) => {
      if (!chat?._id) return;
      const setStatus = async (status) => {
        const res = await authFetch(`/api/automation/inbox/conversations/${chat._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
      };
      try {
        await setStatus('closed');
        setConversations((prev) => (filter === 'all'
          ? prev.map((c) => (c._id === chat._id ? { ...c, status: 'closed' } : c))
          : prev.filter((c) => c._id !== chat._id)));
        setSelectedChat((prev) => (prev?._id === chat._id ? { ...prev, status: 'closed' } : prev));
        fetchConversations(true); // refreshes the tab counts too
        showUndoToast('Marked done', async () => {
          try { await setStatus('open'); fetchConversations(true); } catch { toast.error('Could not undo'); }
        });
      } catch {
        toast.error('Could not mark this conversation done');
      }
    },
    [filter, fetchConversations]
  );

  // "Assign to me" straight from the Unassigned queue (same claim call as the profile panel's Claim).
  const assignToMe = useCallback(
    async (chat) => {
      if (!chat?._id) return;
      try {
        const res = await authFetch(`/api/automation/inbox/conversations/${chat._id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim: true }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        const assignedTo = data.data?.assignedTo;
        setConversations((prev) => (filter === 'unassigned'
          ? prev.filter((c) => c._id !== chat._id)
          : prev.map((c) => (c._id === chat._id ? { ...c, assignedTo } : c))));
        setSelectedChat((prev) => (prev?._id === chat._id ? { ...prev, assignedTo } : prev));
        fetchConversations(true);
        toast.success('Assigned to you');
      } catch (e) {
        toast.error(e.message || 'Could not assign this conversation');
      }
    },
    [filter, fetchConversations]
  );

  // "Assign to" from a row: any team member (the profile panel's Assigned agent does the same for the open chat).
  const assignTo = useCallback(
    async (chat, assigneeId) => {
      if (!chat?._id || !assigneeId) return;
      try {
        const res = await authFetch(`/api/automation/inbox/conversations/${chat._id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: assigneeId }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        const assignedTo = data.data?.assignedTo;
        setConversations((prev) => (filter === 'unassigned'
          ? prev.filter((c) => c._id !== chat._id)
          : prev.map((c) => (c._id === chat._id ? { ...c, assignedTo } : c))));
        setSelectedChat((prev) => (prev?._id === chat._id ? { ...prev, assignedTo } : prev));
        fetchConversations(true);
        const name = [assignedTo?.firstName, assignedTo?.lastName].filter(Boolean).join(' ');
        toast.success(name ? `Assigned to ${name}` : 'Conversation assigned');
      } catch (e) {
        toast.error(e.message || 'Could not assign this conversation');
      }
    },
    [filter, fetchConversations]
  );

  const toggleLabel = useCallback(
    async (labelId, add) => {
      if (!selectedChat?._id) return;
      const res = await authFetch(`/api/automation/inbox/conversations/${selectedChat._id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(add ? { labelIds: [labelId], add: true } : { labelIds: [labelId], remove: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChat((prev) => ({ ...prev, labels: data.data.labels }));
        fetchConversationDetail(selectedChat._id);
      }
    },
    [selectedChat, fetchConversationDetail]
  );

  // Mirrors leads workspace's lost-reason flow: marking a lead "lost" requires a reason
  // (the leads API rejects the PUT with 400/LOST_REASON_REQUIRED otherwise) — previously
  // this call skipped that entirely and silently swallowed the resulting 400, so clicking
  // "Mark lost" in the chat header appeared to do nothing.
  const [lostPrompt, setLostPrompt] = useState(null);
  const [lostSaving, setLostSaving] = useState(false);

  const updateLeadStatus = useCallback(
    async (status, options = {}) => {
      if (!selectedChat?.leadId?._id) return;
      if (status === 'lost' && !options.lostReason) {
        setLostPrompt({ leadName: selectedChat.leadId?.name || selectedChat.participantName });
        return;
      }
      const userId = getUserId();
      try {
        const res = await authFetch(`/api/automation/leads/${selectedChat.leadId._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            lostReason: options.lostReason,
            note: options.note,
            performedBy: userId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSelectedChat((prev) => ({ ...prev, leadId: { ...prev.leadId, status } }));
          setLeadDetail(data.data);
          toast.success('Stage updated');
        } else {
          toast.error(data.error || 'Update failed');
        }
      } catch {
        toast.error('Update failed');
      }
    },
    [selectedChat]
  );

  const cancelLostPrompt = useCallback(() => setLostPrompt(null), []);

  const confirmLostReason = useCallback(
    async ({ reason, comments }) => {
      setLostSaving(true);
      try {
        await updateLeadStatus('lost', { lostReason: reason, note: comments });
      } finally {
        setLostSaving(false);
        setLostPrompt(null);
      }
    },
    [updateLeadStatus]
  );

  // Follow-up quick actions: reschedule to a specific date (or clear it),
  // used by the CRM panel's inline Reschedule / Snooze / Complete buttons so
  // agents can act on the "13 days overdue" pill without leaving the chat.
  const updateLeadFollowUp = useCallback(
    async (nextFollowUpAt) => {
      const leadId = selectedChat?.leadId?._id;
      if (!leadId) return;
      const userId = getUserId();
      const payload = nextFollowUpAt === null
        ? { nextFollowUpAt: null, performedBy: userId }
        : { nextFollowUpAt: new Date(nextFollowUpAt).toISOString(), performedBy: userId };
      const res = await authFetch(`/api/automation/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setLeadDetail(data.data);
        setSelectedChat((prev) => ({
          ...prev,
          leadId: { ...prev.leadId, nextFollowUpAt: data.data?.nextFollowUpAt ?? null },
        }));
        toast.success(nextFollowUpAt === null ? 'Follow-up cleared' : 'Follow-up rescheduled');
      } else {
        toast.error(data.error || 'Failed to update follow-up');
      }
    },
    [selectedChat],
  );

  const addNote = useCallback(
    async (note) => {
      if (!note.trim() || !selectedChat?.leadId?._id) return;
      const userId = getUserId();
      const res = await authFetch(`/api/automation/leads/${selectedChat.leadId._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim(), performedBy: userId })
      });
      const data = await res.json();
      if (data.success) {
        setLeadDetail(data.data);
        toast.success('Note saved');
      }
    },
    [selectedChat]
  );

  const initiateCall = useCallback(async () => {
    const lead = selectedChat?.leadId;
    if (!lead?.phone) return toast.error('No phone');
    try {
      const res = await authFetch('/api/automation/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          businessId: localStorage.getItem('businessId'),
          leadId: lead._id,
          leadPhone: lead.phone
        })
      });
      const result = await res.json();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('lfg-initiate-call', { detail: result.data }));
      } else window.location.href = `tel:${lead.phone}`;
    } catch {
      window.location.href = `tel:${lead.phone}`;
    }
  }, [selectedChat]);

  return {
    conversations: filteredConversations,
    allCount: conversations.length,
    hasMoreConversations: convHasMore,
    loadingMoreConversations,
    loadMoreConversations,
    selectedChat,
    leadDetail,
    conversationDetail,
    labels,
    currentUserId,
    searchResults,
    messages,
    teamMembers,
    templates,
    intelligence,
    loading,
    messagesLoading,
    filter,
    setFilter,
    viewCounts,
    channelFilter,
    setChannelFilter,
    search,
    setSearch,
    selectChat,
    sendMessage,
    intervene,
    releaseIntervene,
    assignChat,
    messageAction,
    claimConversation,
    updateConversation,
    markDone,
    assignToMe,
    assignTo,
    realtimeConnected: realtime.connected,
    toggleLabel,
    updateLeadStatus,
    lostPrompt,
    lostSaving,
    cancelLostPrompt,
    confirmLostReason,
    updateLeadFollowUp,
    addNote,
    initiateCall,
    loadOlderMessages,
    hasMoreMessages,
    loadingMore,
    emailSubject,
    setEmailSubject,
    emailCc,
    setEmailCc,
    emailBcc,
    setEmailBcc,
    saveEmailDraft,
    conversationAction,
    refresh: () => fetchConversations(true)
  };
}
