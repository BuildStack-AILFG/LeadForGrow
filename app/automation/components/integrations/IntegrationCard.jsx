'use client';

import { memo } from 'react';
import { Settings, Plug, RefreshCw, ExternalLink } from 'lucide-react';
import { HEALTH_STYLES } from './constants';
import IntegrationLogo from './IntegrationLogo';

function IntegrationCard({ integration, onConnect, onSettings, onOpen }) {
  const health = HEALTH_STYLES[integration.health] || HEALTH_STYLES.disconnected;

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <IntegrationLogo integration={integration} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{integration.name}</h3>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${health.bg} ${health.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
              {integration.connected ? health.label : 'Not connected'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 capitalize mt-0.5">{integration.category.replace('-', ' ')}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1 mb-4 line-clamp-2">{integration.description}</p>

      {integration.connected && integration.lastSynced && (
        <p className="text-[10px] text-slate-400 mb-3 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Last synced {integration.lastSynced}
        </p>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {integration.connected ? (
          <>
            <button
              type="button"
              onClick={() => onOpen?.(integration.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center gap-1"
            >
              <Settings className="w-3 h-3" /> Manage
            </button>
            <button
              type="button"
              onClick={() => onSettings?.(integration.id)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onConnect?.(integration.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-1"
          >
            <Plug className="w-3 h-3" /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(IntegrationCard);
