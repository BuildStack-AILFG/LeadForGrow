'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CRM_MESSAGE_GROUPS, CRM_TEMPLATE_VARIABLES, CRM_PREVIEW_CONTEXT } from '@/lib/crm/crmSettings.constants';
import { renderCrmTemplate } from '@/lib/crm/templateVars';
import { CrmSwitch } from './CrmUiPrimitives';
import { CrmIconBadge, CRM_MESSAGE_ICONS, WhatsAppIcon, GmailIcon } from './CrmIcons';

const inputCls =
  'w-full px-3.5 py-2.5 text-sm border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10 focus:border-slate-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 transition-all';

function VariableChips({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {CRM_TEMPLATE_VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(`{{${v.key}}}`)}
          className="text-[11px] font-mono px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors"
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
          ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm'
          : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 opacity-90'
      }`}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20">
        <div className="flex items-center gap-3">
          <CrmIconBadge variant={isWhatsApp ? 'whatsapp' : 'sky'} size="md" ring>
            {isWhatsApp ? <WhatsAppIcon /> : <GmailIcon />}
          </CrmIconBadge>
          <div>
            <h4 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{channel.label}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
          <div className="p-5 space-y-3">
            {channel.channel === 'email' && channel.emailSubject && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Subject line</label>
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
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Message body</label>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
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
          <div className="p-5 bg-slate-50/80 dark:bg-slate-950/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Live preview</p>
            <div
              className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-inner ${
                channel.channel === 'whatsapp'
                  ? 'bg-[#ece5dd] dark:bg-[#1f2c33] text-slate-800 dark:text-slate-200 border border-emerald-200/50 dark:border-emerald-900/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {channel.channel === 'email' && (
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  Subject:{' '}
                  {renderCrmTemplate(
                    config.emailSubjects?.[channel.templateKey] || channel.emailSubject || 'Email',
                    CRM_PREVIEW_CONTEXT
                  )}
                </p>
              )}
              {preview}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Preview uses sample customer data</p>
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
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.03]">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/80 to-transparent dark:from-slate-900/50">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Customer messaging</h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Enterprise message templates with variable merge fields. Empty fields inherit platform defaults.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[420px]">
        <aside className="lg:w-[220px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-2.5 bg-slate-50/40 dark:bg-slate-950/40">
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
                        ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200/90 dark:border-slate-700'
                        : 'hover:bg-white/80 dark:hover:bg-slate-900/70 border border-transparent'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-slate-900 dark:bg-indigo-500" />
                    )}
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        active ? 'bg-slate-900 text-white dark:bg-indigo-600' : 'bg-slate-100 text-slate-500 dark:text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      <GIcon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs font-semibold truncate ${active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {g.title}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">{g.trigger}</span>
                    </span>
                    {enabledCount > 0 && (
                      <span className="text-[10px] font-semibold tabular-nums min-w-[18px] text-center px-1 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
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
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{group.title}</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">{group.description}</p>
              <span className="inline-flex items-center mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
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
