'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, MessageCircle, ChevronDown, Headphones, TrendingUp, CheckCircle2 } from 'lucide-react';
import { DEFAULT_CHATBOT_CONFIG } from '@/lib/chatbot/defaults';

function darken(hex, amount = 0.14) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return hex || '#4338ca';
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amount)) | 0;
  const b = Math.max(0, (n & 255) * (1 - amount)) | 0;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function BotAvatar({ name, primary, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0 ring-2 ring-white shadow-sm`}
      style={{ background: `linear-gradient(145deg, ${primary}, ${darken(primary, 0.08)})` }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Chatbot({
  businessId = '696956dde910b99089019e29',
  position = 'right',
  isPreview = false,
  previewConfig = null,
  landingPage = false,
  startOpen = false,
  embedded = false,
}) {
  const [widgetConfig, setWidgetConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(!isPreview);
  const [isOpen, setIsOpen] = useState(isPreview || startOpen);
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({
    name: '', email: '', phone: '', responses: [], supportType: '', supportMessage: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const startedRef = useRef(false);
  const leadRef = useRef(leadData);
  leadRef.current = leadData;

  const cfg = useMemo(() => {
    if (isPreview && previewConfig) return previewConfig;
    if (widgetConfig?.active) return widgetConfig;
    if (landingPage && !isPreview) {
      return {
        active: true,
        businessName: widgetConfig?.businessName || 'LeadForGrow',
        appearance: {
          ...DEFAULT_CHATBOT_CONFIG.appearance,
          botName: 'LeadForGrow',
          primaryColor: '#4F46E5',
          subtitle: 'We typically reply in under 5 minutes',
        },
        messages: {
          ...DEFAULT_CHATBOT_CONFIG.messages,
          greeting: 'Hi there! 👋 Welcome to LeadForGrow. What brings you here today?',
        },
        flow: DEFAULT_CHATBOT_CONFIG.flow,
      };
    }
    if (isPreview) {
      return {
        active: true,
        businessName: 'Your Business',
        appearance: DEFAULT_CHATBOT_CONFIG.appearance,
        messages: DEFAULT_CHATBOT_CONFIG.messages,
        flow: DEFAULT_CHATBOT_CONFIG.flow,
      };
    }
    return null;
  }, [isPreview, previewConfig, widgetConfig, landingPage]);

  const flow = cfg?.flow || DEFAULT_CHATBOT_CONFIG.flow;
  const questions = useMemo(() => (flow.questions || []).filter(Boolean), [flow.questions]);
  const supportStep = 3 + questions.length;
  const messageStep = supportStep + (flow.askSupportType ? 1 : 0);

  const primary = cfg?.appearance?.primaryColor || '#4F46E5';
  const botName = cfg?.appearance?.botName || 'Support';
  const subtitle = cfg?.appearance?.subtitle || 'Typically replies in a few minutes';
  const showBranding = cfg?.appearance?.showBranding !== false;
  const pos = cfg?.appearance?.position || position;

  useEffect(() => {
    if (isPreview || !businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/chatbot/config?businessId=${businessId}`);
        const json = await res.json();
        if (!cancelled && json.success) setWidgetConfig(json.data);
      } catch {
        if (!cancelled) setWidgetConfig({ active: false });
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId, isPreview]);

  useEffect(() => {
    if (!cfg) return;
    setMessages([{ type: 'bot', text: cfg.messages?.greeting || DEFAULT_CHATBOT_CONFIG.messages.greeting }]);
    setStep(0);
    setLeadData({ name: '', email: '', phone: '', responses: [], supportType: '', supportMessage: '' });
    setSubmitted(false);
  }, [cfg?.messages?.greeting, previewConfig]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !submitted) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, submitted, step]);

  const addMessage = useCallback((text, type = 'bot') => {
    setMessages((prev) => [...prev, { type, text }]);
  }, []);

  const notifyParent = (action) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'LFG_CHAT_MSG', action }, '*');
    }
  };

  useEffect(() => {
    if (!startOpen || isPreview || startedRef.current) return;
    startedRef.current = true;
    notifyParent('open');
    fetch('/api/public/chatbot/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, event: 'conversation_started' }),
    }).catch(() => {});
  }, [startOpen, isPreview, businessId]);

  const openChat = () => {
    setIsOpen(true);
    notifyParent('open');
    if (!startedRef.current && !isPreview) {
      startedRef.current = true;
      fetch('/api/public/chatbot/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, event: 'conversation_started' }),
      }).catch(() => {});
    }
  };

  const closeChat = () => {
    if (embedded) {
      notifyParent('close');
      return;
    }
    setIsOpen(false);
    notifyParent('close');
  };

  const afterContact = () => {
    if (questions.length) return { text: questions[0], next: 3 };
    if (flow.askSupportType) return { text: 'Would you like to speak with Sales or Technical Support?', next: supportStep };
    return { text: 'Tell us a bit about what you need — we\'ll route you to the right person.', next: messageStep };
  };

  const handleSend = async (overrideText) => {
    const userText = (overrideText ?? inputValue).trim();
    if (!userText || submitted) return;

    addMessage(userText, 'user');
    setInputValue('');
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 700));

    let nextStep = step;
    let botResponse = '';

    if (step === 0) {
      setLeadData((prev) => ({ ...prev, name: userText }));
      if (flow.collectEmail) {
        botResponse = `Great to meet you, ${userText}! What's the best email to reach you?`;
        nextStep = 1;
      } else if (flow.collectPhone) {
        botResponse = `Thanks, ${userText}! What's your phone number?`;
        nextStep = 2;
      } else {
        ({ text: botResponse, next: nextStep } = afterContact());
      }
    } else if (step === 1) {
      if (!userText.includes('@') || !userText.includes('.')) {
        addMessage("Hmm, that email doesn't look right. Could you double-check it?");
        setIsTyping(false);
        return;
      }
      setLeadData((prev) => ({ ...prev, email: userText }));
      if (flow.collectPhone) {
        botResponse = 'Perfect. And your phone number? (with country code if outside India)';
        nextStep = 2;
      } else {
        ({ text: botResponse, next: nextStep } = afterContact());
      }
    } else if (step === 2) {
      setLeadData((prev) => ({ ...prev, phone: userText }));
      ({ text: botResponse, next: nextStep } = afterContact());
    } else if (step >= 3 && step < supportStep) {
      const qIdx = step - 3;
      setLeadData((prev) => ({
        ...prev,
        responses: [...prev.responses, { question: questions[qIdx], answer: userText }],
      }));
      if (qIdx < questions.length - 1) {
        botResponse = questions[qIdx + 1];
        nextStep = step + 1;
      } else if (flow.askSupportType) {
        botResponse = 'Almost done — Sales or Technical Support?';
        nextStep = supportStep;
      } else {
        botResponse = 'Anything else we should know before we connect you with the team?';
        nextStep = messageStep;
      }
    } else if (step === supportStep && flow.askSupportType) {
      const type = userText.toLowerCase().includes('tech') ? 'technical' : 'sales';
      setLeadData((prev) => ({ ...prev, supportType: type }));
      botResponse = 'Please share a brief note about your requirement:';
      nextStep = messageStep;
    } else if (step === messageStep) {
      const current = leadRef.current;
      const finalLead = { ...current, supportMessage: userText, businessId };
      nextStep = messageStep + 1;
      setSubmitted(true);
      setLeadData((prev) => ({ ...prev, supportMessage: userText }));

      if (flow.aiEnabled && !isPreview) {
        try {
          const aiRes = await fetch('/api/public/chatbot/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId,
              message: userText,
              history: messages.slice(-10),
            }),
          });
          const aiData = await aiRes.json();
          botResponse = aiData.success && aiData.reply
            ? aiData.reply
            : (cfg?.messages?.thankYou || DEFAULT_CHATBOT_CONFIG.messages.thankYou);
        } catch (err) {
          console.error('[Chatbot] AI reply failed:', err);
          botResponse = cfg?.messages?.thankYou || DEFAULT_CHATBOT_CONFIG.messages.thankYou;
        }
      } else {
        botResponse = cfg?.messages?.thankYou || DEFAULT_CHATBOT_CONFIG.messages.thankYou;
      }

      const transcript = [...messages, { type: 'user', text: userText }, { type: 'bot', text: botResponse }];

      if (!isPreview) {
        try {
          await fetch('/api/public/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...finalLead, transcript }),
          });
        } catch (err) {
          console.error('[Chatbot] Submit failed:', err);
        }
      }
    }

    setIsTyping(false);
    if (botResponse) addMessage(botResponse);
    setStep(nextStep);
  };

  if (!isPreview && configLoading) return null;
  if (!isPreview && !landingPage && !cfg?.active) return null;

  const posClass = embedded
    ? 'absolute inset-0'
    : isPreview
      // Spans the preview box (inset-x-4) so a narrow box can shrink the panel.
      ? `absolute bottom-4 inset-x-4 flex flex-col ${pos === 'left' ? 'items-start' : 'items-end'} pointer-events-none [&>*]:pointer-events-auto`
      : `fixed bottom-6 ${pos === 'left' ? 'left-6' : 'right-6'} z-[9999]`;

  const showQuickReplies = step === supportStep && flow.askSupportType && !submitted;
  const showInput = !submitted && !showQuickReplies;
  // On a phone the 400px panel would run off the left edge; keep 1.5rem clear on each side.
  const panelW = embedded ? 'w-full' : isPreview ? 'w-[360px] max-w-full' : 'w-[400px] max-w-[calc(100vw-3rem)]';
  const panelH = embedded ? 'h-full' : isPreview ? 'h-[540px]' : 'h-[620px] max-h-[88vh]';

  const inputPlaceholder =
    step === 0 ? 'Type your name…'
    : step === 1 ? 'you@company.com'
    : step === 2 ? '+91 98765 43210'
    : 'Write a message…';

  return (
    <div className={`${posClass} font-sans antialiased`}>
      {/* Launcher — HubSpot-style pill + icon */}
      {!isOpen && !embedded && (
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={openChat}
            aria-label="Open chat"
            className="group flex items-center gap-2 rounded-full bg-white pl-4 pr-2 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)] border border-slate-200/80 hover:shadow-[0_12px_40px_rgba(15,23,42,0.16)] hover:border-slate-300 transition-all duration-300 active:scale-[0.98]"
          >
            <span className="text-sm font-semibold text-slate-800">Chat with us</span>
            <span
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md"
              style={{ background: `linear-gradient(145deg, ${primary}, ${darken(primary)})` }}
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2.25} />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
            </span>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`${panelW} ${panelH} flex flex-col overflow-hidden ${embedded ? 'rounded-none shadow-none border-0' : 'rounded-[20px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-300'} bg-white`}
        >
          {/* Header — clean HubSpot-style white bar */}
          <div className="relative flex-shrink-0 border-b border-slate-100 bg-white px-4 py-3.5">
            <div
              className="absolute inset-x-0 top-0 h-[3px] rounded-t-[20px]"
              style={{ background: `linear-gradient(90deg, ${primary}, ${darken(primary, 0.05)})` }}
            />
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex items-center gap-3 min-w-0">
                <BotAvatar name={botName} primary={primary} />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-slate-900 truncate leading-tight">{botName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">{subtitle}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
            style={{ backgroundColor: '#f5f8fa' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.type === 'bot' && <BotAvatar name={botName} primary={primary} size="sm" />}
                <div className={`max-w-[82%] ${msg.type === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {msg.type === 'bot' && i > 0 && (
                    <span className="text-[10px] font-medium text-slate-400 ml-1">{botName}</span>
                  )}
                  <div
                    className={`px-4 py-2.5 text-[13.5px] leading-[1.55] ${
                      msg.type === 'user'
                        ? 'text-white rounded-[18px] rounded-br-[4px] shadow-sm'
                        : 'bg-white text-slate-800 rounded-[18px] rounded-bl-[4px] shadow-[0_1px_3px_rgba(15,23,42,0.06)] border border-slate-100/80'
                    }`}
                    style={msg.type === 'user' ? { backgroundColor: primary } : undefined}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5">
                <BotAvatar name={botName} primary={primary} size="sm" />
                <div className="bg-white border border-slate-100 px-4 py-3.5 rounded-[18px] rounded-bl-[4px] shadow-sm flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: primary, opacity: 0.35 + i * 0.2, animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {submitted && (
              <div className="flex flex-col items-center py-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-slate-900">You&apos;re all set!</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px]">Our team will reach out shortly. Feel free to close this window.</p>
              </div>
            )}
          </div>

          {/* Footer / input */}
          <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-3">
            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleSend('Sales Support')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: primary }} /> Sales
                </button>
                <button
                  type="button"
                  onClick={() => handleSend('Technical Support')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Headphones className="w-3.5 h-3.5" style={{ color: primary }} /> Technical
                </button>
              </div>
            )}

            {showInput && (
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-[#f5f8fa] p-1.5 focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={inputPlaceholder}
                  className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-30 disabled:scale-95 hover:opacity-90 active:scale-95 shadow-sm"
                  style={{ backgroundColor: primary }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {showBranding && (
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <span className="text-[10px] text-slate-400">Powered by</span>
                <a
                  href="https://www.leadforgrow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  LeadForGrow
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
