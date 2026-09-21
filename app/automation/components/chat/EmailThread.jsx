'use client';

import { useMemo, useState } from 'react';
import MessageBubble from './MessageBubble';
import EmailMessageCard from './EmailMessageCard';
import { planThreadView, threadSubject, shouldShowSubject } from '@/lib/omnichannel/emailThread';

/**
 * The message area of an EMAIL conversation: stacked full-width cards (max ~860px so lines stay readable), not chat bubbles.
 * Internal notes, system rows and deleted messages keep their own compact rows (MessageBubble handles them).
 * In threads with more than 4 cards, older ones start collapsed to one line; a click toggles each, and a link at the top
 * expands / re-collapses them all.
 */
export default function EmailThread({ messages, conversation, onAction }) {
  // id -> true (collapsed) / false (open): what the user toggled. Always wins over the automatic plan.
  const [overrides, setOverrides] = useState({});
  const { items, collapsible } = useMemo(() => planThreadView(messages, { overrides }), [messages, overrides]);
  const subject = useMemo(() => threadSubject(messages), [messages]);
  const idOf = (m) => String(m._id ?? m.messageId);

  const toggle = (message, currentlyCollapsed) => setOverrides((prev) => ({ ...prev, [idOf(message)]: !currentlyCollapsed }));
  const setAll = (collapsed) => setOverrides(() => {
    const next = {};
    items.filter((i) => i.card).forEach((i) => { next[idOf(i.message)] = collapsed; });
    return next;
  });
  const collapsedCount = items.filter((i) => i.card && i.collapsed).length;

  return (
    <div className="mx-auto w-full max-w-[860px] space-y-2">
      {collapsible && (
        <div className="flex justify-end">
          {collapsedCount > 0 ? (
            <button type="button" onClick={() => setAll(false)} className="text-[11px] font-medium text-brand-ink hover:underline">
              Show all {items.filter((i) => i.card).length} messages
            </button>
          ) : (
            <button type="button" onClick={() => setOverrides({})} className="text-[11px] font-medium text-brand-ink hover:underline">
              Collapse older messages
            </button>
          )}
        </div>
      )}
      {items.map(({ message, card, collapsed }) => (
        <div key={idOf(message)} data-msg-id={message._id}>
          {card ? (
            <EmailMessageCard
              message={message}
              conversation={conversation}
              onAction={onAction}
              collapsed={collapsed}
              canCollapse={collapsible}
              onToggle={() => toggle(message, collapsed)}
              showSubject={shouldShowSubject(message, subject)}
            />
          ) : (
            <MessageBubble message={message} onAction={onAction} conversation={conversation} />
          )}
        </div>
      ))}
    </div>
  );
}
