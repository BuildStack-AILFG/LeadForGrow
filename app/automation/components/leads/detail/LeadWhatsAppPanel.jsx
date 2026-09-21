'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import WarningNote from '@/app/components/ui/WarningNote';
import { WhatsAppIcon, InstagramIcon, FacebookIcon, GmailIcon } from '../../chat/BrandIcons';
import { CHANNEL_LABELS, getMessageChannels, getPrimaryChannel, getReplyChannels, getReplyWindow, formatWindowLeft } from './leadChannels';

const CHANNEL_ICONS = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  email: GmailIcon,
};

// "a WhatsApp" / "an Instagram" / "an Email"
const withArticle = (label) => `${/^[AEIOU]/i.test(label) ? 'an' : 'a'} ${label}`;

export function ChannelMark({ channel, className = 'w-3.5 h-3.5' }) {
  const Icon = CHANNEL_ICONS[channel];
  return Icon ? <Icon colored className={className} /> : null;
}

/**
 * The lead's message thread. Shows every channel the lead has talked to us on (each message is tagged with
 * its own channel) and sends replies on the channel picked in the composer — defaulting to the channel of
 * the latest message, so an Instagram lead's reply goes out as an Instagram DM, not WhatsApp.
 * `onSend(text, channel)` does the actual sending.
 */
export default function LeadWhatsAppPanel({ lead, messages = [], onSend, sending, draft = null }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const bottomRef = useRef(null);

  // A quick template picked on the profile card lands in the composer.
  useEffect(() => {
    if (draft?.text) setText(draft.text);
  }, [draft]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const visible = messages.filter((m) => !m.isInternal);
  const threadChannels = getMessageChannels(visible);
  const replyChannels = getReplyChannels(lead, visible);
  const primary = getPrimaryChannel(lead, visible);
  const channel = picked && replyChannels.includes(picked) ? picked : (replyChannels.includes(primary) ? primary : replyChannels[0] || primary);
  const multi = threadChannels.length > 1;
  const replyWindow = getReplyWindow(visible, channel, now);
  // Meta rejects Instagram/Messenger DMs outside 24h, so don't offer a send that can only fail.
  // (WhatsApp keeps sending: the send route can fall back to templates.)
  const sendBlocked = replyWindow.state === 'closed' && channel !== 'whatsapp';
  const title = multi ? 'Conversation' : `${CHANNEL_LABELS[threadChannels[0] || channel]} conversation`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending || sendBlocked) return;
    const ok = await onSend(text.trim(), channel);
    if (ok) setText('');
  };

  return (
    <div className="flex flex-col flex-1 min-h-[560px] max-h-[80vh]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <ChannelMark channel={threadChannels[0] || channel} className="w-4 h-4" />
          {title}
        </p>
        <Link
          href={`/automation/chat?leadId=${lead._id}`}
          className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
        >
          Open full inbox →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Send {withArticle(CHANNEL_LABELS[channel])} message to start the conversation.</p>
          </div>
        ) : (
          visible.map((msg, idx) => (
            <div key={msg._id || idx} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded text-sm ${
                  msg.direction === 'outgoing'
                    ? 'bg-teal-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content?.body || msg.text}</p>
                <p className={`text-[10px] mt-1 flex items-center gap-1 ${msg.direction === 'outgoing' ? 'text-teal-100 justify-end' : 'text-slate-400'}`}>
                  {multi && <ChannelMark channel={msg.channel} className="w-3 h-3" />}
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-2">
        {replyWindow.state === 'open' && (
          <p className={`text-xs flex items-center gap-1.5 ${replyWindow.msLeft < 3 * 3600_000 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <Clock className="w-3.5 h-3.5" />
            Reply window: {formatWindowLeft(replyWindow.msLeft)} left
          </p>
        )}
        {replyWindow.state === 'closed' && (
          <WarningNote>
            {channel === 'whatsapp'
              ? 'The 24-hour window has closed. Free-text WhatsApp messages may be rejected, so use a template.'
              : `The 24-hour window has closed. ${CHANNEL_LABELS[channel]} only allows replies within 24 hours of the customer's last message. You can reply again once they message you.`}
          </WarningNote>
        )}
        {replyChannels.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Reply via</span>
            {replyChannels.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPicked(c)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                  c === channel
                    ? 'border-teal-600 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <ChannelMark channel={c} className="w-3 h-3" />
                {CHANNEL_LABELS[c]}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sendBlocked}
            placeholder={sendBlocked ? 'Reply window closed' : `Type ${withArticle(CHANNEL_LABELS[channel])} message...`}
            className="flex-1 text-sm px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending || sendBlocked}
            className="p-2.5 rounded bg-teal-600 text-white disabled:opacity-40 hover:bg-teal-700 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export function LeadCallsTab({ activities = [] }) {
  const calls = activities.filter((a) => a.type === 'contacted' || a.type === 'call').reverse();

  if (!calls.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No call history yet.</p>;
  }

  return (
    <ul className="space-y-3 max-h-[560px] overflow-y-auto">
      {calls.map((call, idx) => (
        <li key={call._id || idx} className="p-4 rounded border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Call session</p>
            {call.metadata?.durationSeconds != null && (
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{call.metadata.durationSeconds}s</span>
            )}
          </div>
          {call.metadata?.notes && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{call.metadata.notes}</p>
          )}
          {call.metadata?.recordingUrl && (
            <audio controls className="w-full h-9 mt-2">
              <source src={call.metadata.recordingUrl} type="audio/mpeg" />
            </audio>
          )}
          <p className="text-[11px] text-slate-400 mt-2">
            {call.performedAt ? new Date(call.performedAt).toLocaleString() : ''}
          </p>
        </li>
      ))}
    </ul>
  );
}
