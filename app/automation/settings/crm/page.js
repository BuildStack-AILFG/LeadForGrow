'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { SettingsField, SettingsInput, SettingsSelect } from '../../components/settings/SettingsCard';
import CrmChannelStatus from '../../components/settings/crm/CrmChannelStatus';
import CrmMessageAutomationSection, { countActiveMessageAutomations } from '../../components/settings/crm/CrmMessageAutomationSection';
import CrmSettingsNav, { CrmSettingsSaveBar } from '../../components/settings/crm/CrmSettingsNav';
import { CrmPanel, CrmSettingRow, CrmSwitch } from '../../components/settings/crm/CrmUiPrimitives';
import { PAYMENT_ON_CONFIRM_MODES } from '@/lib/crm/crmSettings';
import { resolveStages } from '@/lib/crm/pipelineUtils';
import { DEFAULT_LEAD_STAGES } from '@/lib/crm/leadPipelineStages';

function PipelineStagesOverview() {
  const [dealStages, setDealStages] = useState([]);

  useEffect(() => {
    authFetch('/api/automation/pipelines')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const def = d.data?.find((p) => p.isDefault) || d.data?.[0];
          setDealStages(resolveStages(def?.stages));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <CrmPanel title="Lead qualification" description="Stages before converting to a deal">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {DEFAULT_LEAD_STAGES.map((s, i) => (
            <div key={s.key} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <span className="text-xs font-mono text-slate-400 w-5 tabular-nums">{i + 1}</span>
              <span className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: s.color }} />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{s.label}</span>
              {s.isLost && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                  Lost
                </span>
              )}
            </div>
          ))}
        </div>
      </CrmPanel>

      <CrmPanel
        title="Deal pipeline"
        description="Sales stages after lead conversion"
        action={
          <a
            href="/automation/pipelines"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Edit pipeline <ExternalLink className="w-3 h-3" />
          </a>
        }
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {dealStages.map((s, i) => (
            <div key={s.key} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <span className="text-xs font-mono text-slate-400 w-5 tabular-nums">{i + 1}</span>
              <span className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: s.color }} />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{s.label}</span>
              <span className="text-xs font-medium text-slate-400 tabular-nums">{s.probability}%</span>
            </div>
          ))}
          {dealStages.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Loading deal stages…</p>
          )}
        </div>
      </CrmPanel>
    </div>
  );
}

