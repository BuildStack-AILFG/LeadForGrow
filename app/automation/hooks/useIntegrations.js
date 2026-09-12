'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { INTEGRATION_CATEGORIES, HEALTH_STYLES } from '../components/integrations/constants';

function formatRelativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function useIntegrations() {
  const confirm = useConfirm();
  const [integrations, setIntegrations] = useState([]);
  const [categories, setCategories] = useState(INTEGRATION_CATEGORIES);
  const [stats, setStats] = useState({ total: 0, connected: 0, healthy: 0, needsAttention: 0 });
  const [category, setCategory] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/integrations');
      const data = await res.json();

      if (data.success) {
        setIntegrations(data.data.integrations.map((i) => ({
          ...i,
          lastSynced: formatRelativeTime(i.lastSynced)
        })));
        setStats(data.data.stats);
        if (data.data.categories?.length) setCategories(data.data.categories);
      } else if (data.requiresUpgrade) {
        toast.error(data.error || 'Upgrade required');
      } else {
        toast.error(data.error || 'Failed to load integrations');
      }
    } catch {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const filtered = useMemo(() => {
    return integrations.filter((item) => {
      const matchCat = category === 'all' || item.category === category;
      const matchHealth =
        healthFilter === 'all' ||
        (healthFilter === 'connected' && item.connected) ||
        (healthFilter === 'disconnected' && !item.connected) ||
        item.health === healthFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      return matchCat && matchHealth && matchSearch;
    });
  }, [integrations, category, healthFilter, search]);

  const selected = useMemo(
    () => integrations.find((i) => i.id === selectedId) || null,
    [integrations, selectedId]
  );

  const updateIntegrationInState = useCallback((updated) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === updated.id
          ? { ...updated, lastSynced: formatRelativeTime(updated.sync?.lastSyncedAt || updated.lastSynced) }
          : i
      )
    );
  }, []);

  const fetchLogs = useCallback(async (integrationId) => {
    if (!integrationId) return;

    try {
      setLogsLoading(true);
      const res = await authFetch(`/api/integrations/${integrationId}/logs`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs.map((l) => ({
          ...l,
          time: formatRelativeTime(l.createdAt)
        })));
      }
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) fetchLogs(selectedId);
    else setLogs([]);
  }, [selectedId, fetchLogs]);

  const connect = useCallback(async (id, credentials) => {
    setConnecting(true);
    try {
      const item = integrations.find((i) => i.id === id);

      if (item?.authType === 'oauth') {
        const email = await confirm({ mode: 'prompt', title: 'Connect account', message: 'Enter connected account email', placeholder: 'you@example.com', required: true });
        if (!email) { setConnecting(false); return; }

        const res = await authFetch(`/api/integrations/${id}/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connectedEmail: email, accessToken: 'simulated_token', scopes: ['email'] })
        });
        const data = await res.json();
        if (data.success) {
          updateIntegrationInState(data.data);
          toast.success(`${item.name} connected`);
        } else toast.error(data.error);
        return;
      }

      const res = await authFetch(`/api/integrations/${id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: credentials || {}, testOnConnect: true })
      });
      const data = await res.json();

      if (data.success) {
        updateIntegrationInState(data.data.integration);
        if (data.data.testResult?.success) {
          toast.success(data.data.testResult.message || 'Connected successfully');
        } else {
          toast.error(data.data.testResult?.message || 'Saved but connection test failed');
        }
      } else {
        toast.error(data.error || 'Connection failed');
      }
    } catch {
      toast.error('Connection failed');
    } finally {
      setConnecting(false);
    }
  }, [integrations, updateIntegrationInState, confirm]);

  const disconnect = useCallback(async (id) => {
    setConnecting(true);
    try {
      const res = await authFetch(`/api/integrations/${id}/disconnect`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        updateIntegrationInState(data.data);
        toast.success('Integration disconnected');
      } else toast.error(data.error);
    } catch {
      toast.error('Disconnect failed');
    } finally {
      setConnecting(false);
    }
  }, [updateIntegrationInState]);

  const testConnection = useCallback(async (id) => {
    setConnecting(true);
    try {
      const res = await authFetch(`/api/integrations/${id || selectedId}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        updateIntegrationInState(data.data.integration);
        if (data.data.testResult.success) toast.success(data.data.testResult.message);
        else toast.error(data.data.testResult.message);
      } else toast.error(data.error);
    } catch {
      toast.error('Test failed');
    } finally {
      setConnecting(false);
    }
  }, [selectedId, updateIntegrationInState]);

  const syncNow = useCallback(async (id) => {
    setConnecting(true);
    try {
      const res = await authFetch(`/api/integrations/${id || selectedId}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        updateIntegrationInState(data.data.integration);
        const sync = data.data.syncResult;
        if (sync?.success) {
          toast.success(sync.message);
        } else if (sync?.tokenExpired) {
          toast.error(sync.message || 'Meta token expired — reconnect Meta Ads', { duration: 10000 });
        } else {
          toast.error(sync?.message || 'Sync failed');
        }
        fetchLogs(id || selectedId);
      } else toast.error(data.error);
    } catch {
      toast.error('Sync failed');
    } finally {
      setConnecting(false);
    }
  }, [selectedId, updateIntegrationInState, fetchLogs]);

  const updateConfig = useCallback(async (id, payload) => {
    setConnecting(true);
    try {
      const res = await authFetch(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        updateIntegrationInState(data.data);
        toast.success('Settings saved');
      } else toast.error(data.error);
    } catch {
      toast.error('Update failed');
    } finally {
      setConnecting(false);
    }
  }, [updateIntegrationInState]);

  return {
    integrations: filtered,
    allIntegrations: integrations,
    categories,
    category,
    setCategory,
    healthFilter,
    setHealthFilter,
    search,
    setSearch,
    selected,
    selectedId,
    setSelectedId,
    stats,
    connect,
    disconnect,
    testConnection,
    syncNow,
    updateConfig,
    connecting,
    loading,
    logs,
    logsLoading,
    refresh: fetchIntegrations,
    HEALTH_STYLES
  };
}
