'use client';

import { memo } from 'react';
import { Settings, Plug, RefreshCw, ExternalLink } from 'lucide-react';
import { HEALTH_STYLES } from './constants';
import IntegrationLogo from './IntegrationLogo';

function IntegrationCard({ integration, onConnect, onSettings, onOpen }) {
  const health = HEALTH_STYLES[integration.health] || HEALTH_STYLES.disconnected;

  return (
    <div className="group bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4 hover:shadow-popover hover:border-line-strong dark:hover:border-slate-700 transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <IntegrationLogo integration={integration} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-fg dark:text-slate-50 truncate">{integration.name}</h3>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-meta font-medium ${health.bg} ${health.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
              {integration.connected ? health.label : 'Not connected'}
            </span>
          </div>
          <p className="text-meta text-fg-tertiary capitalize mt-0.5">{integration.category.replace('-', ' ')}</p>
        </div>
      </div>

      <p className="text-xs text-fg-tertiary dark:text-fg-tertiary leading-relaxed flex-1 mb-4 line-clamp-2">{integration.description}</p>

      {integration.connected && integration.lastSynced && (
        <p className="text-meta text-fg-tertiary mb-3 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Last synced {integration.lastSynced}
        </p>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-line dark:border-slate-800">
        {integration.connected ? (
          <>
            <button
              type="button"
              onClick={() => onOpen?.(integration.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-fg-secondary dark:text-fg-disabled bg-muted dark:bg-slate-800 rounded-md hover:bg-muted dark:hover:bg-slate-700 inline-flex items-center justify-center gap-1"
            >
              <Settings className="w-3 h-3" /> Manage
            </button>
            <button
              type="button"
              onClick={() => onSettings?.(integration.id)}
              className="p-1.5 rounded-lg border border-line dark:border-slate-700 text-fg-tertiary dark:text-fg-tertiary hover:text-accent-fg dark:hover:text-accent-fg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onConnect?.(integration.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-md inline-flex items-center justify-center gap-1"
          >
            <Plug className="w-3 h-3" /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(IntegrationCard);
