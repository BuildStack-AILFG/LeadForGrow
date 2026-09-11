'use client';

import { memo, useState } from 'react';
import {
  Check, CheckCheck, Clock, StickyNote, Download, FileText, AlertCircle,
  Star, Trash2, RotateCcw,
} from 'lucide-react';
import { formatFileSize } from '@/lib/omnichannel/mediaTypes';
import { decodeMetaError, extractErrorCode } from '@/lib/whatsapp/metaErrors';
import { ORIGIN_META } from './constants';

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

function MessageBubble({ message, onAction }) {
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
  const bodyText = message.content?.body || message.content?.caption;

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

  return (
    <div className={`group flex ${outgoing ? 'justify-end' : 'justify-start'} mb-[3px] px-1`}>
      {/* Hover actions — floating icons that appear next to the bubble.
          Placed OUTSIDE the bubble so they don't shift the message layout.
          Star turns amber when active. Trash flips to Restore for isDeleted
          messages so the Trash folder view stays interactive. */}
      {onAction && (
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity self-center flex flex-col gap-0.5 mx-1 ${outgoing ? 'order-first' : 'order-last'}`}
        >
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
        {hasMedia && <MediaContent message={message} />}
        {bodyText && (
          <p className={`leading-[1.35] whitespace-pre-wrap break-words pr-10 ${failed ? 'text-red-950/80 dark:text-red-100/80' : ''}`}>{bodyText}</p>
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
