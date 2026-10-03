'use client';

import { useState } from 'react';
import { Bot as Sparkles, Loader2, ChevronDown, Send, Zap } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

const STYLES = [
  { id: 'smart', label: 'Smart' },
  { id: 'short', label: 'Short' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'sales', label: 'Sales' },
];

export default function AiReplyBar({
  channel = 'whatsapp',
  customerName,
  lastMessage,
  leadId,
  conversationId,
  onApply,
  onSend,
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState('smart');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState(null);

  const generate = async (selectedStyle = style) => {
    setLoading(true);
    setReply(null);
    try {
      const res = await authFetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: selectedStyle,
          channel,
          customerName,
          lastMessage,
          leadId,
          conversationId,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setReply(data.data);
      setOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to generate reply');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    if (!reply?.reply) return;
    onApply?.(reply.reply);
    toast.success('Reply inserted');
  };

  const handleSend = async () => {
    if (!reply?.reply) return;
    if (onSend) {
      const ok = await onSend(reply.reply);
      if (ok) {
        setReply(null);
        setOpen(false);
        toast.success('Sent');
      }
    } else {
      handleUse();
    }
  };

  return (
    <div className="px-3 pt-2">
      {/* One compact line: generate + tone. Changing the tone regenerates. */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => generate()}
          disabled={loading}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 text-meta font-medium text-fg-secondary hover:bg-subtle hover:text-fg disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />}
          AI reply
        </button>
        <label className="sr-only" htmlFor="ai-reply-tone">Reply tone</label>
        <select
          id="ai-reply-tone"
          value={style}
          disabled={loading}
          onChange={(e) => { setStyle(e.target.value); generate(e.target.value); }}
          className="h-7 rounded-md border border-line bg-canvas px-2 text-meta text-fg-secondary hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
        >
          {STYLES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {reply && open && (
        <div className="mt-2 p-3 rounded-lg bg-accent-subtle/80 dark:bg-violet-950/20 border border-line dark:border-violet-800">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-meta font-semibold text-accent-fg flex items-center gap-1">
              <Zap className="w-3 h-3" /> AI {style} reply
              {reply.confidence != null && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-canvas/60 text-accent-fg">
                  {Math.round(reply.confidence * 100)}%
                </span>
              )}
            </span>
            <button type="button" onClick={() => setOpen(false)} className="text-fg-tertiary hover:text-fg-secondary">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-fg-secondary dark:text-fg-disabled whitespace-pre-wrap leading-relaxed">{reply.reply}</p>
          {reply.sources?.length > 0 && (
            <p className="text-meta text-fg-tertiary mt-1.5">Sources: {reply.sources.join(', ')}</p>
          )}
          <div className="flex gap-2 mt-2.5">
            <button type="button" onClick={handleUse} className="flex-1 text-xs py-1.5 rounded-lg border border-line text-accent-fg hover:bg-canvas/50">
              Insert
            </button>
            <button type="button" onClick={handleSend} className="flex-1 text-xs py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover flex items-center justify-center gap-1">
              <Send className="w-3 h-3" /> Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
