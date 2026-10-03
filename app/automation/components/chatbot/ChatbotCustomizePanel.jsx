'use client';

import { useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { COLOR_PRESETS } from './constants';
import { Field, fieldClass } from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';
import Switch from '@/app/components/ui/Switch';
import cx, { focusRing } from '@/app/components/ui/cx';

function Section({ title, description, children }) {
  return (
    <section className="grid gap-4 px-5 py-5 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6">
      <div>
        <h3 className="text-body font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-meta text-fg-tertiary">{description}</p>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

function ToggleRow({ label, hint, checked, onChange }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-dense font-medium text-fg">{label}</label>
        {hint && <p className="mt-0.5 text-meta text-fg-tertiary">{hint}</p>}
      </div>
      <Switch id={id} checked={!!checked} onChange={onChange} />
    </div>
  );
}

export default function ChatbotCustomizePanel({ config, onChange }) {
  const { appearance, messages, flow } = config;

  const setAppearance = (patch) => onChange({ appearance: { ...appearance, ...patch } });
  const setMessages = (patch) => onChange({ messages: { ...messages, ...patch } });
  const setFlow = (patch) => onChange({ flow: { ...flow, ...patch } });

  const questions = flow.questions || [];
  const updateQuestion = (idx, value) => {
    const next = [...questions];
    next[idx] = value;
    setFlow({ questions: next });
  };
  const addQuestion = () => setFlow({ questions: [...questions, ''] });
  const removeQuestion = (idx) => setFlow({ questions: questions.filter((_, i) => i !== idx) });

  const color = appearance.primaryColor || '#0f766e';

  return (
    <div className="divide-y divide-line">
      <Section title="Look" description="How the chat button and window appear on your site.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bot name" htmlFor="cb-name">
            <input
              id="cb-name"
              type="text"
              value={appearance.botName || ''}
              onChange={(e) => setAppearance({ botName: e.target.value })}
              className={fieldClass()}
              placeholder="Support"
            />
          </Field>
          <Select
            label="Position"
            value={appearance.position || 'right'}
            onChange={(e) => setAppearance({ position: e.target.value })}
            options={[
              { value: 'right', label: 'Bottom right' },
              { value: 'left', label: 'Bottom left' },
            ]}
          />
        </div>
        <Field label="Subtitle" htmlFor="cb-sub">
          <input
            id="cb-sub"
            type="text"
            value={appearance.subtitle || ''}
            onChange={(e) => setAppearance({ subtitle: e.target.value })}
            className={fieldClass()}
            placeholder="Typically replies in a few minutes"
          />
        </Field>
        <Field label="Colour">
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAppearance({ primaryColor: c })}
                aria-label={`Use colour ${c}`}
                aria-pressed={color === c}
                className={cx(
                  'h-7 w-7 rounded-md ring-offset-2 ring-offset-canvas',
                  color === c ? 'ring-2 ring-fg' : 'hover:ring-2 hover:ring-line-strong',
                  focusRing
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="ml-1 inline-flex items-center gap-2">
              <span className="sr-only">Custom colour</span>
              <input
                type="text"
                value={color}
                onChange={(e) => setAppearance({ primaryColor: e.target.value })}
                className={cx(fieldClass(), 'h-8 w-28 font-mono text-dense')}
              />
            </label>
          </div>
        </Field>
      </Section>

      <Section title="Messages" description="The first and last thing a visitor reads.">
        <Field label="Welcome message" htmlFor="cb-greet">
          <textarea
            id="cb-greet"
            rows={2}
            value={messages.greeting || ''}
            onChange={(e) => setMessages({ greeting: e.target.value })}
            className={cx(fieldClass(), 'h-auto py-2')}
          />
        </Field>
        <Field label="Thank-you message" htmlFor="cb-thanks">
          <textarea
            id="cb-thanks"
            rows={2}
            value={messages.thankYou || ''}
            onChange={(e) => setMessages({ thankYou: e.target.value })}
            className={cx(fieldClass(), 'h-auto py-2')}
          />
        </Field>
      </Section>

      <Section title="What to ask" description="Details collected before the lead is saved.">
        <div className="space-y-4">
          <ToggleRow label="Email address" checked={flow.collectEmail} onChange={(v) => setFlow({ collectEmail: v })} />
          <ToggleRow label="Phone number" checked={flow.collectPhone} onChange={(v) => setFlow({ collectPhone: v })} />
          <ToggleRow label="Sales or support?" hint="Lets you route the lead to the right person." checked={flow.askSupportType} onChange={(v) => setFlow({ askSupportType: v })} />
        </div>

        <div className="pt-1">
          <p className="text-dense font-medium text-fg">Your own questions</p>
          <p className="mt-0.5 mb-2 text-meta text-fg-tertiary">Asked one by one, in this order.</p>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-right text-meta text-fg-tertiary tabular">{idx + 1}.</span>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateQuestion(idx, e.target.value)}
                  className={fieldClass()}
                  placeholder="e.g. Which service are you interested in?"
                  aria-label={`Question ${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  aria-label={`Remove question ${idx + 1}`}
                  className={cx('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-tertiary hover:bg-danger-subtle hover:text-danger', focusRing)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className={cx('mt-2 inline-flex items-center gap-1.5 rounded-sm text-dense font-medium text-accent-fg hover:underline', focusRing)}
          >
            <Plus className="h-3.5 w-3.5" /> Add question
          </button>
        </div>
      </Section>

      <Section title="AI answer" description="Optional. Uses your Knowledge Base.">
        <ToggleRow
          label="Answer the visitor’s last message with AI"
          hint="Instead of the fixed thank-you message."
          checked={flow.aiEnabled}
          onChange={(v) => setFlow({ aiEnabled: v })}
        />
      </Section>
    </div>
  );
}
