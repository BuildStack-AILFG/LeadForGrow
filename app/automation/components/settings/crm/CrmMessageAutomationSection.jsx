'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CRM_MESSAGE_GROUPS, CRM_TEMPLATE_VARIABLES, CRM_PREVIEW_CONTEXT } from '@/lib/crm/crmSettings.constants';
import { renderCrmTemplate } from '@/lib/crm/templateVars';
import { CrmSwitch } from './CrmUiPrimitives';
import { CrmIconBadge, CRM_MESSAGE_ICONS, WhatsAppIcon, GmailIcon } from './CrmIcons';

const inputCls =
  'w-full px-3.5 py-2.5 text-sm border border-line/80 dark:border-slate-700/80 rounded-lg bg-subtle dark:bg-slate-950 text-fg dark:text-slate-100 placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-line-strong dark:focus:border-slate-500 focus:bg-canvas dark:focus:bg-slate-900 transition-all';

function VariableChips({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {CRM_TEMPLATE_VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(`{{${v.key}}}`)}
          className="text-meta font-mono px-2 py-1 rounded-md bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-tertiary hover:bg-accent-subtle hover:text-accent-fg dark:hover:text-accent-fg dark:hover:bg-indigo-950/50 border border-transparent hover:border-line dark:hover:border-indigo-900 transition-colors"
        >
          {`{{${v.key}}}`}
        </button>
      ))}
    </div>
  );
}

