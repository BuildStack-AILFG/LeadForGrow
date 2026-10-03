'use client';

import { Bot, MessageSquare } from 'lucide-react';

function getBotData(lead) {
  const meta = lead.metadata instanceof Map
    ? Object.fromEntries(lead.metadata)
    : lead.metadata || {};

  return {
    responses: meta.botResponses || [],
    transcript: meta.chatTranscript || [],
    supportType: meta.supportType,
    supportMessage: meta.supportMessage || lead.message,
  };
}

export default function ChatbotTranscript({ lead }) {
  if (lead.source !== 'bot') return null;

  const { responses, transcript, supportType, supportMessage } = getBotData(lead);
  const hasTranscript = transcript.length > 0;
  const hasResponses = responses.length > 0;

  if (!hasTranscript && !hasResponses && !supportMessage) return null;

  return (
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-canvas border border-line dark:bg-teal-950/40 flex items-center justify-center">
          <Bot className="w-4 h-4 text-fg-secondary dark:text-accent-fg" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg dark:text-slate-50">Chatbot conversation</p>
          <p className="text-meta text-fg-tertiary">Captured from website widget</p>
        </div>
      </div>

      <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
        {hasTranscript ? (
          <div className="space-y-2">
            {transcript.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.type === 'user'
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-disabled rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {hasResponses && (
              <div className="space-y-3">
                {responses.map((r, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-meta font-medium text-fg-tertiary mb-0.5">{r.question}</p>
                    <p className="text-fg dark:text-slate-200">{r.answer}</p>
                  </div>
                ))}
              </div>
            )}
            {supportType && (
              <p className="text-xs text-fg-tertiary">
                Support type: <span className="font-medium text-fg-secondary dark:text-fg-disabled capitalize">{supportType}</span>
              </p>
            )}
            {supportMessage && (
              <div className="flex gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-fg-tertiary flex-shrink-0 mt-0.5" />
                <p className="text-fg-secondary dark:text-fg-disabled">{supportMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
