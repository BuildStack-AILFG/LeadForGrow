'use client';

import Link from 'next/link';
import { X, Save, Settings2, GitBranch, ExternalLink } from 'lucide-react';
import AutomationStatusBadge from './StatusBadge';
import ChannelSelector from './ChannelSelector';
import TemplateEditor from './TemplateEditor';
import { getChannelLabel, getTriggerLabel } from './constants';
import HelpHint from '@/app/components/ui/HelpHint';

const TRIGGER_EXPLANATIONS = {
  'Incoming WhatsApp': 'Fires the moment a WhatsApp message arrives from this lead.',
  'New lead': 'Fires the instant a new lead is created in LeadForGrow, from any source.',
  'Status change': 'Fires when a lead moves to a different pipeline stage.',
  'No response': 'Fires when a lead has gone quiet for the configured time.',
  'Manual': 'This automation only runs when triggered manually or by another workflow.',
};

function SequenceRunnerPanel({ rule, onClose }) {
  return (
    <>
      <div className="flex-shrink-0 px-4 py-3 border-b border-line dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-fg dark:text-slate-50 truncate">{rule.name}</h3>
              <AutomationStatusBadge rule={rule} size="xs" />
            </div>
            <p className="text-xs text-fg-tertiary mt-0.5 line-clamp-2">{rule.description}</p>
            <div className="flex flex-wrap gap-2 mt-2 text-meta text-fg-tertiary">
              <span>{getTriggerLabel(rule)}</span>
              <span>·</span>
              <span>Workflow sequence</span>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 lg:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-4 rounded-lg bg-accent-subtle dark:from-teal-950/30 dark:to-indigo-950/20 border border-line dark:border-teal-900/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-canvas border border-line flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-fg-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg dark:text-slate-100">Sequence automation</p>
              <p className="text-xs text-fg-tertiary">Toggle ON/OFF from the list. Edit workflow in Sequences.</p>
            </div>
          </div>
          <Link
            href="/automation/sequences"
            className="inline-flex items-center gap-2 text-xs font-medium text-accent-fg hover:text-accent-fg dark:text-accent-fg"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Edit workflow in Sequences
          </Link>
        </div>
        <p className="text-xs text-fg-tertiary leading-relaxed">
          This rule runs the linked sequence when its trigger fires. Use the toggle on the automation card to activate or pause — no template editing here.
        </p>
      </div>
    </>
  );
}

function PanelContent({
  rule,
  form,
  onFormChange,
  templateRules,
  cloudinaryConfig,
  onCloudinaryChange,
  onUploadMedia,
  onSave,
  saving,
  onClose
}) {
  if (!rule || !form) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted dark:bg-slate-800 flex items-center justify-center mb-4">
          <Settings2 className="w-6 h-6 text-fg-disabled dark:text-fg-secondary" />
        </div>
        <p className="text-sm font-medium text-fg-secondary dark:text-fg-tertiary">Select an automation</p>
        <p className="text-xs text-fg-tertiary mt-1 max-w-xs">Choose a rule from the list to configure channels, templates, and settings.</p>
      </div>
    );
  }

  if (rule.type === 'sequence_runner') {
    return <SequenceRunnerPanel rule={rule} onClose={onClose} />;
  }

  const hasChannelConfig = ['instant_acknowledgement', 'lost_lead_reengagement'].includes(rule.type) || form.channel;

  return (
    <>
      <div className="flex-shrink-0 px-4 py-3 border-b border-line dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-fg dark:text-slate-50 truncate">{rule.name}</h3>
              <AutomationStatusBadge rule={rule} size="xs" />
            </div>
            <p className="text-xs text-fg-tertiary mt-0.5 line-clamp-2">{rule.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-meta text-fg-tertiary">
              <span className="inline-flex items-center gap-1">
                Trigger: {getTriggerLabel(rule)}
                <HelpHint size="xs" text={TRIGGER_EXPLANATIONS[getTriggerLabel(rule)] || 'What starts this automation.'} />
              </span>
              {form.channel && (
                <>
                  <span>·</span>
                  <span>{getChannelLabel({ config: form })}</span>
                </>
              )}
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 lg:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {hasChannelConfig && (
          <ChannelSelector value={form.channel} onChange={(channel) => onFormChange({ ...form, channel })} />
        )}

        {(hasChannelConfig || rule.type === 'follow_up_reminder') ? (
          <TemplateEditor
            form={form}
            onChange={onFormChange}
            rule={rule}
            templateRules={templateRules}
            cloudinaryConfig={cloudinaryConfig}
            onCloudinaryChange={onCloudinaryChange}
            onUploadMedia={onUploadMedia}
          />
        ) : (
          <div className="p-4 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700">
            <p className="text-xs text-fg-secondary dark:text-fg-tertiary">
              This automation runs automatically with built-in logic. Toggle it on or off from the list — no template configuration needed.
            </p>
            {rule.type === 'auto_assign' && (
              <p className="text-meta text-fg-tertiary mt-2">Assignment: {rule.config?.assignmentRule || 'round-robin'}</p>
            )}
          </div>
        )}
      </div>

      {(hasChannelConfig || rule.type === 'follow_up_reminder') && (
        <div className="flex-shrink-0 p-4 border-t border-line dark:border-slate-800">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save settings
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

export default function AutomationSettingsPanel({
  rule,
  form,
  onFormChange,
  templateRules,
  cloudinaryConfig,
  onCloudinaryChange,
  onUploadMedia,
  onSave,
  saving,
  mobile = false,
  onClose
}) {
  const panel = (
    <PanelContent
      rule={rule}
      form={form}
      onFormChange={onFormChange}
      templateRules={templateRules}
      cloudinaryConfig={cloudinaryConfig}
      onCloudinaryChange={onCloudinaryChange}
      onUploadMedia={onUploadMedia}
      onSave={onSave}
      saving={saving}
      onClose={onClose}
    />
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
        <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
        <aside className="relative w-full max-w-md h-full bg-canvas dark:bg-slate-900 shadow-modal flex flex-col">
          {panel}
        </aside>
      </div>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col h-[calc(100vh-180px)] sticky top-[140px] bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg overflow-hidden">
      {panel}
    </aside>
  );
}
