'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { authFetch } from '@/lib/apiClient';
import { ASSISTANT_NAME, ASSISTANT_TAGLINE } from '@/lib/assistant/brand';

const SUGGESTIONS = [
  'Give me a business overview',
  'Who should I call today?',
  'Pipeline & revenue summary',
  'Automation status',
  'What is my revenue at risk?',
];

export function useBusinessAssistantChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const loadContext = useCallback(async () => {
    try {
      const res = await authFetch('/api/ai/business-assistant');
      const data = await res.json();
      if (data.success) setContext(data.data);
    } catch { /* ignore */ }
  }, []);

  // Shared init routine, callable directly (bypassing the `initialized` gate) so a
  // Reset immediately following a reset doesn't hit a stale-closure no-op — see `reset` below.
  const runInit = useCallback(async () => {
    let bizName = 'your business';
    try {
      const res = await authFetch('/api/ai/business-assistant');
      const data = await res.json();
      if (data.success) {
        setContext(data.data);
        bizName = data.data.businessName || bizName;
      }
    } catch { /* ignore */ }

    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm **${ASSISTANT_NAME}** — ${bizName}'s ${ASSISTANT_TAGLINE.toLowerCase()}. I know your pipeline, automations, and team metrics.\n\nAsk me anything about sales, leads, or growth. This is **private to your team** — not a lead-facing chatbot.\n\nWhat would you like to know?`,
      suggestions: SUGGESTIONS,
    }]);
    setInitialized(true);
  }, []);

  const initChat = useCallback(() => {
    if (initialized) return;
    return runInit();
  }, [initialized, runInit]);

  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    setInput('');
    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await authFetch('/api/ai/business-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setMessages((prev) => [...prev, {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        source: data.source,
      }]);

      if (data.context) {
        setContext((c) => ({ ...c, ...data.context, metrics: data.context.metrics }));
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: `e_${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I couldn't process that. ${err.message || 'Please try again.'}`,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const reset = useCallback(() => {
    setMessages([]);
    setInitialized(false);
    setContext(null);
    runInit();
  }, [runInit]);

  return {
    messages, input, setInput, loading, context, sendMessage, initChat, reset, loadContext, SUGGESTIONS,
  };
}

export function useAutoScroll(deps) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, deps);
  return ref;
}
