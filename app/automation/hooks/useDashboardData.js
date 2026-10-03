'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/crm/formatCurrency';

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [dash, setDash] = useState(null);

  const fetchAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [meRes, dashRes] = await Promise.all([
        authFetch('/api/auth/me'),
        authFetch('/api/automation/dashboard'),
      ]);

      const me = await meRes.json();
      if (me.success) setBusinessName(me.data.companyName || 'Workspace');

      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        if (dashJson.success) {
          setDash(dashJson.data);
          setError(null);
        } else {
          setError(dashJson.error || 'Failed to load dashboard');
        }
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err) {
      console.error('[Dashboard]', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => { if (document.visibilityState === 'visible') fetchAll(true); }, 60000);
    const onCrmRefresh = () => fetchAll(true);
    window.addEventListener('lfg-crm-refresh', onCrmRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('lfg-crm-refresh', onCrmRefresh);
    };
  }, [fetchAll]);

  return {
    loading,
    refreshing,
    error,
    refresh: () => fetchAll(true),
    businessName,
    dash,
    currency: dash?.currency || 'INR',
    formatCurrency,
  };
}

export { formatCurrency };
