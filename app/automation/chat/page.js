'use client';

import { htmlToPlainText } from '@/lib/omnichannel/draftFields';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { MessageSquare, FileText, Trash2 } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { useChatInbox } from '../hooks/useChatInbox';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import AiReplyBar from '../components/ai/AiReplyBar';
import CRMProfilePanel from '../components/chat/CRMProfilePanel';
import OutOfWindowTemplateBar, { useIsWithin24hWindow } from '../components/chat/OutOfWindowTemplateBar';
import LostReasonModal from '../components/leads/LostReasonModal';
import { makeNewChat, isNewChat } from '@/lib/omnichannel/newChat';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/app/components/ConfirmProvider';
import PostContextCard from '../components/chat/PostContextCard';

const PROFILE_COLLAPSED_KEY = 'lfg_ui_inbox_profile_collapsed';

function ChatInboxContent() {
  // Email folder (Inbox/Sent/Drafts/Trash/Spam/Starred) — declared before the
  // inbox hook so it can drive the conversation-list query for the email tab.
  const [emailFolder, setEmailFolder] = useState('inbox');
  const [socialFilter, setSocialFilter] = useState('all');
  const inbox = useChatInbox({ emailFolder, socialFilter });
  const confirm = useConfirm();
  const [mobileView, setMobileView] = useState('list');
  // Customer profile panel. Below the xl breakpoint it is an overlay (profileOpen); from xl up it is a right column that is
  // open by default and can be closed with the X / the header button — the choice is remembered per browser (lfg_ui_ keys
  // also survive logout, see lib/clientStorage.js).
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCollapsed, setProfileCollapsed] = useState(false);
  useEffect(() => {
    try { if (localStorage.getItem(PROFILE_COLLAPSED_KEY) === '1') setProfileCollapsed(true); } catch { /* storage blocked: stay open */ }
  }, []);
  const setCollapsed = (collapsed) => {
    setProfileCollapsed(collapsed);
    try { localStorage.setItem(PROFILE_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch { /* not remembered */ }
  };
  const handleProfileToggle = () => {
    const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;
    if (wide) setCollapsed(!profileCollapsed);
    else setProfileOpen(true);
  };
  // The fixed Help / Grovia buttons live in the bottom-right corner (~72px). Reserve that strip on the message list and the
  // composer whenever they would sit over the chat: always below xl (profile is an overlay), and at xl when the profile panel
  // is closed. With the panel open they float over the panel instead (which reserves its own space).
  const listGutter = profileCollapsed ? 'pr-[76px]' : 'pr-[76px] xl:pr-4';
  const composerGutter = profileCollapsed ? 'pr-[76px]' : 'pr-[76px] xl:pr-0';

  const [aiReplyText, setAiReplyText] = useState(null);
  // Whether the email reply composer is open. Drives the AI-reply tone bar's
  // visibility so an opened email thread stays clean until the user clicks Reply.
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);

  // AI reply assist is a paid/important feature — the tone bar appears only when
  // it's enabled AND a provider is configured. Fetched once per mount; defaults
  // to hidden until confirmed so it never flashes for tenants without it.
  const [aiReplyEnabled, setAiReplyEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    authFetch('/api/ai/settings')
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return;
        const s = d.data || {};
        setAiReplyEnabled(!!s.configured && s.enabled !== false && s.replyAssistEnabled !== false);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Drafts folder was a hardcoded-empty stub — this actually fetches from the
  // EmailDraft collection (the GET endpoint already existed and worked, it just had
  // no caller) and scopes the results to the currently open conversation.
  const [emailDrafts, setEmailDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const conversationId = inbox.selectedChat?._id;
  const isEmailChat = inbox.selectedChat?.channel === 'email';

  useEffect(() => {
    if (emailFolder !== 'drafts' || !isEmailChat || !conversationId) {
      setEmailDrafts([]);
      return undefined;
    }
    let cancelled = false;
    setDraftsLoading(true);
    authFetch('/api/automation/inbox/email/folders?folder=drafts')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        setEmailDrafts(
          (data.data || []).filter((d) => String(d.conversationId || '') === String(conversationId))
        );
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDraftsLoading(false); });
    return () => { cancelled = true; };
  }, [emailFolder, isEmailChat, conversationId]);

  const continueDraft = (draft) => {
    // Older drafts were saved as HTML only (no bodyText), so fall back to the HTML.
    const text = draft.bodyText || htmlToPlainText(draft.bodyHtml);
    const emails = (list) => (list || []).map((c) => c?.email).filter(Boolean).join(', ');
    if (draft.subject) inbox.setEmailSubject(draft.subject);
    inbox.setEmailCc(emails(draft.cc));
    inbox.setEmailBcc(emails(draft.bcc));
    window.dispatchEvent(new CustomEvent('lfg:insert-reply', { detail: { text } }));
    setEmailFolder('inbox');
  };

  const deleteDraft = async (draft) => {
    if (!(await confirm({ title: 'Delete draft', message: 'Delete this draft?', confirmLabel: 'Delete', danger: true }))) return;
    await authFetch(`/api/automation/inbox/email/folders?id=${draft._id}`, { method: 'DELETE' });
    setEmailDrafts((prev) => prev.filter((d) => d._id !== draft._id));
  };

  const newChat = isNewChat(inbox.selectedChat);
  // A new chat needs no take-over: its composer is the template picker (the only thing WhatsApp allows as a first message).
  const canReply =
    newChat ? true
    : inbox.selectedChat?.channel === 'whatsapp'
      ? inbox.selectedChat?.inboxStatus === 'intervened' || inbox.selectedChat?.status === 'intervened'
      : !!inbox.selectedChat;

  const isWithinWindow = useIsWithin24hWindow(inbox.selectedChat, inbox.messages);
  const isWhatsApp = inbox.selectedChat?.channel === 'whatsapp';
  const showTemplateBar = canReply && isWhatsApp && !isWithinWindow;

  // Global keyboard shortcuts — Gmail-style. Ignored when the user is
  // typing in an input/textarea/contenteditable so shortcuts don't
  // trigger while composing. `?` opens a help toast that shows every
  // available shortcut so users don't need to memorize.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (document.activeElement?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const conversations = inbox.conversations || [];
      const idx = conversations.findIndex((c) => c._id === inbox.selectedChat?._id);

      switch (e.key) {
        case 'j': {  // next conversation
          e.preventDefault();
          const next = conversations[Math.min(idx + 1, conversations.length - 1)];
          if (next) inbox.selectChat(next);
          break;
        }
        case 'k': {  // previous conversation
          e.preventDefault();
          const prev = conversations[Math.max(idx - 1, 0)];
          if (prev) inbox.selectChat(prev);
          break;
        }
        case 'e':  // archive
          e.preventDefault();
          if (inbox.selectedChat) inbox.updateConversation({ isArchived: !inbox.selectedChat.isArchived });
          break;
        case '#':  // trash / delete
          e.preventDefault();
          if (inbox.selectedChat) {
            confirm({ title: 'Delete conversation', message: 'Delete this conversation?', confirmLabel: 'Delete', danger: true })
              .then((ok) => { if (ok) inbox.conversationAction?.('delete'); });
          }
          break;
        case 's':  // star / favorite
          e.preventDefault();
          if (inbox.selectedChat) inbox.updateConversation({ isFavorite: !inbox.selectedChat.isFavorite });
          break;
        case '?':
          e.preventDefault();
          import('react-hot-toast').then(({ toast }) => {
            toast(
              'Shortcuts:\nj / k — next / previous\ne — archive\ns — star\n# — delete',
              { duration: 5000, style: { whiteSpace: 'pre-line' } }
            );
          });
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inbox.conversations, inbox.selectedChat, inbox.selectChat, inbox.updateConversation, inbox.conversationAction, confirm]);

  // Client-side folder filter. Runs only for email conversations — WhatsApp
  // and Instagram have no folder concept, so we always show everything.
  // Filter is deliberately in the page (not the hook) because it's a pure
  // view-level derivation and the hook already returns all messages.
  const { visibleMessages, emptyLabel } = useMemo(() => {
    if (inbox.selectedChat?.channel !== 'email') {
      return { visibleMessages: inbox.messages, emptyLabel: null };
    }
    // Drafts are a special right-pane view (EmailDraft, not thread messages).
    if (emailFolder === 'drafts') {
      return {
        visibleMessages: [],
        emptyLabel: 'Saved drafts appear here. Use "Save draft" in the composer to add one.',
      };
    }
    // Folders now filter the conversation LIST (in the sidebar), so an open
    // thread always shows its full history — not a per-folder slice.
    return {
      visibleMessages: inbox.messages.filter((m) => !m.isDeleted),
      emptyLabel: 'No messages yet in this conversation.',
    };
  }, [inbox.messages, emailFolder, inbox.selectedChat?.channel]);

  const aiSuggestion = inbox.intelligence?.nextAction?.action
    ? `Hi ${inbox.selectedChat?.leadId?.name?.split(' ')[0] || 'there'}, ${inbox.intelligence.nextAction.action.toLowerCase()}.`
    : null;

  const handleSearchResult = (result) => {
    if (result.type === 'conversation') {
      const match = inbox.conversations.find((c) => c._id === result.item._id) || result.item;
      inbox.selectChat(match);
      setMobileView('chat');
    } else if (result.type === 'lead') {
      const lead = result.item;
      // The search API says which conversation (WhatsApp first) belongs to the lead; prefer the loaded copy of it.
      const known = lead.conversation
        ? inbox.conversations.find((c) => c._id === lead.conversation._id) || lead.conversation
        : null;
      if (known) {
        inbox.selectChat(known);
        setMobileView('chat');
      } else if (lead.phone) {
        // Never messaged: there is no conversation yet. Open a NEW CHAT in the normal layout (header, thread, CRM panel);
        // WhatsApp only allows an approved template as the first message, so the composer is the template picker.
        inbox.selectChat(makeNewChat(lead));
        setMobileView('chat');
      } else {
        toast.error(`${lead.name || 'This lead'} has no phone number, so there is no WhatsApp chat to start. Open the lead and add one.`);
      }
    }
    inbox.setSearch('');
  };

  // The conversation a new chat creates (its first template) is not in the current list view (e.g. Needs reply: we wrote last),
  // so ask the server for it instead of waiting for it to appear in the list.
  const findLeadConversation = async (lead) => {
    try {
      const res = await authFetch(`/api/automation/inbox/search?type=leads&q=${encodeURIComponent(lead.phone || lead.name || '')}`);
      const data = await res.json();
      return (data.data?.leads || []).find((l) => String(l._id) === String(lead._id))?.conversation || null;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] bg-[#f8f9fc] dark:bg-slate-950 overflow-hidden font-[family-name:var(--font-whatsapp)]">
      <div
        className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex h-full flex-shrink-0 w-full lg:w-[320px] xl:w-[360px] 2xl:w-[380px]`}
      >
        <ChatSidebar
          conversations={inbox.conversations}
          selectedId={inbox.selectedChat?._id}
          filter={inbox.filter}
          onFilterChange={inbox.setFilter}
          channelFilter={inbox.channelFilter}
          onChannelFilterChange={inbox.setChannelFilter}
          emailFolder={emailFolder}
          onEmailFolderChange={setEmailFolder}
          socialFilter={socialFilter}
          onSocialFilterChange={setSocialFilter}
          search={inbox.search}
          onSearchChange={inbox.setSearch}
          searchResults={inbox.searchResults}
          onSelectSearchResult={handleSearchResult}
          viewCounts={inbox.viewCounts}
          onMarkDone={inbox.markDone}
          onAssignToMe={inbox.assignToMe}
          onAssignTo={inbox.assignTo}
          teamMembers={inbox.teamMembers}
          currentUserId={inbox.currentUserId}
          onSelect={(chat) => {
            inbox.selectChat(chat);
            setMobileView('chat');
          }}
          loading={inbox.loading}
          hasMoreConversations={inbox.hasMoreConversations}
          loadingMoreConversations={inbox.loadingMoreConversations}
          onLoadMoreConversations={inbox.loadMoreConversations}
          onRefresh={inbox.refresh}
          realtimeConnected={inbox.realtimeConnected}
        />
      </div>

      <main
        className={`flex flex-col flex-1 min-w-0 bg-[#eef0f3] dark:bg-slate-900/50 ${
          mobileView === 'chat' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <ChatHeader
          chat={inbox.selectedChat}
          showBack={mobileView === 'chat'}
          onBack={() => setMobileView('list')}
          onCall={inbox.initiateCall}
          onAssign={inbox.assignChat}
          onSchedule={() => {}}
          onWon={() => inbox.updateLeadStatus('converted')}
          onLost={() => inbox.updateLeadStatus('lost')}
          onProfile={handleProfileToggle}
          profileOpen={!profileCollapsed}
          onIntervene={inbox.intervene}
          onReleaseIntervene={inbox.releaseIntervene}
          onUpdateConversation={inbox.updateConversation}
          onClaim={inbox.claimConversation}
          onAction={inbox.conversationAction}
          currentUserId={inbox.currentUserId}
        />

        {inbox.selectedChat ? (
          <>
            {/* Folder navigation now lives in the sidebar (it filters the list),
                so the per-thread folder bar was removed to avoid duplication. */}
            {/* Post context — for an Instagram/Facebook comment thread, show
                which post the comment came from (thumbnail + caption + link). */}
            {(() => {
              const c = inbox.selectedChat;
              const isComment = (c.channel === 'instagram' || c.channel === 'facebook')
                && /^(ig|fb)_comment:/.test(String(c.participantId || ''));
              const postId = c.metadata?.lastMediaId || c.metadata?.lastPostId;
              return isComment && postId ? <PostContextCard channel={c.channel} postId={postId} /> : null;
            })()}
            {/* Sticky email subject bar — frozen at the top of the pane so
                agents don't lose thread context when scrolling through a
                long conversation. Only shown for email channel where the
                subject actually matters. */}
            {inbox.selectedChat?.channel === 'email' && (() => {
              const firstEmailMsg = visibleMessages.find((m) => m.type === 'email' && m.subject);
              const subject = firstEmailMsg?.subject || inbox.selectedChat.lastMessagePreview || '(no subject)';
              const cleanSubject = subject.replace(/^(Re:|Fwd?:|Fw:)\s*/i, '');
              const msgCount = visibleMessages.filter((m) => m.type === 'email').length;
              return (
                <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-baseline gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex-1" title={subject}>
                    {cleanSubject}
                  </p>
                  {msgCount > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex-shrink-0">
                      {msgCount} message{msgCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              );
            })()}
            {emailFolder === 'drafts' ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {draftsLoading ? (
                  <p className="text-center text-sm text-slate-400 py-12">Loading drafts…</p>
                ) : emailDrafts.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-12">{emptyLabel}</p>
                ) : (
                  emailDrafts.map((draft) => (
                    <div key={draft._id} className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {draft.subject || '(no subject)'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {draft.bodyText || 'Empty draft'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Saved {new Date(draft.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => continueDraft(draft)} className="px-2.5 py-1.5 text-xs font-semibold text-brand-ink bg-brand-tint hover:bg-[#dcefe6] dark:hover:bg-slate-700 rounded">
                          Continue editing
                        </button>
                        <button type="button" onClick={() => deleteDraft(draft)} className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete draft">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <MessageList
                messages={visibleMessages}
                loading={inbox.messagesLoading}
                hasMore={inbox.hasMoreMessages}
                onLoadMore={inbox.loadOlderMessages}
                loadingMore={inbox.loadingMore}
                onMessageAction={inbox.messageAction}
                emptyLabel={newChat ? 'No messages yet. Send an approved template below to start the conversation.' : emptyLabel}
                gutterClass={listGutter}
                // Passed so MessageBubble's EmailSenderHeader can fall back
                // to the conversation's participant when a specific Message's
                // content.participantName/Email aren't populated (older rows
                // saved before that field became standard).
                conversation={inbox.selectedChat}
              />
            )}
            {aiReplyEnabled && canReply && !showTemplateBar && (inbox.selectedChat?.channel !== 'email' || emailComposerOpen) && (
              <AiReplyBar
                channel={inbox.selectedChat?.channel || 'whatsapp'}
                customerName={inbox.selectedChat?.leadId?.name}
                lastMessage={inbox.messages.filter((m) => m.direction === 'incoming').pop()?.content?.body}
                leadId={inbox.selectedChat?.leadId?._id || inbox.selectedChat?.leadId}
                conversationId={inbox.selectedChat?._id}
                onApply={(text) => {
                  setAiReplyText(text);
                  // Push the text straight into the composer instead of only
                  // populating the passive suggestion tile (which needed a
                  // second click). ChatInput listens for this and fills the
                  // active reply box (textarea or email editor).
                  window.dispatchEvent(new CustomEvent('lfg:insert-reply', { detail: { text } }));
                }}
                onSend={async (text) => inbox.sendMessage(text)}
              />
            )}
            {showTemplateBar ? (
              <OutOfWindowTemplateBar
                firstContact={newChat}
                leadName={inbox.selectedChat?.leadId?.name}
                lead={inbox.selectedChat?.leadId}
                onSend={async (template) => {
                  const lead = inbox.selectedChat?.leadId;
                  const ok = await inbox.sendMessage('', { template });
                  if (ok === false) throw new Error('Could not send the template');
                  if (newChat && lead) {
                    // The server created the conversation with that message: refresh the list and switch to the real one.
                    inbox.refresh();
                    const conversation = await findLeadConversation(lead);
                    if (conversation) inbox.selectChat(conversation);
                  }
                  return ok;
                }}
              />
            ) : (
              <ChatInput
                canSend={canReply}
                hasSelection={!!inbox.selectedChat}
                channel={inbox.selectedChat?.channel || 'whatsapp'}
                fabGutter={composerGutter}
                conversationId={inbox.selectedChat?._id}
                templates={inbox.templates}
                aiSuggestion={aiReplyText || aiSuggestion}
                onSend={inbox.sendMessage}
                onIntervene={inbox.intervene}
                onSaveDraft={inbox.selectedChat?.channel === 'email' ? inbox.saveEmailDraft : undefined}
                emailSubject={inbox.emailSubject}
                onEmailSubjectChange={inbox.setEmailSubject}
                emailCc={inbox.emailCc}
                onEmailCcChange={inbox.setEmailCc}
                emailBcc={inbox.emailBcc}
                onEmailBccChange={inbox.setEmailBcc}
                // Pin sender identity when replying on an existing thread.
                // The Conversation carries its own emailAccountId (Step 4);
                // ChatInput uses this to lock the From-picker so replies
                // always send from the mailbox that started the thread.
                pinnedEmailAccountId={inbox.selectedChat?.emailAccountId || null}
                onExpandedChange={setEmailComposerOpen}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Unified Inbox</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">WhatsApp, Instagram & Email — select a conversation to reply.</p>
          </div>
        )}
      </main>

      {!profileCollapsed && (
        <CRMProfilePanel
          chat={inbox.selectedChat}
          leadDetail={inbox.leadDetail}
          conversationDetail={inbox.conversationDetail}
          intelligence={inbox.intelligence}
          teamMembers={inbox.teamMembers}
          labels={inbox.labels}
          onStatusChange={inbox.updateLeadStatus}
          onAssign={inbox.assignChat}
          onAddNote={inbox.addNote}
          onToggleLabel={inbox.toggleLabel}
          onUpdateFollowUp={inbox.updateLeadFollowUp}
          onClose={() => setCollapsed(true)}
        />
      )}

      {profileOpen && inbox.selectedChat && (
        <CRMProfilePanel
          mobile
          chat={inbox.selectedChat}
          leadDetail={inbox.leadDetail}
          conversationDetail={inbox.conversationDetail}
          intelligence={inbox.intelligence}
          teamMembers={inbox.teamMembers}
          labels={inbox.labels}
          onStatusChange={inbox.updateLeadStatus}
          onAssign={inbox.assignChat}
          onAddNote={inbox.addNote}
          onToggleLabel={inbox.toggleLabel}
          onUpdateFollowUp={inbox.updateLeadFollowUp}
          onClose={() => setProfileOpen(false)}
        />
      )}

      <LostReasonModal
        open={!!inbox.lostPrompt}
        leadName={inbox.lostPrompt?.leadName}
        variant="lost"
        saving={inbox.lostSaving}
        onCancel={inbox.cancelLostPrompt}
        onConfirm={inbox.confirmLostReason}
      />
    </div>
  );
}

export default function ChatInboxPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <ChatInboxContent />
    </Suspense>
  );
}
