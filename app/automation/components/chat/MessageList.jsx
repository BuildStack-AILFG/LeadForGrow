'use client';

import { useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';

/**
 * WhatsApp-style message list.
 *
 * Notes for future scale: previously did custom virtualization with a fixed
 * ESTIMATED_ROW_HEIGHT — but real bubble heights vary wildly (text vs media
 * vs templates), so the estimated spacers oscillated on every scroll event,
 * making the scrollbar flicker. Rendering all bubbles directly is fine for
 * <500 messages per convo. If we ever hit ~thousands, swap in react-virtuoso
 * which handles variable-height rows properly.
 */
export default function MessageList({ messages, loading, hasMore, onLoadMore, loadingMore, onMessageAction, emptyLabel }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);
  const shouldStickBottom = useRef(true);

  // Auto-scroll to the newest message when new ones arrive AND user was already at the bottom
  useEffect(() => {
    if (messages.length > prevLengthRef.current && shouldStickBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // Track whether user is near the bottom — controls auto-scroll on new messages
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    shouldStickBottom.current = nearBottom;
    // Load older messages when user scrolls near the top
    if (el.scrollTop < 80 && hasMore && !loadingMore) {
      onLoadMore?.();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#F1F6F3] dark:bg-[#0b141a]">
        <div className="w-9 h-9 border-2 border-[#1D4B3E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Loading messages…</p>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F1F6F3] dark:bg-[#0b141a]">
        <p className="text-sm text-slate-500 text-center max-w-xs">
          {emptyLabel || 'No messages yet. Start the conversation.'}
        </p>
      </div>
    );
  }

  let lastDate = '';
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 bg-[#F1F6F3] dark:bg-[#0b141a]"
      style={{ overflowAnchor: 'none' }}
    >
      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-[#25d366] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {messages.map((msg) => {
        const d = msg.timestamp ? new Date(msg.timestamp).toDateString() : '';
        const showDate = d && d !== lastDate;
        if (showDate) lastDate = d;
        return (
          <div key={msg._id || msg.messageId} data-msg-id={msg._id}>
            {showDate && (
              <div className="flex justify-center my-3">
                <span className="text-[11px] font-medium text-[#54656f] dark:text-[#8696a0] px-3 py-1 bg-[#ffffff]/95 dark:bg-[#182229]/95 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide">
                  {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            <MessageBubble message={msg} onAction={onMessageAction} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