function ChannelCard({ channel, config, onChange, integrations }) {
  const enabled = config[channel.toggleKey] !== false;
  const templateText = config.templates?.[channel.templateKey] || '';
  const effectiveTemplate = templateText.trim() || channel.defaultTemplate;
  const preview = renderCrmTemplate(effectiveTemplate, CRM_PREVIEW_CONTEXT);
  const connected = channel.channel === 'whatsapp' ? integrations?.whatsapp : integrations?.email;
  const isWhatsApp = channel.channel === 'whatsapp';

  const setToggle = (v) => onChange({ ...config, [channel.toggleKey]: v });
  const setTemplate = (text) =>
    onChange({ ...config, templates: { ...(config.templates || {}), [channel.templateKey]: text } });
  const setSubject = (text) =>
    onChange({ ...config, emailSubjects: { ...(config.emailSubjects || {}), [channel.templateKey]: text } });
  const resetTemplate = () => setTemplate('');

  return (
    <article
      className={`rounded-2xl border overflow-hidden transition-shadow ${
        enabled
          ? 'border-line dark:border-slate-700 bg-canvas dark:bg-slate-900'
          : 'border-line/60 dark:border-slate-800 bg-subtle dark:bg-slate-900/40 opacity-90'
      }`}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line dark:border-slate-800/80 bg-subtle/30 dark:bg-slate-950/20">
        <div className="flex items-center gap-3">
          <CrmIconBadge variant={isWhatsApp ? 'whatsapp' : 'sky'} size="md" ring>
            {isWhatsApp ? <WhatsAppIcon /> : <GmailIcon />}
          </CrmIconBadge>
          <div>
            <h4 className="text-dense font-semibold text-fg dark:text-slate-100 tracking-tight">{channel.label}</h4>
            <p className="text-meta text-fg-tertiary dark:text-fg-tertiary mt-0.5">
              {enabled
                ? connected
                  ? 'Delivered on stage trigger'
                  : 'Integration required'
                : 'Disabled'}
            </p>
          </div>
        </div>
        <CrmSwitch enabled={enabled} onChange={setToggle} />
      </header>

      {enabled && (
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-line dark:divide-slate-800">
          <div className="p-5 space-y-3">
            {channel.channel === 'email' && channel.emailSubject && (
              <div>
                <label className="text-xs font-semibold text-fg-tertiary dark:text-fg-tertiary">Subject line</label>
                <input
                  type="text"
                  className={`${inputCls} mt-2`}
                  value={config.emailSubjects?.[channel.templateKey] || ''}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={channel.emailSubject}
                />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-fg-tertiary dark:text-fg-tertiary">Message body</label>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="inline-flex items-center gap-1 text-meta font-medium text-fg-tertiary dark:text-fg-tertiary hover:text-fg dark:hover:text-slate-200"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to default
                </button>
              </div>
              <textarea
                rows={7}
                className={`${inputCls} font-mono text-xs leading-relaxed resize-none`}
                value={templateText}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder={channel.defaultTemplate}
              />
              <VariableChips onInsert={(token) => setTemplate((templateText || '') + token)} />
            </div>
          </div>
          <div className="p-5 bg-subtle dark:bg-slate-950/50">
            <p className="text-xs font-semibold text-fg-tertiary mb-3">Live preview</p>
            <div
              className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-inner ${
                channel.channel === 'whatsapp'
                  ? 'bg-[#ece5dd] dark:bg-[#1f2c33] text-fg dark:text-slate-200 border border-line/50 dark:border-emerald-900/30'
                  : 'bg-canvas dark:bg-slate-900 text-fg-secondary dark:text-fg-disabled border border-line dark:border-slate-700'
              }`}
            >
              {channel.channel === 'email' && (
                <p className="text-meta font-semibold text-fg-tertiary dark:text-fg-tertiary mb-2 pb-2 border-b border-line/80 dark:border-slate-700">
                  Subject:{' '}
                  {renderCrmTemplate(
                    config.emailSubjects?.[channel.templateKey] || channel.emailSubject || 'Email',
                    CRM_PREVIEW_CONTEXT
                  )}
                </p>
              )}
              {preview}
            </div>
            <p className="text-meta text-fg-tertiary mt-3">Preview uses sample customer data</p>
          </div>
        </div>
      )}
    </article>
  );
}

export default function CrmMessageAutomationSection({ config, onChange, integrations }) {
  const [activeGroup, setActiveGroup] = useState(CRM_MESSAGE_GROUPS[0]?.id);

  const group = CRM_MESSAGE_GROUPS.find((g) => g.id === activeGroup) || CRM_MESSAGE_GROUPS[0];
  const GroupIcon = CRM_MESSAGE_ICONS[group.icon] || CRM_MESSAGE_ICONS.welcome;

  return (
    <div className="rounded-lg border border-line/90 dark:border-slate-800 bg-canvas dark:bg-slate-900/90 overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.03]">
      <div className="px-6 py-5 border-b border-line dark:border-slate-800 bg-canvas">
        <h2 className="text-body font-semibold text-fg dark:text-slate-50 tracking-tight">Customer messaging</h2>
        <p className="text-dense text-fg-tertiary dark:text-fg-tertiary mt-1 leading-relaxed">
          Enterprise message templates with variable merge fields. Empty fields inherit platform defaults.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[420px]">
        <aside className="lg:w-[220px] shrink-0 border-b lg:border-b-0 lg:border-r border-line dark:border-slate-800 p-2.5 bg-subtle/40 dark:bg-slate-950/40">
          <ul className="space-y-0.5">
            {CRM_MESSAGE_GROUPS.map((g) => {
              const GIcon = CRM_MESSAGE_ICONS[g.icon] || CRM_MESSAGE_ICONS.welcome;
              const active = g.id === group.id;
              const enabledCount = g.channels.filter((c) => config[c.toggleKey] !== false).length;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => setActiveGroup(g.id)}
                    className={`relative w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all ${
                      active
                        ? 'bg-canvas dark:bg-slate-900 border border-line/90 dark:border-slate-700'
                        : 'hover:bg-white/80 dark:hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-slate-900 dark:bg-accent" />
                    )}
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        active ? 'bg-slate-900 text-white dark:bg-accent' : 'bg-muted text-fg-tertiary dark:text-fg-tertiary dark:bg-slate-800'
                      }`}
                    >
                      <GIcon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs font-semibold truncate ${active ? 'text-fg dark:text-slate-100' : 'text-fg-secondary dark:text-fg-tertiary'}`}>
                        {g.title}
                      </span>
                      <span className="block text-meta text-fg-tertiary truncate">{g.trigger}</span>
                    </span>
                    {enabledCount > 0 && (
                      <span className="text-meta font-semibold tabular-nums min-w-[18px] text-center px-1 py-0.5 rounded-md bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-tertiary">
                        {enabledCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="flex-1 p-5 lg:p-6 space-y-5 min-w-0">
          <div className="flex items-start gap-4">
            <CrmIconBadge variant="indigo" size="lg" ring>
              <GroupIcon className="w-5 h-5" />
            </CrmIconBadge>
            <div>
              <h3 className="text-body font-semibold text-fg dark:text-slate-100 tracking-tight">{group.title}</h3>
              <p className="text-dense text-fg-tertiary dark:text-fg-tertiary mt-1 max-w-lg leading-relaxed">{group.description}</p>
              <span className="inline-flex items-center mt-3 text-meta font-semibold text-fg-tertiary dark:text-fg-tertiary bg-muted dark:bg-slate-800 px-2.5 py-1 rounded-md border border-line/80 dark:border-slate-700">
                {group.trigger}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {group.channels.map((ch) => (
              <ChannelCard
                key={ch.toggleKey}
                channel={ch}
                config={config}
                onChange={onChange}
                integrations={integrations}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Count enabled message channel toggles */
export function countActiveMessageAutomations(config) {
  if (!config) return 0;
  return CRM_MESSAGE_GROUPS.reduce((sum, g) => {
    return sum + g.channels.filter((c) => config[c.toggleKey] !== false).length;
  }, 0);
}
