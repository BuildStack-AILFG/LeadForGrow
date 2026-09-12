'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Loader2, Copy } from 'lucide-react';
import { authJson } from '@/lib/apiClient';
import { useAccess } from '../../context/AccessContext';
import toast from 'react-hot-toast';
import PageLoader from '../../components/PageLoader';
import { useConfirm } from '@/app/components/ConfirmProvider';

export default function ApiKeysSettingsPage() {
  const confirm = useConfirm();
  const { access, showUpgrade } = useAccess();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!access?.tierFeatures?.api_access) {
        setLoading(false);
        return;
      }
      const res = await authJson('/api/access/api-keys');
      if (res.success) setKeys(res.data);
      else if (res.requiresUpgrade) showUpgrade('API Keys', 'scale');
      setLoading(false);
    })();
  }, [access]);

  const createKey = async () => {
    const name = await confirm({ mode: 'prompt', title: 'New API key', message: 'API key name', placeholder: 'e.g. Zapier integration', required: true });
    if (!name) return;
    const res = await authJson('/api/access/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (res.success) {
      navigator.clipboard.writeText(res.data.key);
      toast.success('Key copied to clipboard');
      setKeys((k) => [res.data, ...k]);
    } else toast.error(res.error);
  };

  if (loading) {
    return (
      <PageLoader label="Loading API keys…" height="40vh" />
    );
  }

  if (!access?.tierFeatures?.api_access) {
    return (
      <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Key className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">API access locked</h2>
        <p className="text-sm text-slate-500 mb-4">Upgrade to Scale to generate API keys and webhooks.</p>
        <button
          type="button"
          onClick={() => showUpgrade('API Keys', 'scale')}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg"
        >
          Upgrade to Scale
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">API keys</h2>
          <p className="text-sm text-slate-500">Manage scopes and track API usage</p>
        </div>
        <button
          type="button"
          onClick={createKey}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> Generate key
        </button>
      </div>
      <div className="space-y-2">
        {keys.map((k) => (
          <div
            key={k._id}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">{k.name}</p>
              <p className="text-xs text-slate-500 font-mono">{k.keyPrefix}••••••••</p>
            </div>
            <span className="text-[10px] text-slate-400">{k.usageCount || 0} requests</span>
          </div>
        ))}
        {!keys.length && <p className="text-sm text-slate-500 py-8 text-center">No API keys yet.</p>}
      </div>
    </div>
  );
}