export default function CRMSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab') || 'automation';
  const tab = rawTab === 'tasks' || rawTab === 'templates' ? 'automation' : rawTab;
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const setTab = (id) => router.replace(`/automation/settings/crm?tab=${id}`);

  useEffect(() => {
    authFetch('/api/automation/settings/crm')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setConfig(d.data);
          setDirty(false);
        }
      })
      .catch(() => toast.error('Failed to load CRM settings'));
  }, []);

  const activeAutomations = useMemo(() => countActiveMessageAutomations(config), [config]);

  const patchConfig = (next) => {
    setConfig(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { lostReasons, paymentModes, integrations, ...payload } = config;
      const res = await authFetch('/api/automation/settings/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setConfig((prev) => ({ ...prev, ...data.data }));
      setDirty(false);
      toast.success('CRM settings saved');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading CRM settings…</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-24">
        <CrmChannelStatus integrations={config.integrations} activeAutomations={activeAutomations} />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-[240px] shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 px-3 mb-3 hidden lg:block">
              Configuration
            </p>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-2">
              <CrmSettingsNav active={tab} onChange={setTab} />
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-5">
            {tab === 'automation' && (
              <>
                <CrmPanel title="Task automation" description="Internal tasks — never changes lead or deal stages">
                  <CrmSettingRow
                    label="Auto-create follow-up task"
                    description="Creates the first follow-up task when a new lead is captured and assigned."
                  >
                    <CrmSwitch
                      enabled={config.autoCreateFollowUpTask !== false}
                      onChange={(v) => patchConfig({ ...config, autoCreateFollowUpTask: v })}
                    />
                  </CrmSettingRow>
                  {config.autoCreateFollowUpTask !== false && (
                    <div className="pb-4 pt-1">
                      <SettingsField label="Due in (hours)" className="max-w-[200px]">
                        <SettingsInput
                          type="number"
                          min={1}
                          value={config.defaultFollowUpHours ?? 24}
                          onChange={(e) => patchConfig({ ...config, defaultFollowUpHours: +e.target.value })}
                        />
                      </SettingsField>
                    </div>
                  )}
                </CrmPanel>

                <CrmMessageAutomationSection
                  config={config}
                  onChange={patchConfig}
                  integrations={config.integrations}
                />
              </>
            )}

            {tab === 'pipeline' && (
              <CrmPanel title="Pipeline control" description="Your team controls every stage change">
                <div className="mb-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  Stages are never moved automatically by workflows. Only your team — or payment confirmation when enabled — can advance a deal.
                </div>
                <SettingsField label="When payment gateway confirms payment" className="mb-4">
                  <SettingsSelect
                    value={config.paymentOnConfirm || PAYMENT_ON_CONFIRM_MODES.NOTIFY_SALES}
                    onChange={(e) => patchConfig({ ...config, paymentOnConfirm: e.target.value })}
                  >
                    <option value={PAYMENT_ON_CONFIRM_MODES.NOTIFY_SALES}>Notify salesperson to confirm Won</option>
                    <option value={PAYMENT_ON_CONFIRM_MODES.AUTO_MOVE_WON}>Automatically move deal to Won</option>
                  </SettingsSelect>
                </SettingsField>
                <CrmSettingRow label="Require lost reason" description="Sales must pick a reason when marking a lead or deal as lost.">
                  <CrmSwitch
                    enabled={config.requireLostReason !== false}
                    onChange={(v) => patchConfig({ ...config, requireLostReason: v })}
                  />
                </CrmSettingRow>
                <CrmSettingRow label="AI qualification on new leads" description="Automatically score and summarize new leads when they enter the pipeline.">
                  <CrmSwitch
                    enabled={config.runAiQualificationOnNewLead !== false}
                    onChange={(v) => patchConfig({ ...config, runAiQualificationOnNewLead: v })}
                  />
                </CrmSettingRow>
              </CrmPanel>
            )}

            {tab === 'stages' && <PipelineStagesOverview />}

            {tab === 'notifications' && (
              <CrmPanel title="Team notifications" description="In-app alerts for your sales team">
                <CrmSettingRow
                  label="Notify on new lead"
                  description="Alerts the business owner when a new lead enters the pipeline."
                >
                  <CrmSwitch
                    enabled={config.notifyTeamOnNewLead !== false}
                    onChange={(v) => patchConfig({ ...config, notifyTeamOnNewLead: v })}
                  />
                </CrmSettingRow>
              </CrmPanel>
            )}

            {tab === 'reminders' && (
              <CrmPanel title="Reminders" description="Internal reminders for salespeople">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  Customer-facing payment messages are configured under Automation → Payment reminder.
                </p>
                <CrmSettingRow label="24 hours before meeting" description="Creates an internal prep reminder for the assignee.">
                  <CrmSwitch
                    enabled={config.meetingReminders?.hours24 !== false}
                    onChange={(v) => patchConfig({ ...config, meetingReminders: { ...config.meetingReminders, hours24: v } })}
                  />
                </CrmSettingRow>
                <CrmSettingRow label="1 hour before meeting">
                  <CrmSwitch
                    enabled={config.meetingReminders?.hours1 !== false}
                    onChange={(v) => patchConfig({ ...config, meetingReminders: { ...config.meetingReminders, hours1: v } })}
                  />
                </CrmSettingRow>
                <CrmSettingRow label="10 minutes before meeting">
                  <CrmSwitch
                    enabled={config.meetingReminders?.minutes10 !== false}
                    onChange={(v) => patchConfig({ ...config, meetingReminders: { ...config.meetingReminders, minutes10: v } })}
                  />
                </CrmSettingRow>
                <div className="py-4">
                  <SettingsField label="Payment reminder interval (days)" className="max-w-[200px]">
                    <SettingsInput
                      type="number"
                      min={1}
                      value={config.paymentReminderDays ?? 3}
                      onChange={(e) => patchConfig({ ...config, paymentReminderDays: +e.target.value })}
                    />
                  </SettingsField>
                </div>
              </CrmPanel>
            )}
          </main>
        </div>
      </div>

      <CrmSettingsSaveBar dirty={dirty} saving={saving} onSave={save} />
    </>
  );
}
