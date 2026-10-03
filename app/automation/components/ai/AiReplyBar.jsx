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
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => generate()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-meta font-medium rounded-lg bg-accent-subtle dark:bg-violet-950/30 text-accent-fg dark:text-accent-fg border border-line dark:border-violet-800 hover:bg-accent-subtle disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Reply
        </button>
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setStyle(s.id); generate(s.id); }}
            disabled={loading}
            className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
              style === s.id
                ? 'bg-accent text-white border-accent'
                : 'text-fg-tertiary border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-800'
            }`}
          >
            {s.label}
          </button>
        ))}
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
