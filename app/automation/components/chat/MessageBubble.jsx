'use client';

import { memo, useState, useMemo } from 'react';
import {
  Check, CheckCheck, Clock, StickyNote, Download, FileText, AlertCircle,
  Star, Trash2, RotateCcw, Image as ImageIcon, Film, Music, File as FileIcon,
  Reply, CornerUpLeft,
} from 'lucide-react';
import { formatFileSize } from '@/lib/omnichannel/mediaTypes';
import { decodeMetaError, extractErrorCode } from '@/lib/whatsapp/metaErrors';
import { ORIGIN_META } from './constants';

/**
 * Rewrite a Cloudinary URL so the file downloads instead of trying to
 * open in the browser. This sidesteps two real UX problems:
 *   1. Cloudinary blocks in-browser delivery of PDFs / ZIPs by default
 *      (their anti-abuse setting), so preview attempts fail silently.
 *   2. Different browsers preview vs download the same file inconsistently,
 *      which confuses agents ("wait, why did it just open?").
 *
 * The `fl_attachment` flag makes Cloudinary respond with the
 * Content-Disposition: attachment header so browsers always save the file.
 * Non-Cloudinary URLs (external links) get the plain `download` attribute
 * on the anchor as a fallback — same effect for most files.
 */
function toDownloadUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/fl_attachment/')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
}

/**
 * Icon color + component for an attachment based on its MIME type. Kept
 * data-driven so adding a new file type is a one-line entry.
 */
function iconForMime(mimeType = '') {
  const t = mimeType.toLowerCase();
  if (t.startsWith('image/')) return { Icon: ImageIcon, color: 'text-emerald-600' };
  if (t.startsWith('video/')) return { Icon: Film, color: 'text-violet-600' };
  if (t.startsWith('audio/')) return { Icon: Music, color: 'text-amber-600' };
  if (t.includes('pdf')) return { Icon: FileText, color: 'text-rose-600' };
  if (t.includes('word') || t.includes('officedocument.word')) {
    return { Icon: FileText, color: 'text-blue-600' };
  }
  if (t.includes('sheet') || t.includes('excel') || t.includes('officedocument.spreadsheet')) {
    return { Icon: FileText, color: 'text-green-700' };
  }
  return { Icon: FileIcon, color: 'text-slate-500' };
}

/**
 * Renders `content.attachments[]` — every file gets its own card, including
 * inline images from Gmail-style CID embeds (user preference: card-per-attachment
 * over inline HTML rendering, so agents get a consistent UX across all types).
 *
 * Images use an inline thumbnail preview; everything else is a filename + size
 * download card. The click always opens/downloads via the Cloudinary URL.
 */
