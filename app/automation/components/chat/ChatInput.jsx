'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Smile, Paperclip, Sparkles, Hand, StickyNote, MessageSquare,
  Bold, Italic, Link2, Clock, Save, Mail, ChevronDown, ChevronUp, PenLine,
} from 'lucide-react';
import { QUICK_EMOJIS } from './constants';
import MediaAttachmentStrip from './MediaAttachmentStrip';
import { useMediaUpload } from '@/app/automation/hooks/useMediaUpload';
import { authFetch } from '@/lib/apiClient';

export default function ChatInput({
  canSend,
  hasSelection = false,
  channel = 'whatsapp',
  templates = [],
  aiSuggestion,
  onSend,
  onIntervene,
  onSaveDraft,
  emailSubject = '',
  onEmailSubjectChange,
  emailCc = '',
  onEmailCcChange,
  // Set by the parent for email replies — pins the send to the conversation's
  // original mailbox. Read-only in that case; picker is hidden.
  pinnedEmailAccountId,
}) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('message');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const editorRef = useRef(null);
  const { uploads, uploadFile, removeUpload, retryUpload, clearUploads } = useMediaUpload();

  const isNote = mode === 'note';
  const isEmail = channel === 'email' && !isNote;
  const readyUploads = uploads.filter((u) => u.status === 'done');

  // Compact email composer: collapse to a slim bar until the user clicks
  // in. This reclaims ~50% of the pane height for the message thread —
  // agents were losing message context to composer chrome (subject / CC /
  // formatting / suggested-reply tile / emoji-attach-schedule row).
  // WhatsApp/Instagram composers stay as-is; only email needs this treatment.
  const [emailExpanded, setEmailExpanded] = useState(false);
  const collapsedEmail = isEmail && !emailExpanded && !text && !emailSubject && readyUploads.length === 0;

  // From-picker state — only fetched when the email composer is active.
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Signature-picker state. Auto-picks the default signature for the
  // current From mailbox; user can override via the toolbar icon.
  const [selectedSignatureId, setSelectedSignatureId] = useState('');
  const [signaturePickerOpen, setSignaturePickerOpen] = useState(false);

  // Draft auto-save state — shown as a tiny "Saved" indicator so users know
  // their work is safe if they close the tab. Debounced to avoid hammering
  // the API on every keystroke.
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const draftTimerRef = useRef(null);

  useEffect(() => {
    if (!isEmail || !onSaveDraft) return;
    // Don't autosave an empty draft (that'd create empty rows on every mount).
    const bodyContent = editorRef.current?.innerHTML?.trim();
    const hasContent = !!(bodyContent || emailSubject?.trim() || emailCc?.trim());
    if (!hasContent) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        onSaveDraft({
          subject: emailSubject,
          body: editorRef.current?.innerHTML,
          cc: emailCc,
          silent: true,
        });
        setDraftSavedAt(new Date());
      } catch {
        /* silent — user will notice a broken draft on next expand */
      }
    }, 2000);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [text, emailSubject, emailCc, isEmail, onSaveDraft]);

  useEffect(() => {
    if (!isEmail) return;
    let cancelled = false;
    (async () => {
      setAccountsLoading(true);
      try {
        const res = await authFetch('/api/automation/inbox/email-accounts');
        const data = await res.json();
        if (cancelled) return;
        const list = (data.data || []).filter((a) => a.status === 'active');
        setAccounts(list);
        // Priority: pinned (reply on existing thread) → default → first active.
        if (pinnedEmailAccountId && list.some((a) => a._id === pinnedEmailAccountId)) {
          setSelectedAccountId(pinnedEmailAccountId);
        } else {
          const def = list.find((a) => a.isDefault) || list[0];
          if (def) setSelectedAccountId(def._id);
        }
      } catch {
        /* silent — send will just fall back to legacy path */
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEmail, pinnedEmailAccountId]);

  // Whenever the effective From-account changes, auto-pick that account's
  // default signature. Users can still override via the picker below —
  // this just sets the sensible starting point every time.
  const effectiveAccountId = pinnedEmailAccountId || selectedAccountId;
  const effectiveAccount = accounts.find((a) => a._id === effectiveAccountId) || null;
  const accountSignatures = Array.isArray(effectiveAccount?.signatures)
    ? effectiveAccount.signatures
    : [];
  useEffect(() => {
    if (!isEmail) return;
    if (!accountSignatures.length) {
      setSelectedSignatureId('');
      return;
    }
    // Keep the current pick if it still belongs to this account; otherwise
    // reset to the account's default (or first entry).
    if (accountSignatures.some((s) => s.id === selectedSignatureId)) return;
    const def = accountSignatures.find((s) => s.isDefault) || accountSignatures[0];
    setSelectedSignatureId(def?.id || '');
  }, [effectiveAccountId, isEmail, accountSignatures.length]);

  const handleFiles = useCallback(async (files) => {
    for (const file of Array.from(files)) {
      try {
        await uploadFile(file);
      } catch {
        /* error shown in strip */
      }
    }
  }, [uploadFile]);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const body = isEmail && editorRef.current ? editorRef.current.innerHTML : text;
    const plainText = isEmail ? editorRef.current?.innerText || text : text;
    if (!plainText.trim() && !readyUploads.length) return;
    if (!isNote && !canSend) return;
    if (isNote && !hasSelection) return;

    const payload = {
      isInternal: isNote,
      bodyHtml: isEmail ? body : undefined,
      subject: isEmail ? emailSubject : undefined,
      cc: isEmail && emailCc ? emailCc.split(',').map((e) => ({ email: e.trim() })).filter((c) => c.email) : undefined,
      scheduledAt: scheduleOpen && scheduledAt ? scheduledAt : undefined,
      attachments: readyUploads.map((u) => ({
        url: u.url,
        fileName: u.name,
        mimeType: u.mimeType,
        size: u.size,
      })),
      media: readyUploads[0]
        ? { url: readyUploads[0].url, mimeType: readyUploads[0].mimeType, fileName: readyUploads[0].name }
        : undefined,
      // For email sends, the resolver on the backend needs this. Pinned wins;
      // otherwise picker choice; otherwise the backend's own default lookup.
      emailAccountId: isEmail
        ? pinnedEmailAccountId || selectedAccountId || undefined
        : undefined,
      // Which of the account's saved signatures to append. Backend falls
      // back to the account's default signature when this is absent.
      signatureId: isEmail && selectedSignatureId ? selectedSignatureId : undefined,
    };

    const ok = await onSend(plainText.trim(), payload);
    if (ok) {
      setText('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      clearUploads();
      setScheduleOpen(false);
      setScheduledAt('');
    }
  };

  const composerShell = (children) => (
    <div
      className={`flex-shrink-0 border-t transition-colors ${
        dragOver ? 'border-teal-400 bg-teal-50/50' : isNote ? 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {children}
    </div>
  );

  if (!canSend && !hasSelection) {
    return (
      <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
        <button type="button" onClick={onIntervene} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-teal-700 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded hover:bg-teal-100">
          <Hand className="w-4 h-4" /> Take over chat to reply
        </button>
      </div>
    );
  }

  if (!canSend && hasSelection) {
    return composerShell(
      <>
        <div className="px-3 pt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-green-600 text-white">
            <StickyNote className="w-3 h-3" /> Note only
          </span>
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 pt-2">
          <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add internal note..." className="flex-1 resize-none text-sm px-4 py-2.5 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded focus:outline-none focus:ring-2 focus:ring-green-500/20 max-h-32 min-h-[42px]" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} />
          <button type="submit" disabled={!text.trim()} className="p-2.5 rounded bg-green-600 text-white disabled:opacity-40 hover:bg-green-700"><Send className="w-4 h-4" /></button>
        </form>
      </>
    );
  }

  // Collapsed email view — one row, minimum footprint. Click anywhere on
  // the "Reply..." bar (or the small "Note" pill) to expand. This reclaims
  // ~200px for the message thread on email conversations, matching what
  // Gmail/Front do by default.
  if (collapsedEmail) {
    return composerShell(
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setEmailExpanded(true)}
          className="flex-1 text-left text-sm px-3 py-2 rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors"
        >
          Reply…
        </button>
        <button
          type="button"
          onClick={() => { setMode('note'); setEmailExpanded(true); }}
          className="inline-flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium rounded text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40"
          title="Add internal note"
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setEmailExpanded(true)}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-[#1D4B3E] hover:bg-[#163c32] rounded"
        >
          Compose
        </button>
      </div>
    );
  }

  return composerShell(
    <>
      <div className="flex items-center gap-1 px-3 pt-2">
        <button type="button" onClick={() => setMode('message')} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded ${!isNote ? 'bg-[#1D4B3E] text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <MessageSquare className="w-3 h-3" /> Reply
        </button>
        <button type="button" onClick={() => setMode('note')} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded ${isNote ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <StickyNote className="w-3 h-3" /> Note
        </button>
        {isEmail && (
          <button
            type="button"
            onClick={() => setEmailExpanded(false)}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
            title="Minimize composer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
        {isEmail && onSaveDraft && (
          <>
            {draftSavedAt && (
              <span className="text-[10px] text-emerald-600 mr-1" title={`Draft auto-saved at ${draftSavedAt.toLocaleTimeString()}`}>
                ✓ Saved
              </span>
            )}
            <button type="button" onClick={() => { onSaveDraft({ subject: emailSubject, body: editorRef.current?.innerHTML, cc: emailCc }); setDraftSavedAt(new Date()); }} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded-md">
              <Save className="w-3 h-3" /> Save draft
            </button>
          </>
        )}
      </div>

      {isEmail && !isNote && (
        <div className="px-3 pt-2 space-y-1.5">
          {/* From picker. Locked when replying on an existing thread — the
              immutable-sender rule prevents silent mid-conversation switches.
              When no accounts are connected, show a friendly nudge instead of
              a broken empty dropdown. */}
          {accountsLoading ? (
            <div className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
              Loading mailboxes…
            </div>
          ) : accounts.length === 0 ? (
            <div className="w-full text-xs px-3 py-1.5 bg-green-50 border border-green-200 rounded text-green-900 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span>
                No mailbox connected.{' '}
                <a href="/automation/settings/email" className="font-semibold underline">
                  Connect one
                </a>{' '}
                to send.
              </span>
            </div>
          ) : pinnedEmailAccountId ? (
            <div className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-medium">From:</span>
              <span>
                {accounts.find((a) => a._id === pinnedEmailAccountId)?.email || 'original mailbox'}
              </span>
              <span className="ml-auto text-[10px] text-slate-400">Locked to conversation</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500 font-medium shrink-0">From:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.displayName ? `${a.displayName} <${a.email}>` : a.email}
                    {a.type === 'shared' ? ' (shared)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <input type="text" value={emailSubject} onChange={(e) => onEmailSubjectChange?.(e.target.value)} placeholder="Subject" className="w-full text-sm px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <input type="text" value={emailCc} onChange={(e) => onEmailCcChange?.(e.target.value)} placeholder="CC (comma separated)" className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
          <div className="flex gap-1 text-slate-500">
            <button type="button" onClick={() => document.execCommand('bold')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Bold className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => document.execCommand('italic')} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Italic className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => { const url = prompt('URL'); if (url) document.execCommand('createLink', false, url); }} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Link2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <MediaAttachmentStrip uploads={uploads} onRemove={removeUpload} onRetry={retryUpload} />

      {aiSuggestion && !isNote && (
        <div className="px-4 pt-2">
          <button type="button" onClick={() => { setText(aiSuggestion); if (editorRef.current) editorRef.current.innerText = aiSuggestion; }} className="w-full text-left px-3 py-2 text-xs rounded-lg bg-teal-50/80 dark:bg-teal-950/20 border border-teal-100 text-slate-600 hover:border-teal-300">
            <span className="font-medium text-teal-700 flex items-center gap-1 mb-0.5"><Sparkles className="w-3 h-3" /> Suggested reply</span>
            {aiSuggestion.slice(0, 120)}{aiSuggestion.length > 120 ? '…' : ''}
          </button>
        </div>
      )}

      <div className="flex items-center gap-1 px-3 pt-2 text-slate-500">
        <div className="relative">
          <button type="button" onClick={() => { setEmojiOpen(!emojiOpen); setTemplatesOpen(false); }} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><Smile className="w-4 h-4" /></button>
          {emojiOpen && (
            <div className="absolute bottom-full left-0 mb-1 p-1.5 bg-white dark:bg-slate-900 border rounded shadow-lg grid grid-cols-4 gap-1 z-20">
              {QUICK_EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => { setText((t) => t + e); setEmojiOpen(false); }} className="text-lg p-1 hover:bg-[#F0F9F5] dark:hover:bg-slate-800 rounded">{e}</button>
              ))}
            </div>
          )}
        </div>
        {!isNote && (
          <button type="button" onClick={() => fileRef.current?.click()} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Attach file">
            <Paperclip className="w-4 h-4" />
          </button>
        )}
        <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
        {isEmail && (
          <button type="button" onClick={() => setScheduleOpen(!scheduleOpen)} className="p-2 rounded hover:bg-slate-100" title="Schedule send"><Clock className="w-4 h-4" /></button>
        )}
        {isEmail && accountSignatures.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSignaturePickerOpen((v) => !v)}
              className={`p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                selectedSignatureId &&
                !accountSignatures.find((s) => s.id === selectedSignatureId)?.isDefault
                  ? 'text-[#1D4B3E]'
                  : ''
              }`}
              title={`Signature: ${
                accountSignatures.find((s) => s.id === selectedSignatureId)?.name || 'None'
              }`}
            >
              <PenLine className="w-4 h-4" />
            </button>
            {signaturePickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSignaturePickerOpen(false)} />
                <div className="absolute bottom-full left-0 mb-1 z-20 w-56 rounded border border-slate-200 bg-white p-1.5 shadow-lg dark:bg-slate-900">
                  <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Signature
                  </p>
                  {accountSignatures.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSignatureId(s.id);
                        setSignaturePickerOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-xs hover:bg-[#F0F9F5] dark:hover:bg-slate-800 ${
                        s.id === selectedSignatureId ? 'bg-[#F0F9F5] dark:bg-slate-800' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {s.id === selectedSignatureId && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1D4B3E]" />
                        )}
                        <span className="truncate">{s.name}</span>
                      </span>
                      {s.isDefault && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSignatureId('');
                      setSignaturePickerOpen(false);
                    }}
                    className="mt-1 flex w-full items-center rounded border-t border-slate-100 px-2.5 py-2 text-left text-[11px] text-slate-500 hover:bg-[#F0F9F5] dark:hover:bg-slate-800"
                  >
                    No signature this email
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {!isNote && templates.length > 0 && (
          <div className="relative ml-auto">
            <button type="button" onClick={() => { setTemplatesOpen(!templatesOpen); setEmojiOpen(false); }} className="text-xs font-medium px-2.5 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700">Templates</button>
            {templatesOpen && (
              <div className="absolute bottom-full right-0 mb-1 w-56 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border rounded shadow-lg z-20 p-1.5 space-y-0.5">
                {templates.map((t) => (
                  <button key={t.id || t.name} type="button" onClick={() => { setText(t.body || ''); if (editorRef.current) editorRef.current.innerText = t.body || ''; setTemplatesOpen(false); }} className="w-full text-left px-2.5 py-2 text-xs rounded hover:bg-[#F0F9F5] dark:hover:bg-slate-800">
                    <span className="font-medium block">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {scheduleOpen && (
        <div className="px-3 pb-1">
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="text-xs px-2 py-1.5 border rounded w-full" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 pt-2">
        {isEmail && !isNote ? (
          <div ref={editorRef} contentEditable suppressContentEditableWarning className="flex-1 text-sm px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-[#1D4B3E]/20 max-h-48 min-h-[44px] overflow-y-auto" />
        ) : (
          <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} placeholder={isNote ? 'Add internal note...' : 'Type a message...'} className={`flex-1 resize-none text-sm px-4 py-2.5 border rounded focus:outline-none focus:ring-2 max-h-32 min-h-[42px] ${isNote ? 'bg-green-50/50 border-green-200 focus:ring-green-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-[#1D4B3E]/20'}`} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} />
        )}
        <button type="submit" disabled={!text.trim() && !readyUploads.length && !(isEmail && editorRef.current?.innerText?.trim())} className={`p-2.5 rounded text-white disabled:opacity-40 flex-shrink-0 ${isNote ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1D4B3E] hover:bg-[#163c32]'}`}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </>
  );
}
