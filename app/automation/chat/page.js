'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useChatInbox } from '../hooks/useChatInbox';
import ChatSidebar from '../components/chat/ChatSidebar';
import EmailFolderBar from '../components/chat/EmailFolderBar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import AiReplyBar from '../components/ai/AiReplyBar';
import CRMProfilePanel from '../components/chat/CRMProfilePanel';
import OutOfWindowTemplateBar, { useIsWithin24hWindow } from '../components/chat/OutOfWindowTemplateBar';
import { useConfirm } from '@/app/components/ConfirmProvider';

function ChatInboxContent() {
  const inbox = useChatInbox();
  const confirm = useConfirm();
  const [mobileView, setMobileView] = useState('list');
  const [profileOpen, setProfileOpen] = useState(false);
  const [emailFolder, setEmailFolder] = useState('inbox');

  const [aiReplyText, setAiReplyText] = useState(null);

  const canReply =
    inbox.selectedChat?.channel === 'whatsapp'
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
    switch (emailFolder) {
      case 'sent':
        return {
          visibleMessages: inbox.messages.filter(
            (m) => m.direction === 'outgoing' && !m.isDeleted
          ),
          emptyLabel: 'No sent messages in this conversation yet.',
        };
      case 'drafts':
        // Drafts live in the EmailDraft collection — not the Message list.
        // Wire it to /api/automation/inbox/email/folders?folder=drafts later.
        return {
          visibleMessages: [],
          emptyLabel: 'Scheduled drafts appear here. Use "Save draft" in the composer to add one.',
        };
      case 'starred':
        return {
          visibleMessages: inbox.messages.filter((m) => m.starred && !m.isDeleted),
          emptyLabel: 'No starred messages. Hover any message and click the ★ to star it.',
        };
      case 'trash':
        return {
          visibleMessages: inbox.messages.filter((m) => m.isDeleted),
          emptyLabel: 'Trash is empty. Hover any message and click the 🗑 to move it here.',
        };
      case 'inbox':
      default:
        return {
          visibleMessages: inbox.messages.filter((m) => !m.isDeleted),
          emptyLabel: 'No messages yet in this conversation.',
        };
    }
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
      const match = inbox.conversations.find(
        (c) => c.leadId?._id === result.item._id || c.leadId === result.item._id
      );
      if (match) {
        inbox.selectChat(match);
        setMobileView('chat');
      }
    }
    inbox.setSearch('');
  };

  return (
    <div className="flex h-[calc(100vh-0px)] bg-[#f8f9fc] dark:bg-slate-950 overflow-hidden">
      <div
        className={`${mobileView === 'list' ? 'flex' : 'hidden'} lg:flex h-full flex-shrink-0 w-full lg:w-[380px] xl:w-[420px] 2xl:w-[460px]`}
      >
        <ChatSidebar
          conversations={inbox.conversations}
          selectedId={inbox.selectedChat?._id}
          filter={inbox.filter}
          onFilterChange={inbox.setFilter}
          channelFilter={inbox.channelFilter}
          onChannelFilterChange={inbox.setChannelFilter}
          search={inbox.search}
          onSearchChange={inbox.setSearch}
          searchResults={inbox.searchResults}
          onSelectSearchResult={handleSearchResult}
          onSelect={(chat) => {
            inbox.selectChat(chat);
            setMobileView('chat');
          }}
          loading={inbox.loading}
          hasMoreConversations={inbox.hasMoreConversations}
          loadingMoreConversations={inbox.loadingMoreConversations}
          onLoadMoreConversations={inbox.loadMoreConversations}
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
          onProfile={() => setProfileOpen(true)}
          onIntervene={inbox.intervene}
          onReleaseIntervene={inbox.releaseIntervene}
          onUpdateConversation={inbox.updateConversation}
          onClaim={inbox.claimConversation}
          onAction={inbox.conversationAction}
          currentUserId={inbox.currentUserId}
        />

        {inbox.selectedChat ? (
          <>
            {inbox.selectedChat?.channel === 'email' && (
              <EmailFolderBar active={emailFolder} onChange={setEmailFolder} />
            )}
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
            <MessageList
              messages={visibleMessages}
              loading={inbox.messagesLoading}
              hasMore={inbox.hasMoreMessages}
              onLoadMore={inbox.loadOlderMessages}
              loadingMore={inbox.loadingMore}
              onMessageAction={inbox.messageAction}
              emptyLabel={emptyLabel}
              // Passed so MessageBubble's EmailSenderHeader can fall back
              // to the conversation's participant when a specific Message's
              // content.participantName/Email aren't populated (older rows
              // saved before that field became standard).
              conversation={inbox.selectedChat}
            />
            {canReply && !showTemplateBar && (
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
                leadName={inbox.selectedChat?.leadId?.name}
                lead={inbox.selectedChat?.leadId}
                onSend={(template) =>
                  inbox.sendMessage('', { template })
                }
              />
            ) : (
              <ChatInput
                canSend={canReply}
                hasSelection={!!inbox.selectedChat}
                channel={inbox.selectedChat?.channel || 'whatsapp'}
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
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Unified Inbox</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">WhatsApp, Instagram & Email — select a conversation to reply.</p>
          </div>
        )}
      </main>

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
      />

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
    </div>
  );
}

export default function ChatInboxPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <ChatInboxContent />
    </Suspense>
  );
}
