'use client';

import { Plus, Trash2, GripVertical } from 'lucide-react';
import { COLOR_PRESETS } from './constants';

const inputClass = 'w-full text-sm px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-[#1D4B3E]/30 focus:border-teal-500 outline-none transition-all';
const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5 block';

export default function ChatbotCustomizePanel({ config, onChange }) {
  const { appearance, messages, flow } = config;

  const setAppearance = (patch) => onChange({ appearance: { ...appearance, ...patch } });
  const setMessages = (patch) => onChange({ messages: { ...messages, ...patch } });
  const setFlow = (patch) => onChange({ flow: { ...flow, ...patch } });

  const updateQuestion = (idx, value) => {
    const questions = [...(flow.questions || [])];
    questions[idx] = value;
    setFlow({ questions });
  };

  const addQuestion = () => setFlow({ questions: [...(flow.questions || []), ''] });
  const removeQuestion = (idx) => setFlow({ questions: flow.questions.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-8">
      {/* Appearance */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Bot name</label>
              <input
                type="text"
                value={appearance.botName || ''}
                onChange={(e) => setAppearance({ botName: e.target.value })}
                className={inputClass}
                placeholder="Support"
              />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <select
                value={appearance.position || 'right'}
                onChange={(e) => setAppearance({ position: e.target.value })}
                className={inputClass}
              >
                <option value="right">Bottom right</option>
                <option value="left">Bottom left</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Subtitle</label>
            <input
              type="text"
              value={appearance.subtitle || ''}
              onChange={(e) => setAppearance({ subtitle: e.target.value })}
              className={inputClass}
              placeholder="Typically replies in a few minutes"
            />
          </div>

          <div>
            <label className={labelClass}>Brand color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAppearance({ primaryColor: c })}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                    appearance.primaryColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="text"
              value={appearance.primaryColor || '#0f766e'}
              onChange={(e) => setAppearance({ primaryColor: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Messages */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Messages</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Welcome message</label>
            <textarea
              rows={2}
              value={messages.greeting || ''}
              onChange={(e) => setMessages({ greeting: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Thank you message</label>
            <textarea
              rows={2}
              value={messages.thankYou || ''}
              onChange={(e) => setMessages({ thankYou: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Flow */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Lead capture flow</h3>
        <div className="space-y-3 mb-4">
          {[
            { key: 'collectEmail', label: 'Ask for email' },
            { key: 'collectPhone', label: 'Ask for phone' },
            { key: 'askSupportType', label: 'Ask sales vs support' },
            { key: 'aiEnabled', label: 'Answer their final message with AI (using your Knowledge Base) instead of a canned "thank you"' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={!!flow[key]}
                onChange={(e) => setFlow({ [key]: e.target.checked })}
                className="rounded text-[#1D4B3E]"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
            </label>
          ))}
        </div>

        <label className={labelClass}>Qualification questions</label>
        <div className="space-y-2">
          {(flow.questions || []).map((q, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <input
                type="text"
                value={q}
                onChange={(e) => updateQuestion(idx, e.target.value)}
                className={inputClass}
                placeholder={`Question ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 mt-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add question
          </button>
        </div>
      </section>
    </div>
  );
}
