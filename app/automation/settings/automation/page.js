'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { SettingsTabs, SettingsCard, SettingsField, SettingsInput, SettingsToggle, SettingsSelect } from '../../components/settings/SettingsCard';

const TABS = [
  { id: 'defaults', label: 'Defaults' },
  { id: 'hours', label: 'Working Hours' },
  { id: 'limits', label: 'Execution Limits' },
  { id: 'retry', label: 'Retry Policy' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'approvals', label: 'Approvals' },
];

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function AutomationSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'defaults';
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  const setTab = (id) => router.replace(`/automation/settings/automation?tab=${id}`);

  useEffect(() => {
    authFetch('/api/automation/settings')
      .then((r) => r.json())
      .then((d) => { if (d.success) setConfig(d.data); })
      .catch(() => toast.error('Failed to load settings'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return <div className="p-8 text-center text-slate-500">Loading automation settings…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
      <SettingsTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'defaults' && (
        <SettingsCard title="Automation defaults" description="Default behaviors for new automations">
          <div className="space-y-2">
            <SettingsToggle enabled={config.defaults?.autoAssign} onChange={(v) => setConfig({ ...config, defaults: { ...config.defaults, autoAssign: v } })} label="Auto-assign new leads" />
            <SettingsToggle enabled={config.defaults?.createTaskOnNewLead} onChange={(v) => setConfig({ ...config, defaults: { ...config.defaults, createTaskOnNewLead: v } })} label="Create task on new lead" />
            <SettingsToggle enabled={config.defaults?.sendWelcomeWhatsApp} onChange={(v) => setConfig({ ...config, defaults: { ...config.defaults, sendWelcomeWhatsApp: v } })} label="Send welcome WhatsApp" />
          </div>
          <SettingsField label="Timezone">
            <SettingsInput value={config.timezone || 'Asia/Kolkata'} onChange={(e) => setConfig({ ...config, timezone: e.target.value })} />
          </SettingsField>
        </SettingsCard>
      )}

      {tab === 'hours' && (
        <SettingsCard title="Business hours" description="When automations and assignments are active">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <SettingsField label="Start time"><SettingsInput type="time" value={config.businessHours?.start || '09:00'} onChange={(e) => setConfig({ ...config, businessHours: { ...config.businessHours, start: e.target.value } })} /></SettingsField>
            <SettingsField label="End time"><SettingsInput type="time" value={config.businessHours?.end || '18:00'} onChange={(e) => setConfig({ ...config, businessHours: { ...config.businessHours, end: e.target.value } })} /></SettingsField>
          </div>
          <SettingsToggle enabled={config.workingDaysOnly !== false} onChange={(v) => setConfig({ ...config, workingDaysOnly: v })} label="Working days only for delays" />
          <div className="flex flex-wrap gap-2 mt-3">
            {DAYS.map((d) => (
              <button key={d} type="button" onClick={() => {
                const days = (config.businessHours?.days || []).includes(d) ? config.businessHours.days.filter((x) => x !== d) : [...(config.businessHours?.days || []), d];
                setConfig({ ...config, businessHours: { ...config.businessHours, days } });
              }} className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${(config.businessHours?.days || []).includes(d) ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>{d}</button>
            ))}
          </div>
        </SettingsCard>
      )}

      {tab === 'limits' && (
        <SettingsCard title="Execution limits" description="Rate limits and execution caps">
          <SettingsField label="Max executions per hour">
            <SettingsInput type="number" value={config.maxExecutionsPerHour || 500} onChange={(e) => setConfig({ ...config, maxExecutionsPerHour: +e.target.value })} />
          </SettingsField>
        </SettingsCard>
      )}

      {tab === 'retry' && (
        <SettingsCard title="Retry policy" description="How failed workflow steps are retried">
          <div className="grid grid-cols-2 gap-4">
            <SettingsField label="Max retries"><SettingsInput type="number" value={config.retryPolicy?.maxRetries || 3} onChange={(e) => setConfig({ ...config, retryPolicy: { ...config.retryPolicy, maxRetries: +e.target.value } })} /></SettingsField>
            <SettingsField label="Backoff (ms)"><SettingsInput type="number" value={config.retryPolicy?.backoffMs || 5000} onChange={(e) => setConfig({ ...config, retryPolicy: { ...config.retryPolicy, backoffMs: +e.target.value } })} /></SettingsField>
          </div>
        </SettingsCard>
      )}

      {tab === 'assignment' && (
        <SettingsCard title="Assignment logic" description="How leads are routed to team members">
          <SettingsField label="Strategy">
            <SettingsSelect value={config.assignment?.strategy || 'round-robin'} onChange={(e) => setConfig({ ...config, assignment: { ...config.assignment, strategy: e.target.value } })}>
              <option value="round-robin">Round Robin</option>
              <option value="solo">Solo Owner</option>
              <option value="least-busy">Load Balanced</option>
            </SettingsSelect>
          </SettingsField>
          <SettingsToggle enabled={config.assignment?.respectWorkingHours !== false} onChange={(v) => setConfig({ ...config, assignment: { ...config.assignment, respectWorkingHours: v } })} label="Respect working hours" />
        </SettingsCard>
      )}

      {tab === 'approvals' && (
        <SettingsCard title="Approval rules" description="Require manager approval before sending high-value messages">
          <SettingsToggle
            enabled={config.approvalRules?.requireApproval || config.approvalRules?.enabled}
            onChange={(v) => setConfig({ ...config, approvalRules: { ...config.approvalRules, requireApproval: v, enabled: v } })}
            label="Require approval for outbound messages"
          />
          <SettingsField label="Minimum deal amount (₹)">
            <SettingsInput
              type="number"
              value={config.approvalRules?.minDealAmount || config.approvalRules?.thresholdAmount || 0}
              onChange={(e) => setConfig({ ...config, approvalRules: { ...config.approvalRules, minDealAmount: +e.target.value } })}
            />
          </SettingsField>
          <div className="space-y-2 mt-3">
            {['whatsapp', 'email', 'instagram'].map((ch) => (
              <SettingsToggle
                key={ch}
                enabled={(config.approvalRules?.channels || ['whatsapp', 'email', 'instagram']).includes(ch)}
                onChange={(v) => {
                  const channels = config.approvalRules?.channels || ['whatsapp', 'email', 'instagram'];
                  const next = v ? [...new Set([...channels, ch])] : channels.filter((c) => c !== ch);
                  setConfig({ ...config, approvalRules: { ...config.approvalRules, channels: next } });
                }}
                label={`Require approval for ${ch}`}
              />
            ))}
          </div>
          <SettingsToggle
            enabled={config.approvalRules?.sequential !== false}
            onChange={(v) => setConfig({ ...config, approvalRules: { ...config.approvalRules, sequential: v, parallel: !v } })}
            label="Sequential approvals (manager → finance)"
          />
        </SettingsCard>
      )}
    </div>
  );
}