function AttachmentCards({ attachments }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 mb-1.5">
      {attachments.map((att, i) => {
        // Every anchor uses the download URL — Cloudinary's fl_attachment
        // flag + the HTML download attribute together guarantee the browser
        // saves the file instead of trying to preview it. User preference:
        // download over preview across all file types for consistency.
        const href = toDownloadUrl(att.url);
        const isImage = (att.mimeType || '').toLowerCase().startsWith('image/');
        if (isImage) {
          return (
            <a
              key={att.url || i}
              href={href}
              download={att.fileName}
              className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[280px] hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              title={`Download ${att.fileName}`}
            >
              {/* Preview thumbnail uses the ORIGINAL URL (not fl_attachment)
                  so the <img> tag can render the image; clicking the anchor
                  still downloads via fl_attachment. */}
              <img
                src={att.url}
                alt={att.fileName}
                className="w-full max-h-64 object-cover"
                loading="lazy"
              />
              <div className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-400">
                <span className="truncate flex-1">{att.fileName}</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  {att.size ? <span>{formatFileSize(att.size)}</span> : null}
                  <Download className="w-3 h-3" />
                </span>
              </div>
            </a>
          );
        }
        const { Icon, color } = iconForMime(att.mimeType);
        return (
          <a
            key={att.url || i}
            href={href}
            download={att.fileName}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 transition-colors max-w-[320px]"
            title={`Download ${att.fileName}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{att.fileName}</p>
              {att.size ? (
                <p className="text-[10px] text-slate-500">{formatFileSize(att.size)}</p>
              ) : null}
            </div>
            <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

function MediaContent({ message }) {
  const { type, content } = message;
  const url = content?.mediaUrl;
  const fileName = content?.fileName || 'attachment';
  const mimeType = content?.mimeType || '';

  if (!url && type === 'text') return null;

  if (type === 'image' || mimeType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-1">
        <img src={url} alt={fileName} className="max-w-full rounded-lg max-h-64 object-cover" loading="lazy" />
      </a>
    );
  }

  if (type === 'video' || mimeType.startsWith('video/')) {
    return (
      <video src={url} controls className="max-w-full rounded-lg max-h-64 mb-1" preload="metadata">
        <track kind="captions" />
      </video>
    );
  }

  if (type === 'audio' || mimeType.startsWith('audio/')) {
    return (
      <audio src={url} controls className="w-full min-w-[200px] mb-1" preload="metadata" />
    );
  }

  if (type === 'document' || url) {
    return (
      <a
        href={url}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2.5 mb-1 rounded-lg bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 transition-colors"
      >
        <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{fileName}</p>
          {content?.fileSize && <p className="text-[10px] text-slate-500">{formatFileSize(content.fileSize)}</p>}
        </div>
        <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </a>
    );
  }

  return null;
}

/**
 * Small colored avatar circle built from the first letter of a name. Used
 * to identify email senders without needing to load real Gravatar-style
 * avatars (that would be a separate feature + network cost per contact).
 * Same name always produces the same color — deterministic hash of the
 * first character.
 */
function InitialAvatar({ name = '?', size = 'sm' }) {
  const ch = (name.trim()[0] || '?').toUpperCase();
  // Palette rotated by char code — matches Gmail's approach of "same
  // sender = same tile color forever," which agents rely on for quick
  // visual scan of a thread.
  const palette = [
    'bg-emerald-100 text-emerald-800',
    'bg-blue-100 text-blue-800',
    'bg-violet-100 text-violet-800',
    'bg-rose-100 text-rose-800',
    'bg-amber-100 text-amber-800',
    'bg-cyan-100 text-cyan-800',
    'bg-fuchsia-100 text-fuchsia-800',
    'bg-teal-100 text-teal-800',
  ];
  const color = palette[ch.charCodeAt(0) % palette.length];
  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 ${dim} ${color}`}>
      {ch}
    </span>
  );
}

/**
 * Gmail-style header shown above email bubbles when the sender changes or
 * a 5-minute gap opens. Displays the sender's display name + email address +
 * timestamp. Not rendered on WhatsApp / Instagram — those channels have
 * only two participants so direction alone conveys who sent it.
 */
function EmailSenderHeader({ message, outgoing, conversation }) {
  // Fallback chain — Message.content is the source of truth on new emails,
  // but rows saved before participantName/Email became standard don't have
  // them. Fall back to the conversation's participant (correct for INCOMING
  // in a 1:1 email thread). For OUTGOING, "You" is the safe label; we can
  // upgrade to the connected mailbox display name later.
  const senderName = outgoing
    ? (message.content?.participantName || 'You')
    : (
      message.content?.participantName ||
      conversation?.participantName ||
      conversation?.leadId?.name ||
      message.content?.participantEmail?.split('@')[0] ||
      conversation?.participantEmail?.split('@')[0] ||
      'Contact'
    );
  const senderEmail = outgoing
    ? (message.content?.participantEmail || '')
    : (
      message.content?.participantEmail ||
      conversation?.participantEmail ||
      conversation?.leadId?.email ||
      ''
    );
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  // CC list rendered under the sender line when the email had CC recipients.
  // Formatted as Gmail-style: "cc: Alice, Bob <bob@x.com>, +2 more" if long.
  const ccList = Array.isArray(message.content?.cc) ? message.content.cc : [];
  const ccPreview = ccList.length
    ? ccList.slice(0, 3).map((c) => c.name || c.address).join(', ') + (ccList.length > 3 ? `, +${ccList.length - 3} more` : '')
    : null;

  return (
    <div className={`flex flex-col mb-1 px-1 ${outgoing ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-2 ${outgoing ? 'flex-row-reverse' : ''}`}>
        <InitialAvatar name={senderName} />
        <div className={`flex items-baseline gap-1.5 ${outgoing ? 'text-right' : 'text-left'}`}>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{senderName}</span>
          {senderEmail && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              &lt;{senderEmail}&gt;
            </span>
          )}
          <span className="text-[10px] text-slate-400 dark:text-slate-500">·&nbsp;{time}</span>
        </div>
      </div>
      {ccPreview && (
        <div className={`text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 ${outgoing ? 'mr-8' : 'ml-8'}`}>
          cc: {ccPreview}
        </div>
      )}
    </div>
  );
}

/**
 * Renders sanitized email HTML body inside a bubble. Isolates the HTML
 * from bleeding into the surrounding chat layout by wrapping in a
 * constrained container with reset styles. All external images inside
 * are given loading=lazy and max-width so a marketing email with 10 huge
 * hero images doesn't tank scroll performance.
 */
function EmailHtmlBody({ html }) {
  return (
    <div
      className="email-html-body max-w-full overflow-hidden text-sm leading-relaxed"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        wordBreak: 'break-word',
      }}
    />
  );
}

