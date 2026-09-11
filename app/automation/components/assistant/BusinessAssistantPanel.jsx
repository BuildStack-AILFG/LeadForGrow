'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Loader2, RotateCcw,
  TrendingUp, Users, Zap, ChevronRight
} from 'lucide-react';
import { useBusinessAssistant } from '../../context/BusinessAssistantContext';
import { useBusinessAssistantChat, useAutoScroll } from '../../hooks/useBusinessAssistantChat';
import { ASSISTANT_NAME, ASSISTANT_TAGLINE } from './constants';
import GroviaIcon, { GroviaMark } from './GroviaIcon';

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function MetricPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function BusinessAssistantPanel() {
  const { isOpen, close } = useBusinessAssistant();
  const chat = useBusinessAssistantChat();
  const scrollRef = useAutoScroll([chat.messages, chat.loading]);

  useEffect(() => {
    if (isOpen) chat.initChat();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCur = (n) => {
    const v = Number(n) || 0;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toLocaleString()}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            onClick={close}
          />

          <motion.aside
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 h-full w-full max-w-[440px] z-[70] flex flex-col bg-[#0c1222] shadow-2xl border-l border-white/10"
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-950/80 via-[#0c1222] to-[#0c1222]" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <GroviaMark size="lg" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0c1222]" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">{ASSISTANT_NAME}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {chat.context?.businessName || 'Your company'} · {ASSISTANT_TAGLINE}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { chat.reset(); chat.initChat(); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Reset chat"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={close} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {chat.context?.metrics && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <MetricPill icon={Users} label="Leads" value={chat.context.metrics.totalLeads} color="text-teal-400" />
                    <MetricPill icon={TrendingUp} label="Pipeline" value={formatCur(chat.context.metrics.totalPipelineValue)} color="text-emerald-400" />
                    <MetricPill icon={Zap} label="SLA" value={`${chat.context.metrics.slaCompliance}%`} color="text-amber-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {chat.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0 mr-2 mt-1 text-teal-400">
                      <GroviaIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-teal-700 text-white rounded-br-md'
                          : msg.error
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-md'
                            : 'bg-white/[0.06] text-slate-200 border border-white/[0.08] rounded-bl-md'
                      }`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    {msg.source && msg.role === 'assistant' && (
                      <p className="text-[10px] text-slate-600 mt-1 ml-1">{msg.source === 'ai' ? 'Live data' : 'Insights'}</p>
                    )}
                    {msg.suggestions && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        {msg.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => chat.sendMessage(s)}
                            className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left text-xs text-slate-300 hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-300 transition-all"
                          >
                            {s}
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chat.loading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400">
                    <GroviaIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                    <span className="text-xs text-slate-400">Checking your numbers…</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 p-4 border-t border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur">
              <form
                onSubmit={(e) => { e.preventDefault(); chat.sendMessage(); }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={chat.input}
                  onChange={(e) => chat.setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      chat.sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ask about pipeline, leads, automations…"
                  className="flex-1 resize-none px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 max-h-28"
                />
                <button
                  type="submit"
                  disabled={!chat.input.trim() || chat.loading}
                  className="p-3 rounded-xl bg-teal-700 text-white shadow-sm disabled:opacity-40 hover:bg-teal-800 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-600 text-center mt-2">
                {ASSISTANT_NAME} · Private to your team · Not visible to leads
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
