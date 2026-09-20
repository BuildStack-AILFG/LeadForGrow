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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
          <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Chatbot conversation</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Captured from website widget</p>
        </div>
      </div>

      <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
        {hasTranscript ? (
          <div className="space-y-2">
            {transcript.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded text-xs leading-relaxed ${
                    msg.type === 'user'
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm'
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
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-0.5">{r.question}</p>
                    <p className="text-slate-800 dark:text-slate-200">{r.answer}</p>
                  </div>
                ))}
              </div>
            )}
            {supportType && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Support type: <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{supportType}</span>
              </p>
            )}
            {supportMessage && (
              <div className="flex gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-300">{supportMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
