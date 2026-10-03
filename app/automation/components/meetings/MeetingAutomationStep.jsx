'use client';

/**
 * Step 3 of the meeting setup: what happens automatically around a booking.
 * Every control here maps to something the booking engine actually does
 * (lib/meetings/reminders.js, crmSync.js).
 */
import { useEffect, useMemo, useState } from 'react';
import { Mail, GitBranch, Kanban, Clock, UserX, AlertTriangle } from 'lucide-react';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { authFetch } from '@/lib/apiClient';
import {
  DEFAULT_REMINDER_SCHEDULE, REMINDER_TIME_OPTIONS, buildReminderSchedule, formatStartsIn,
} from '@/lib/meetings/constants';
import { MEETING_STAGE_OPTIONS, stageKeyFromRules } from '@/lib/meetings/leadStage';

export function ToggleRow({ icon: Icon, label, description, checked, onChange, children }) {
  return (
    <div className="rounded-lg border border-line dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className="w-5 h-5 text-accent-fg dark:text-accent-fg mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg dark:text-slate-100">{label}</p>
            {description && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5">{description}</p>}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          className={`w-11 h-6 shrink-0 rounded-full transition-colors relative ${checked ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-canvas transition-transform ${checked ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      {checked && children && <div className="border-t border-line dark:border-slate-800 px-4 py-3 space-y-2">{children}</div>}
    </div>
  );
}

// Reminders can't use templates with an image/video/document header: they need
// a media file per send, which a reminder doesn't have.
const usableTemplate = (t) => {
  const header = (t.components || []).find((c) => (c.type || '').toUpperCase() === 'HEADER');
  return !header || (header.format || 'TEXT').toUpperCase() === 'TEXT';
};

const bodyText = (t) => (t.components || []).find((c) => (c.type || '').toUpperCase() === 'BODY')?.text || '';

function TemplatePicker({ label, templates, loading, name, language, onChange }) {
  const value = name ? `${name}::${language || 'en'}` : '';
  const picked = templates.find((t) => `${t.name}::${t.language || 'en'}` === value);
  return (
    <div>
      <label className="block text-meta font-medium text-fg-secondary dark:text-fg-disabled mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => {
          const [n, lang] = e.target.value ? e.target.value.split('::') : ['', ''];
          onChange({ name: n, language: lang || 'en' });
        }}
        className="w-full px-3 py-2 rounded-lg border border-line dark:border-slate-600 bg-canvas dark:bg-slate-900 text-sm"
      >
        <option value="">{loading ? 'Loading approved templates…' : 'No template — plain message (only reaches people who messaged you in the last 24 h)'}</option>
        {templates.map((t) => (
          <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language || 'en'}`}>{t.name} ({t.language || 'en'})</option>
        ))}
      </select>
      {picked && <p className="mt-1 text-meta text-fg-tertiary dark:text-fg-tertiary line-clamp-2">“{bodyText(picked)}”</p>}
    </div>
  );
}

export default function MeetingAutomationStep({ draft, onChange }) {
  const rules = draft.automationRules || {};
  const patchAuto = (p) => onChange({ ...draft, automationRules: { ...rules, ...p } });

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  useEffect(() => {
    let alive = true;
    authFetch('/api/automation/whatsapp-templates?status=APPROVED')
      .then((r) => r.json())
      .then((d) => { if (alive && d.success) setTemplates((d.data || []).filter(usableTemplate)); })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingTemplates(false); });
    return () => { alive = false; };
  }, []);

  const reminderMinutes = useMemo(() => {
    const schedule = Array.isArray(rules.reminderSchedule) && rules.reminderSchedule.length ? rules.reminderSchedule : DEFAULT_REMINDER_SCHEDULE;
    return schedule.map((s) => Number(s.minutesBefore));
  }, [rules.reminderSchedule]);

  const toggleReminderTime = (m) => {
    const next = reminderMinutes.includes(m) ? reminderMinutes.filter((x) => x !== m) : [...reminderMinutes, m];
    if (!next.length) return; // keep at least one reminder; turn reminders off with the switches instead
    patchAuto({ reminderSchedule: buildReminderSchedule(next) });
  };

  const stageKey = stageKeyFromRules(rules) || '';
  const anyWhatsApp = rules.whatsappConfirmation !== false || rules.whatsappReminder !== false || rules.noShowRecovery !== false;
  const missingTemplate = anyWhatsApp && !loadingTemplates && (
    (rules.whatsappConfirmation !== false && !rules.whatsappConfirmationTemplateName)
    || (rules.whatsappReminder !== false && !rules.whatsappReminderTemplateName)
  );

  return (
    <div className="space-y-4">
      <ToggleRow
        icon={WhatsAppIcon}
        label="WhatsApp confirmation"
        description="Sent right after someone books."
        checked={rules.whatsappConfirmation !== false}
        onChange={(v) => patchAuto({ whatsappConfirmation: v })}
      >
        <TemplatePicker
          label="Approved template"
          templates={templates}
          loading={loadingTemplates}
          name={rules.whatsappConfirmationTemplateName}
          language={rules.whatsappConfirmationTemplateLanguage}
          onChange={({ name, language }) => patchAuto({ whatsappConfirmationTemplateName: name, whatsappConfirmationTemplateLanguage: language })}
        />
      </ToggleRow>

      <div className="rounded-lg border border-line dark:border-slate-700 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-fg dark:text-slate-100">
          <Clock className="w-4 h-4 text-accent-fg dark:text-accent-fg" /> Reminder times
        </div>
        <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">Before the meeting, on the channels switched on below.</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Reminder times">
          {REMINDER_TIME_OPTIONS.map((m) => {
            const on = reminderMinutes.includes(m);
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => toggleReminderTime(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${on ? 'bg-accent border-accent text-white' : 'border-line dark:border-slate-600 text-fg-secondary dark:text-fg-disabled hover:border-line'}`}
              >
                {formatStartsIn(m)} before
              </button>
            );
          })}
        </div>
      </div>

      <ToggleRow
        icon={WhatsAppIcon}
        label="WhatsApp reminders"
        description={`At ${reminderMinutes.slice().sort((a, b) => b - a).map(formatStartsIn).join(', ')} before.`}
        checked={rules.whatsappReminder !== false}
        onChange={(v) => patchAuto({ whatsappReminder: v })}
      >
        <TemplatePicker
          label="Approved template"
          templates={templates}
          loading={loadingTemplates}
          name={rules.whatsappReminderTemplateName}
          language={rules.whatsappReminderTemplateLanguage}
          onChange={({ name, language }) => patchAuto({ whatsappReminderTemplateName: name, whatsappReminderTemplateLanguage: language })}
        />
      </ToggleRow>

      <ToggleRow
        icon={Mail}
        label="Email confirmation & reminders"
        description="Sent when the guest gave an email address."
        checked={rules.emailReminder !== false}
        onChange={(v) => patchAuto({ emailReminder: v })}
      />

      <ToggleRow
        icon={UserX}
        label="No-show recovery"
        description="When you mark a booking as no-show, the guest gets a WhatsApp message with a link to rebook."
        checked={rules.noShowRecovery !== false}
        onChange={(v) => patchAuto({ noShowRecovery: v })}
      >
        <TemplatePicker
          label="Approved template"
          templates={templates}
          loading={loadingTemplates}
          name={rules.noShowRecoveryTemplateName}
          language={rules.noShowRecoveryTemplateLanguage}
          onChange={({ name, language }) => patchAuto({ noShowRecoveryTemplateName: name, noShowRecoveryTemplateLanguage: language })}
        />
      </ToggleRow>

      {anyWhatsApp && (
        <div className={`flex gap-2 rounded-lg p-3 text-xs ${missingTemplate ? 'bg-warning-subtle dark:bg-amber-950/30 text-warning dark:text-amber-200' : 'bg-subtle dark:bg-slate-800/50 text-fg-secondary dark:text-fg-disabled'}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            {missingTemplate && <strong>WhatsApp needs an approved template to reach new guests. </strong>}
            Template variables are filled in this order: {'{{1}}'} guest name, {'{{2}}'} meeting name, {'{{3}}'} your business name,
            {' {{4}}'} date &amp; time, {'{{5}}'} join link (rebook link for no-shows). Templates can use fewer variables.
          </p>
        </div>
      )}

      <ToggleRow
        icon={GitBranch}
        label="Run automations when booked"
        description="Starts sequences and rules that use the “Meeting scheduled” trigger."
        checked={rules.triggerAutomationOnBook !== false}
        onChange={(v) => patchAuto({ triggerAutomationOnBook: v })}
      />

      <div className="p-4 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700">
        <label htmlFor="meeting-stage" className="flex items-center gap-2 text-sm font-medium text-fg dark:text-slate-200 mb-2">
          <Kanban className="w-4 h-4 text-accent-fg dark:text-accent-fg" />
          Move the lead to this stage when they book
        </label>
        <select
          id="meeting-stage"
          value={stageKey}
          onChange={(e) => patchAuto({ leadStatusOnBook: e.target.value, pipelineStageOnBook: '' })}
          className="w-full px-3 py-2 rounded-lg border border-line dark:border-slate-600 bg-canvas dark:bg-slate-900 text-sm"
        >
          <option value="">Don&apos;t change the stage</option>
          {MEETING_STAGE_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <p className="mt-2 text-meta text-fg-tertiary dark:text-fg-tertiary">
          The host also gets an “Update meeting outcome” task when the meeting ends, so completed and no-show meetings are recorded.
        </p>
      </div>
    </div>
  );
}