function MessageBubble({ message, onAction, showSenderHeader = false, groupedWithPrev = false, conversation }) {
  // Toggle to fall back to plain text when a rich HTML email is too wild.
  // Off by default (rich rendering); persist choice per-bubble in state.
  const [showRawText, setShowRawText] = useState(false);
  const emailHtml = message.type === 'email' ? message.content?.html : null;
  const hasRichHtml = !!emailHtml && !showRawText;
  if (message.isInternal) {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-[85%] px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
          <span className="flex items-center gap-1 font-medium text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
            <StickyNote className="w-3 h-3" /> Internal note
          </span>
          <p className="whitespace-pre-wrap break-words">{message.content?.body}</p>
        </div>
      </div>
    );
  }

  if (message.direction === 'system') {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 text-[11px] text-slate-500 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-full shadow-sm">
          {message.content?.body}
        </span>
      </div>
    );
  }

  const outgoing = message.direction === 'outgoing';
  const failed = outgoing && message.status === 'failed';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const hasMedia = message.type !== 'text' || message.content?.mediaUrl;
  const rawBody = message.content?.body || message.content?.caption || '';
  // Split email body into NEW content vs QUOTED reply chain instead of
  // dropping the quote entirely — Gmail/Outlook both keep the quote behind
  // a "..." toggle so agents can peek at prior thread context without it
  // dominating the bubble. `newBody` is what shows by default; `quotedBody`
  // is the collapsed section revealed on click.
  const { newBody, quotedBody } = useMemo(() => {
    if (message.type !== 'email' || !rawBody) return { newBody: rawBody, quotedBody: '' };

    // Find where the quoted section starts. Priority order matches how the
    // three major mail clients wrap replies:
    //   - Gmail:   "On <date>, <name> <email> wrote:"
    //   - Outlook: "-----Original Message-----" divider
    //   - Outlook: "From: X\nSent: Y" header block
    //   - Everyone: leading ">" line prefixes (older clients)
    const markers = [
      /(^|\n)\s*On\s[\s\S]+?wrote:/i,
      /(^|\n)\s*-----\s*Original Message\s*-----/i,
      /(^|\n)\s*From:\s.+\r?\nSent:\s/i,
    ];
    let splitAt = -1;
    for (const m of markers) {
      const match = rawBody.match(m);
      if (match) {
        splitAt = match.index + (match[1] ? match[1].length : 0);
        break;
      }
    }
    // Fallback — if no explicit marker, look for the first run of ">" quoted
    // lines and split there. Catches older mail clients that don't emit a
    // "wrote:" preamble.
    if (splitAt < 0) {
      const lines = rawBody.split('\n');
      const quoteStartIdx = lines.findIndex((line) => /^\s*>/.test(line));
      if (quoteStartIdx > 0) {
        splitAt = lines.slice(0, quoteStartIdx).join('\n').length;
      }
    }
    if (splitAt < 0) return { newBody: rawBody, quotedBody: '' };

    return {
      newBody: rawBody.slice(0, splitAt).trim(),
      quotedBody: rawBody.slice(splitAt).trim(),
    };
  }, [rawBody, message.type]);
  const bodyText = newBody;
  const [quoteExpanded, setQuoteExpanded] = useState(false);

  // Bubble palette — failed sends get a red/amber tint so they can't be
  // mistaken for a normal outbound at a glance. That was a real complaint:
  // "message not sending" while agents thought they'd already sent.
  let bubbleClass;
  let tailClass;
  if (failed) {
    bubbleClass = 'bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100 border border-red-200 dark:border-red-900/60 rounded-lg rounded-tr-none';
    tailClass = 'right-1 bg-red-50 dark:bg-red-950/40';
  } else if (outgoing) {
    bubbleClass = 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tr-none';
    tailClass = 'right-1 bg-[#d9fdd3] dark:bg-[#005c4b]';
  } else {
    bubbleClass = 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tl-none';
    tailClass = 'left-1 bg-white dark:bg-[#202c33]';
  }

  // Wrapper spacing shrinks when this bubble is grouped with the previous
  // one (same sender, <5min gap) — Gmail-style visual grouping so a burst
  // of consecutive replies reads as one exchange, not five.
  const wrapperSpacing = groupedWithPrev ? 'mt-[2px]' : 'mt-3';

  return (
    <div className={`flex flex-col ${wrapperSpacing} px-1`}>
      {showSenderHeader && (
        <EmailSenderHeader message={message} outgoing={outgoing} conversation={conversation} />
      )}
      <div className={`group flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      {/* Hover actions — floating icons that appear next to the bubble.
          Placed OUTSIDE the bubble so they don't shift the message layout.
          Star turns amber when active. Trash flips to Restore for isDeleted
          messages so the Trash folder view stays interactive. */}
      {onAction && (
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity self-center flex flex-col gap-0.5 mx-1 ${outgoing ? 'order-first' : 'order-last'}`}
        >
          {/* Reply — email-only for now; WhatsApp threading uses a
              different UX (long-press quote). Fires the 'reply' action so
              the parent hook can prefill the composer. */}
          {message.type === 'email' && (
            <button
              type="button"
              onClick={() => onAction(message._id, 'reply')}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600"
              title="Reply to this message"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onAction(message._id, message.starred ? 'unstar' : 'star')}
            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${message.starred ? 'text-amber-500' : 'text-slate-400'}`}
            title={message.starred ? 'Remove star' : 'Star message'}
          >
            <Star className="w-3.5 h-3.5" fill={message.starred ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => onAction(message._id, message.isDeleted ? 'restore' : 'trash')}
            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${message.isDeleted ? 'text-teal-500' : 'text-slate-400 hover:text-rose-600'}`}
            title={message.isDeleted ? 'Restore from trash' : 'Move to trash'}
          >
            {message.isDeleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      <div className={`relative max-w-[75%] pl-2.5 pr-2 py-1.5 text-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${bubbleClass}`}>
        {/* WhatsApp bubble tail */}
        <span
          className={`absolute top-0 w-2 h-3 overflow-hidden ${outgoing ? '-right-1.5' : '-left-1.5'}`}
          aria-hidden
        >
          <span className={`absolute top-0 block w-3 h-3 rotate-45 ${tailClass}`} />
        </span>

        {failed && (
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-red-200/70 dark:border-red-900/40">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
              Not delivered
            </span>
          </div>
        )}
        {/* Provenance pill — small, unobtrusive, only for non-human messages.
            Tells agents at a glance whether a send was manual or automated. */}
        {(() => {
          const meta = ORIGIN_META[message.origin];
          if (!meta) return null;
          return (
            <span
              className={`inline-block text-[9px] font-semibold uppercase tracking-wider border rounded px-1.5 py-[1px] mb-1 mr-1 ${meta.bg}`}
            >
              {meta.label}
            </span>
          );
        })()}
        {message.subject && message.type === 'email' && (
          <p className="text-xs font-semibold mb-1 text-[#111b21]/80 dark:text-[#e9edef]/80">{message.subject}</p>
        )}
        {/* Email-style multi-attachment cards (new). Renders every file in
            content.attachments[] as its own card. Legacy MediaContent below
            still handles WhatsApp/Instagram single-file media. */}
        {Array.isArray(message.content?.attachments) && message.content.attachments.length > 0 && (
          <AttachmentCards attachments={message.content.attachments} />
        )}
        {hasMedia && <MediaContent message={message} />}
        {hasRichHtml ? (
          <EmailHtmlBody html={emailHtml} />
        ) : bodyText ? (
          <p className={`leading-[1.35] whitespace-pre-wrap break-words pr-10 ${failed ? 'text-red-950/80 dark:text-red-100/80' : ''}`}>{bodyText}</p>
        ) : null}
        {/* Collapsible quoted reply — Gmail/Outlook-style "..." button
            hides the prior thread by default and expands on click. Only
            shows when a real quote was detected in the parsed body. */}
        {message.type === 'email' && quotedBody && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setQuoteExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors leading-none"
              title={quoteExpanded ? 'Hide quoted history' : 'Show quoted history'}
              aria-expanded={quoteExpanded}
            >
              <span className="text-[13px] tracking-wide font-bold">…</span>
            </button>
            {quoteExpanded && (
              <div className="mt-1 pl-3 border-l-2 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-[12px] leading-[1.4] whitespace-pre-wrap break-words">
                {quotedBody}
              </div>
            )}
          </div>
        )}
        {/* Rich/plain toggle — only visible on email messages that have
            both an HTML and a plain-text version. Lets agents drop into
            plain view if a marketing email renders oddly. */}
        {message.type === 'email' && emailHtml && bodyText && (
          <button
            type="button"
            onClick={() => setShowRawText((v) => !v)}
            className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-1 underline underline-offset-2"
          >
            {showRawText ? 'Show rich view' : 'Show plain text'}
          </button>
        )}
        <div className={`flex items-center justify-end gap-1 -mt-1 float-right ${
          failed
            ? 'text-red-600/80 dark:text-red-400/80'
            : outgoing
              ? 'text-[#667781] dark:text-[#aebac1]'
              : 'text-[#667781] dark:text-[#8696a0]'
        }`}>
          <span className="text-[10px] leading-none tabular-nums">{time}</span>
          {outgoing && (
            message.status === 'sending' ? (
              <Clock className="w-3.5 h-3.5" />
            ) : message.status === 'failed' ? (
              <FailedIndicator message={message} />
            ) : message.status === 'read' ? (
              <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
            ) : message.status === 'delivered' ? (
              <CheckCheck className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function FailedIndicator({ message }) {
  const [open, setOpen] = useState(false);
  const err = message.rawMetadata?.deliveryError || message.error;
  const raw = typeof err === 'string' ? err : (err?.details || err?.message || '');
  const code = err?.code || extractErrorCode(raw);
  const decoded = code ? decodeMetaError(code, raw) : null;

  if (!raw && !decoded) {
    return <span className="text-[9px] text-red-500">Failed</span>;
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center gap-1 text-[9px] font-semibold text-red-500 hover:text-red-700 cursor-pointer"
        title="Click to see why it failed"
      >
        <AlertCircle className="w-3 h-3" /> Failed
      </button>
      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 z-20 w-64 rounded-lg border border-red-200 bg-white dark:bg-slate-900 dark:border-red-900 shadow-xl p-3 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 mb-1.5">
            {decoded?.code && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 shrink-0">
                {decoded.code}
              </span>
            )}
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {decoded?.title || 'Delivery failed'}
            </p>
          </div>
          {decoded?.explanation && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="font-semibold">Why:</span> {decoded.explanation}
            </p>
          )}
          {decoded?.actionable && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="font-semibold">Fix:</span> {decoded.actionable}
            </p>
          )}
          {raw && !decoded?.isKnown && (
            <p className="text-[10px] text-slate-500 font-mono break-words">{String(raw).slice(0, 240)}</p>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-[10px] text-slate-500 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </span>
  );
}

export default memo(MessageBubble);
