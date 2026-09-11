'use client';

import { useMemo } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SCHEDULE_TYPES = [
  { id: 'minutes', label: 'Every X minutes' },
  { id: 'hours', label: 'Every X hours' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'Every week' },
  { id: 'monthly', label: 'Every month' },
  { id: 'yearly', label: 'Every year' },
  { id: 'cron', label: 'Custom cron' },
];

export default function SequenceWorkflowSettings({ draftMeta, setDraftMeta, sequenceId, webhookSecret }) {
  const triggerConfig = draftMeta.triggerConfig || {};
  const abTest = draftMeta.abTest || { enabled: false, variants: [] };

  const setTrigger = (patch) => {
    setDraftMeta((m) => ({ ...m, triggerConfig: { ...m.triggerConfig, ...patch } }));
  };

  const setAb = (patch) => {
    setDraftMeta((m) => ({ ...m, abTest: { ...m.abTest, ...patch } }));
  };

  const webhookUrl = useMemo(() => {
    if (!sequenceId || !webhookSecret) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/automation/webhooks/${sequenceId}/${webhookSecret}`;
  }, [sequenceId, webhookSecret]);

  const copyWebhook = () => {
    if (!webhookUrl) return toast.error('Save workflow first to generate webhook URL');
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied');
  };

  const enableAbTest = () => {
    if (abTest.enabled) {
      setAb({ enabled: false });
      return;
    }
    setAb({
      enabled: true,
      autoSelectWinner: true,
      variants: [
        { id: 'a', name: 'Version A', weight: 50, nodes: [], edges: [] },
        { id: 'b', name: 'Version B', weight: 50, nodes: [], edges: [] },
      ],
    });
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl">
      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Trigger configuration</h4>
        <p className="text-xs text-slate-500 mb-4">Type: <span className="font-medium">{draftMeta.triggerType}</span></p>

        {draftMeta.triggerType === 'recurring' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Schedule type</label>
              <select
                value={triggerConfig.scheduleType || 'daily'}
                onChange={(e) => setTrigger({ scheduleType: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              >
                {SCHEDULE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            {(triggerConfig.scheduleType === 'minutes' || triggerConfig.scheduleType === 'hours') && (
              <div>
                <label className="text-xs font-medium text-slate-500">Interval</label>
                <input
                  type="number"
                  min={1}
                  value={triggerConfig.intervalMinutes || triggerConfig.intervalHours || 30}
                  onChange={(e) => setTrigger(
                    triggerConfig.scheduleType === 'minutes'
                      ? { intervalMinutes: +e.target.value }
                      : { intervalHours: +e.target.value }
                  )}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
            )}
            {['daily', 'weekly', 'monthly'].includes(triggerConfig.scheduleType || 'daily') && (
              <div>
                <label className="text-xs font-medium text-slate-500">Time (HH:MM)</label>
                <input
                  value={triggerConfig.time || '09:00'}
                  onChange={(e) => setTrigger({ time: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
            )}
            {triggerConfig.scheduleType === 'weekly' && (
              <div>
                <label className="text-xs font-medium text-slate-500">Weekday (0=Sun)</label>
                <input
                  type="number"
                  min={0}
                  max={6}
                  value={triggerConfig.weekday ?? 1}
                  onChange={(e) => setTrigger({ weekday: +e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
            )}
            {triggerConfig.scheduleType === 'cron' && (
              <div>
                <label className="text-xs font-medium text-slate-500">Cron expression</label>
                <input
                  value={triggerConfig.cron || '0 9 * * 1'}
                  onChange={(e) => setTrigger({ cron: e.target.value })}
                  placeholder="0 9 * * 1"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={triggerConfig.businessHoursOnly || false}
                onChange={(e) => setTrigger({ businessHoursOnly: e.target.checked })}
              />
              Only during business hours
            </label>
            <div>
              <label className="text-xs font-medium text-slate-500">Timezone</label>
              <input
                value={triggerConfig.timezone || 'Asia/Kolkata'}
                onChange={(e) => setTrigger({ timezone: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>
        )}

        {draftMeta.triggerType === 'no_reply' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500">No reply after (minutes)</label>
              <input
                type="number"
                min={1}
                value={triggerConfig.noReplyMinutes || (triggerConfig.noReplyHours || 0) * 60 || (triggerConfig.noReplyDays || 2) * 1440}
                onChange={(e) => setTrigger({ noReplyMinutes: +e.target.value, noReplyHours: null, noReplyDays: null })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Context</label>
              <select
                value={triggerConfig.context || 'any'}
                onChange={(e) => setTrigger({ context: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              >
                <option value="any">Any outbound message</option>
                <option value="quotation">After quotation</option>
                <option value="meeting">After meeting</option>
                <option value="payment">After payment request</option>
                <option value="ai">After AI conversation</option>
                <option value="inactive">Customer inactive</option>
              </select>
            </div>
          </div>
        )}

        {draftMeta.triggerType === 'webhook' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">POST JSON to this URL. Use header <code className="text-[10px]">x-api-key</code> or <code className="text-[10px]">x-webhook-signature</code>.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={webhookUrl || 'Save workflow to generate URL'}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
              <button type="button" onClick={copyWebhook} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {webhookSecret && (
              <p className="text-[10px] text-slate-400 break-all">Secret: {webhookSecret}</p>
            )}
          </div>
        )}
      </section>

      <section className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">A/B testing</h4>
          <button
            type="button"
            onClick={enableAbTest}
            className="text-xs font-medium text-teal-600 hover:underline"
          >
            {abTest.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
        {abTest.enabled && (
          <div className="space-y-3">
            {(abTest.variants || []).map((v, i) => (
              <div key={v.id} className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <label className="text-[10px] text-slate-500">Variant name</label>
                  <input
                    value={v.name}
                    onChange={(e) => {
                      const variants = [...abTest.variants];
                      variants[i] = { ...v, name: e.target.value };
                      setAb({ variants });
                    }}
                    className="mt-0.5 w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Traffic %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={v.weight}
                    onChange={(e) => {
                      const variants = [...abTest.variants];
                      variants[i] = { ...v, weight: +e.target.value };
                      setAb({ variants });
                    }}
                    className="mt-0.5 w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>
            ))}
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={abTest.autoSelectWinner || false}
                onChange={(e) => setAb({ autoSelectWinner: e.target.checked })}
              />
              Auto-select winner when statistically significant
            </label>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Variant B uses the same canvas until you duplicate nodes into variant config via API.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
