'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function LeadWhatsAppPanel({ lead, messages = [], onSend, sending }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const ok = await onSend(text.trim());
    if (ok) setText('');
  };

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-line dark:border-slate-800">
        <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">WhatsApp conversation</p>
        <Link
          href={`/automation/chat?leadId=${lead._id}`}
          className="text-xs font-medium text-accent-fg hover:underline"
        >
          Open full inbox →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-10 h-10 text-fg-disabled mb-2" />
            <p className="text-sm text-fg-tertiary">No messages yet</p>
            <p className="text-xs text-fg-tertiary mt-1 max-w-xs">Send a WhatsApp message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm ${
                  msg.direction === 'outgoing'
                    ? 'bg-accent text-white rounded-tr-sm'
                    : 'bg-muted dark:bg-slate-800 text-fg dark:text-slate-100 rounded-tl-sm border border-line dark:border-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content?.body || msg.text}</p>
                <p className={`text-meta mt-1 ${msg.direction === 'outgoing' ? 'text-teal-100' : 'text-fg-tertiary'}`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="pt-3 mt-auto border-t border-line dark:border-slate-800 flex gap-2">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a WhatsApp message..."
          className="flex-1 text-sm px-3 py-2.5 border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-focus"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent-hover flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export function LeadCallsTab({ activities = [] }) {
  const calls = activities.filter((a) => a.type === 'contacted' || a.type === 'call').reverse();

  if (!calls.length) {
    return <p className="text-sm text-fg-tertiary text-center py-12">No call history yet.</p>;
  }

  return (
    <ul className="space-y-3 max-h-[560px] overflow-y-auto">
      {calls.map((call, idx) => (
        <li key={call._id || idx} className="p-4 rounded-lg border border-line dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-fg dark:text-slate-200">Call session</p>
            {call.metadata?.durationSeconds != null && (
              <span className="text-xs text-fg-tertiary tabular-nums">{call.metadata.durationSeconds}s</span>
            )}
          </div>
          {call.metadata?.notes && (
            <p className="text-sm text-fg-secondary dark:text-fg-tertiary mb-2">{call.metadata.notes}</p>
          )}
          {call.metadata?.recordingUrl && (
            <audio controls className="w-full h-9 mt-2">
              <source src={call.metadata.recordingUrl} type="audio/mpeg" />
            </audio>
          )}
          <p className="text-meta text-fg-tertiary mt-2">
            {call.performedAt ? new Date(call.performedAt).toLocaleString() : ''}
          </p>
        </li>
      ))}
    </ul>
  );
}
