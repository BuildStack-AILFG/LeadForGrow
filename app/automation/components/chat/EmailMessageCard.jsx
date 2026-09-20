'use client';

import { useState, useMemo } from 'react';
import { Star, Trash2, CornerUpLeft, ChevronUp, ChevronDown, Paperclip, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { AttachmentCards, EmailHtmlBody, InitialAvatar, FailedIndicator } from './MessageBubble';
import { ORIGIN_META } from './constants';
import { splitQuotedBody, snippetOf, formatCardDate, senderOf, recipientLine } from '@/lib/omnichannel/emailThread';

/**
 * One email in a thread, drawn like an email (not a chat bubble): full-width card, sender / recipients / date in a header,
 * body below, attachments at the bottom, quoted history behind a "…" toggle. Sent mail has a green left edge, received mail
 * a neutral one, failed sends a red one. Long threads collapse older cards to a single line (see EmailThread.jsx).
 *
 * Props: message, conversation, onAction(messageId, 'reply'|'star'|'unstar'|'trash'), collapsed, onToggle,
 * canCollapse (show the collapse chevron), showSubject (subject changed since the thread started).
 */
export default function EmailMessageCard({ message, conversation, onAction, collapsed = false, onToggle, canCollapse = false, showSubject = false }) {
  const [showPlain, setShowPlain] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const { outgoing, name, email } = senderOf(message, conversation);
  const failed = outgoing && message.status === 'failed';
  const rawBody = message.content?.body || '';
  const { newBody, quotedBody } = useMemo(() => splitQuotedBody(rawBody), [rawBody]);
  const html = message.content?.html || '';
  const showRich = Boolean(html) && !showPlain;
  const attachments = Array.isArray(message.content?.attachments) ? message.content.attachments : [];
  const date = formatCardDate(message.timestamp);
  const origin = ORIGIN_META[message.origin];

  const edge = failed
    ? 'border-l-red-500 dark:border-l-red-400'
    : outgoing
      ? 'border-l-[#1F8A5E] dark:border-l-[#2fb37f]'
      : 'border-l-slate-300 dark:border-l-slate-600';

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded="false"
        title="Show message"
        className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded border border-slate-200 dark:border-slate-800 border-l-[3px] ${edge} bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 transition-colors`}
      >
        <InitialAvatar name={name} />
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-shrink-0 max-w-[160px] truncate">{name}</span>
        <span className="flex-1 min-w-0 text-xs text-slate-500 dark:text-slate-400 truncate">{snippetOf(message)}</span>
        {attachments.length > 0 && <Paperclip className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-label="Has attachments" />}
        <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums flex-shrink-0">{date}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
      </button>
    );
  }

  const iconBtn = 'p-1.5 rounded text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <article className={`rounded border border-slate-200 dark:border-slate-800 border-l-[3px] ${edge} bg-white dark:bg-slate-900 shadow-[0_1px_0.5px_rgba(11,20,26,0.06)]`}>
      <header className="flex items-start gap-3 px-4 pt-3 pb-2">
        <InitialAvatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</span>
            {email && <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">&lt;{email}&gt;</span>}
            {origin && (
              <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider border rounded px-1.5 py-[1px] ${origin.bg}`}>{origin.label}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{recipientLine(message, conversation)}</p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums mr-1.5">{date}</span>
          {outgoing && !failed && (
            <span className="mr-1 text-slate-400 dark:text-slate-500" title={message.status === 'delivered' || message.status === 'read' ? 'Delivered' : 'Sent'}>
              {message.status === 'sending' ? <Clock className="w-3.5 h-3.5" /> : message.status === 'delivered' || message.status === 'read' ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            </span>
          )}
          {onAction && (
            <>
              <button type="button" onClick={() => onAction(message._id, 'reply')} className={`${iconBtn} hover:text-blue-600 dark:hover:text-blue-400`} title="Reply to this message" aria-label="Reply to this message">
                <CornerUpLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onAction(message._id, message.starred ? 'unstar' : 'star')}
                className={`${iconBtn} ${message.starred ? 'text-green-600 dark:text-green-400' : ''}`}
                title={message.starred ? 'Remove star' : 'Star message'}
                aria-label={message.starred ? 'Remove star' : 'Star message'}
              >
                <Star className="w-4 h-4" fill={message.starred ? 'currentColor' : 'none'} />
              </button>
              <button type="button" onClick={() => onAction(message._id, 'trash')} className={`${iconBtn} hover:text-rose-600 dark:hover:text-rose-400`} title="Delete message" aria-label="Delete message">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {canCollapse && (
            <button type="button" onClick={onToggle} className={iconBtn} title="Collapse" aria-label="Collapse message" aria-expanded="true">
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {failed && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">Not delivered</span>
          <span className="ml-auto"><FailedIndicator message={message} /></span>
        </div>
      )}

      <div className="px-4 pb-3">
        {showSubject && message.subject && (
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">{message.subject}</p>
        )}

        {showRich ? (
          // Marketing / rich emails carry their own inline colours (often dark text), so in dark mode they sit on a white
          // "paper" panel instead of the dark card — otherwise dark-on-dark text is unreadable.
          <div className="dark:bg-white dark:text-slate-900 dark:rounded dark:px-3 dark:py-2 text-slate-800">
            <EmailHtmlBody html={html} />
          </div>
        ) : newBody ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">{newBody}</p>
        ) : null}

        {message.type === 'email' && quotedBody && !showRich && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setQuoteOpen((v) => !v)}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={quoteOpen ? 'Hide quoted history' : 'Show quoted history'}
              aria-expanded={quoteOpen}
            >
              <span className="text-[13px] tracking-wide font-bold">…</span>
            </button>
            {quoteOpen && (
              <div className="mt-1 pl-3 border-l-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-[12px] leading-[1.4] whitespace-pre-wrap break-words">
                {quotedBody}
              </div>
            )}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <AttachmentCards attachments={attachments} />
          </div>
        )}

        {html && newBody && (
          <button
            type="button"
            onClick={() => setShowPlain((v) => !v)}
            className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2"
          >
            {showPlain ? 'Show rich view' : 'Show plain text'}
          </button>
        )}
      </div>
    </article>
  );
}
