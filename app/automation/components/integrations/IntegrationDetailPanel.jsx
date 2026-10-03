'use client';

import { useState } from 'react';
import { X, RefreshCw, Plug, Unplug, Copy, CheckCircle2, AlertCircle, Clock, RotateCcw, Settings2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HEALTH_STYLES, STATUS_LABELS } from './constants';
import IntegrationConfigForm from './IntegrationConfigForm';
import IntegrationLogo from './IntegrationLogo';

export default function IntegrationDetailPanel({
  integration,
  onClose,
  onConnect,
  onDisconnect,
  onTest,
  onSync,
  onUpdateConfig,
  connecting,
  logs = [],
  logsLoading
}) {
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!integration) return null;

  const health = HEALTH_STYLES[integration.health] || HEALTH_STYLES.disconnected;
  const showConfigForm = !integration.connected || editMode;

  const copyWebhook = async () => {
    if (!integration.webhookUrl) return;
    await navigator.clipboard.writeText(integration.webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = (credentials) => {
    if (integration.connected && editMode) {
      onUpdateConfig?.(integration.id, { credentials });
      setEditMode(false);
    } else {
      onConnect?.(integration.id, credentials);
    }
  };

  const logIcon = (status) => {
    if (status === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg mt-0.5" />;
    if (status === 'warning') return <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5" />;
    if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-danger mt-0.5" />;
    return <Clock className="w-3.5 h-3.5 text-fg-tertiary mt-0.5" />;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-canvas dark:bg-slate-900 shadow-modal z-50 flex flex-col border-l border-line dark:border-slate-800">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-line dark:border-slate-800">
          <div className="flex items-center gap-3">
            <IntegrationLogo integration={integration} size={48} />
            <div>
              <h2 className="text-base font-semibold text-fg dark:text-slate-50">{integration.name}</h2>
              <span className={`inline-flex items-center gap-1 text-meta font-medium mt-0.5 ${health.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                {integration.connected ? (STATUS_LABELS[integration.status] || health.label) : 'Not connected'}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-slate-800 text-fg-tertiary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <p className="text-sm text-fg-secondary dark:text-fg-tertiary">{integration.description}</p>

          {integration.connected && integration.account && (
            <div className="p-4 rounded-lg bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700">
              <p className="text-meta font-semibold text-fg-tertiary mb-1">Connected account</p>
              <p className="text-sm font-medium text-fg dark:text-slate-100">{integration.account}</p>
              {integration.lastSynced && (
                <p className="text-xs text-fg-tertiary mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Last synced {integration.lastSynced}
                </p>
              )}
              {integration.lastTestResult && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${integration.lastTestResult.success ? 'text-accent-fg' : 'text-danger'}`}>
                  <ShieldCheck className="w-3 h-3" /> {integration.lastTestResult.message}
                </p>
              )}
            </div>
          )}

          {/* Credential form */}
          {showConfigForm && integration.authType !== 'oauth' && (
            <div>
              <h3 className="text-xs font-semibold text-fg dark:text-slate-50 mb-3">
                {integration.connected ? 'Update credentials' : 'Connection credentials'}
              </h3>
              <IntegrationConfigForm
                integration={integration}
                onSubmit={handleConnect}
                submitting={connecting}
                submitLabel={integration.connected ? 'Save changes' : 'Save & connect'}
              />
            </div>
          )}

          {integration.authType === 'oauth' && !integration.connected && (
            <button
              type="button"
              onClick={() => onConnect?.(integration.id)}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg disabled:opacity-50"
            >
              <Plug className="w-4 h-4" /> Connect with {integration.oauthProvider || 'OAuth'}
            </button>
          )}

          {integration.connected && (
            <>
              {/* Sync settings */}
              <div className="p-4 rounded-lg border border-line dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-semibold text-fg dark:text-slate-50 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" /> Sync settings
                </h3>
                <label className="flex items-center justify-between text-xs">
                  <span className="text-fg-secondary dark:text-fg-tertiary">Enable sync</span>
                  <input
                    type="checkbox"
                    checked={integration.config?.syncEnabled !== false}
                    onChange={(e) => onUpdateConfig?.(integration.id, { config: { syncEnabled: e.target.checked } })}
                    className="rounded border-line-strong text-accent-fg"
                  />
                </label>
                <label className="flex items-center justify-between text-xs">
                  <span className="text-fg-secondary dark:text-fg-tertiary">Auto sync</span>
                  <input
                    type="checkbox"
                    checked={integration.config?.autoSync === true}
                    onChange={(e) => onUpdateConfig?.(integration.id, { config: { autoSync: e.target.checked } })}
                    className="rounded border-line-strong text-accent-fg"
                  />
                </label>
                <label className="flex items-center justify-between text-xs">
                  <span className="text-fg-secondary dark:text-fg-tertiary">Webhooks enabled</span>
                  <input
                    type="checkbox"
                    checked={integration.config?.webhookEnabled !== false}
                    onChange={(e) => onUpdateConfig?.(integration.id, { config: { webhookEnabled: e.target.checked } })}
                    className="rounded border-line-strong text-accent-fg"
                  />
                </label>
              </div>

              {integration.webhookUrl && (
                <div>
                  <h3 className="text-xs font-semibold text-fg dark:text-slate-50 mb-2">Webhook endpoint</h3>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700">
                    <code className="flex-1 text-meta font-mono text-fg-secondary dark:text-fg-tertiary break-all">
                      {integration.webhookUrl}
                    </code>
                    <button type="button" onClick={copyWebhook} className="p-1.5 text-fg-tertiary hover:text-accent-fg">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-accent-fg" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-meta text-fg-tertiary mt-1">
                    {integration.id === 'meta-ads'
                      ? 'In Meta Developers → your App → Webhooks → Page: paste this URL, use your Webhook Verify Token, and subscribe to leadgen. Reconnect here to auto-subscribe the page.'
                      : "Paste this URL in your provider's webhook settings."}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-fg dark:text-slate-50 mb-2">Features</h3>
                <ul className="space-y-1">
                  {(integration.features || []).map((f) => (
                    <li key={f} className="text-xs text-fg-secondary dark:text-fg-tertiary flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-accent-fg" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-fg dark:text-slate-50 mb-2">Activity log</h3>
                {logsLoading ? (
                  <p className="text-xs text-fg-tertiary">Loading logs…</p>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-fg-tertiary">No activity yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-xs">
                        {logIcon(log.status)}
                        <div>
                          <p className="text-fg-secondary dark:text-fg-disabled">
                            <span className="font-medium capitalize">{log.action}</span>: {log.message}
                          </p>
                          <p className="text-fg-tertiary">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-line dark:border-slate-800 space-y-2">
          {integration.connected ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTest?.(integration.id)}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-fg-secondary dark:text-fg-disabled bg-muted dark:bg-slate-800 rounded-lg hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} /> Test
                </button>
                <button
                  type="button"
                  onClick={() => onSync?.(integration.id)}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-fg-secondary dark:text-fg-disabled bg-muted dark:bg-slate-800 rounded-lg hover:bg-muted disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} /> Sync now
                </button>
              </div>
              {integration.authType !== 'oauth' && (
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-accent-fg hover:bg-accent-subtle dark:hover:bg-teal-950/20 rounded-lg"
                >
                  <Settings2 className="w-3.5 h-3.5" /> {editMode ? 'Cancel edit' : 'Edit credentials'}
                </button>
              )}
              <button
                type="button"
                onClick={() => onDisconnect(integration.id)}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger-subtle dark:hover:bg-red-950/20 rounded-lg"
              >
                <Unplug className="w-4 h-4" /> Disconnect
              </button>
            </>
          ) : integration.authType !== 'oauth' ? null : null}
        </div>
      </aside>
    </>
  );
}
