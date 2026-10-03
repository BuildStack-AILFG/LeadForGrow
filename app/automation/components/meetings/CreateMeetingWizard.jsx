'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { WIZARD_STEPS, MEETING_TYPE_OPTIONS, ASSIGNMENT_OPTIONS } from './constants';
import MeetingAutomationStep from './MeetingAutomationStep';

export default function CreateMeetingWizard({
  step,
  draft,
  onChange,
  onNext,
  onBack,
  onCancel,
  onPublish,
  saving,
  editing = false,
}) {
  const patch = (p) => onChange({ ...draft, ...p });
  const patchAvail = (p) =>
    onChange({ ...draft, availabilityRules: { ...draft.availabilityRules, ...p } });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm text-fg-tertiary dark:text-fg-tertiary hover:text-fg dark:hover:text-slate-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      <div className="mb-8">
        <p className="text-meta font-semibold text-accent-fg dark:text-accent-fg mb-1">
          Revenue Scheduling Setup
        </p>
        <h1 className="text-page font-semibold text-fg">Create booking link</h1>
      </div>

      <nav className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {WIZARD_STEPS.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              step === s.id
                ? 'bg-accent text-white'
                : step > s.id
                  ? 'bg-accent-subtle text-accent-fg dark:bg-indigo-950/50 dark:text-accent-fg'
                  : 'bg-muted text-fg-tertiary dark:text-fg-tertiary dark:bg-slate-800'
            }`}
          >
            {step > s.id ? <Check className="w-3 h-3" /> : s.id}
            {s.label}
          </div>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="bg-canvas dark:bg-slate-900 rounded-lg border border-line dark:border-slate-800 p-6 sm:p-8"
        >
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary">Meeting name</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-canvas dark:bg-slate-950 text-sm"
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="e.g. Product Demo — 30 min"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Meeting type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {MEETING_TYPE_OPTIONS.map((t) => {
                    const Icon = t.icon;
                    const sel = draft.category === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => patch({ category: t.id })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          sel ? 'border-accent bg-accent-subtle dark:bg-indigo-950/30' : 'border-line dark:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-accent-fg dark:text-accent-fg mb-1" />
                        <p className="text-xs font-semibold text-fg dark:text-slate-200">{t.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Duration (minutes)</label>
                  <select
                    className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 text-sm bg-canvas dark:bg-slate-950"
                    value={draft.durationMinutes}
                    onChange={(e) => patch({ durationMinutes: Number(e.target.value) })}
                  >
                    {[15, 30, 45, 60, 90].map((m) => (
                      <option key={m} value={m}>{m} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Booking URL slug</label>
                  <div className="mt-1 flex rounded-lg border border-line dark:border-slate-700 overflow-hidden">
                    <span className="px-3 py-2.5 bg-subtle dark:bg-slate-800 text-xs text-fg-tertiary dark:text-fg-tertiary">/book/</span>
                    <input
                      className="flex-1 min-w-0 px-2 py-2.5 text-sm bg-canvas dark:bg-slate-950 outline-none"
                      value={draft.bookingSlug}
                      onChange={(e) => patch({ bookingSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="demo-call"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled mb-2 block">Assignment</label>
                <div className="space-y-2">
                  {ASSIGNMENT_OPTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => patch({ assignmentMode: a.id })}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        draft.assignmentMode === a.id
                          ? 'border-accent bg-accent-subtle dark:bg-indigo-950/20'
                          : 'border-line dark:border-slate-700'
                      }`}
                    >
                      <p className="text-sm font-semibold text-fg dark:text-slate-100">{a.title}</p>
                      <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{a.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Start time</label>
                  <input
                    type="time"
                    className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 text-sm"
                    value={draft.availabilityRules?.startTime || '09:00'}
                    onChange={(e) => patchAvail({ startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">End time</label>
                  <input
                    type="time"
                    className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 text-sm"
                    value={draft.availabilityRules?.endTime || '18:00'}
                    onChange={(e) => patchAvail({ endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Buffer after meetings (min)</label>
                <input
                  type="number"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 text-sm"
                  value={draft.availabilityRules?.bufferAfterMinutes ?? 15}
                  onChange={(e) => patchAvail({ bufferAfterMinutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Minimum notice (hours)</label>
                <input
                  type="number"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 text-sm"
                  value={draft.availabilityRules?.minNoticeHours ?? 2}
                  onChange={(e) => patchAvail({ minNoticeHours: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Timezone</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-line dark:border-slate-700 text-sm"
                  value={draft.availabilityRules?.timezone || 'Asia/Kolkata'}
                  onChange={(e) => patchAvail({ timezone: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 3 && <MeetingAutomationStep draft={draft} onChange={onChange} />}

          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-lg bg-accent-subtle dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-accent-fg dark:text-accent-fg" />
              </div>
              <h3 className="text-lg font-semibold text-fg dark:text-slate-50 mb-2">{editing ? 'Ready to save' : 'Ready to publish'}</h3>
              <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mb-6 max-w-md mx-auto">
                Your revenue scheduling link will go live at{' '}
                <strong className="text-accent-fg dark:text-accent-fg">/book/{draft.bookingSlug || 'your-slug'}</strong>
                with the automations you chose.
              </p>
              <ul className="text-left text-sm text-fg-secondary dark:text-fg-tertiary space-y-2 max-w-sm mx-auto mb-8">
                <li>✓ {draft.title || 'Meeting'} · {draft.durationMinutes} min</li>
                <li>✓ {draft.assignmentMode === 'round_robin' ? 'Round-robin host assignment' : 'Host assignment'}</li>
                <li>{draft.automationRules?.whatsappConfirmation !== false || draft.automationRules?.whatsappReminder !== false
                  ? `✓ WhatsApp ${draft.automationRules?.whatsappConfirmationTemplateName || draft.automationRules?.whatsappReminderTemplateName ? 'with approved templates' : '(add an approved template to reach new guests)'}`
                  : '– WhatsApp messages off'}</li>
                <li>{draft.automationRules?.emailReminder !== false ? '✓ Email confirmation & reminders' : '– Email reminders off'}</li>
                <li>✓ CRM lead sync + “Update meeting outcome” task for the host</li>
              </ul>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={step === 1 ? onCancel : onBack}
          className="px-4 py-2 text-sm font-medium text-fg-secondary dark:text-fg-disabled hover:text-fg dark:hover:text-slate-50"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={onNext}
            disabled={step === 1 && !draft.title}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
          >
            {saving ? (editing ? 'Saving…' : 'Publishing…') : (editing ? 'Save changes' : 'Publish booking link')}
          </button>
        )}
      </div>
    </div>
  );
}
