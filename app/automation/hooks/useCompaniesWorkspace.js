'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { DEFAULT_FILTERS, EMPTY_FORM } from '../components/companies/constants';
import { buildCompaniesQuery } from '../components/companies/utils';

export function useCompaniesWorkspace() {
  const confirm = useConfirm();
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 25 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerId, setDrawerId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [groupBy, setGroupBy] = useState('none');

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await authFetch('/api/automation/companies/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      /* ignore */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/team');
      const data = await res.json();
      if (data.success) setTeamMembers(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchCompanies = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const qs = buildCompaniesQuery(filters);
      const res = await authFetch(`/api/automation/companies?${qs}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.data || []);
        setPagination(data.pagination || { total: 0, page: 1, pages: 1, limit: filters.limit });
      }
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => { fetchStats(); fetchTeam(); }, [fetchStats, fetchTeam]);
  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const updateFilter = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? (patch.limit ? 1 : patch.page ?? prev.page) }));
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === companies.length ? [] : companies.map((c) => c._id)));
  }, [companies]);

  const createCompany = async () => {
    if (!form.name?.trim()) {
      toast.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/companies', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        toast.success('Company created');
        setShowModal(false);
        setForm({ ...EMPTY_FORM });
        fetchCompanies(true);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } finally {
      setSaving(false);
    }
  };

  const bulkAction = async (action, data = {}) => {
    if (!selectedIds.length) return;
    const res = await authFetch('/api/automation/companies/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, action, data }),
    });
    const result = await res.json();
    if (result.success) {
      toast.success('Bulk action completed');
      setSelectedIds([]);
      fetchCompanies(true);
      fetchStats();
    } else {
      toast.error(result.error || 'Bulk action failed');
    }
  };

  const handleMenuAction = async (action, id) => {
    if (action === 'delete') {
      if (!(await confirm({ title: 'Delete company', message: 'Delete this company?', confirmLabel: 'Delete', danger: true }))) return;
      const res = await authFetch('/api/automation/companies/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: [id], action: 'delete' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Company deleted');
        fetchCompanies(true);
        fetchStats();
      } else toast.error(result.error);
    } else if (action === 'archive') {
      const res = await authFetch('/api/automation/companies/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: [id], action: 'archive' }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Company archived');
        fetchCompanies(true);
        fetchStats();
      } else toast.error(result.error);
    }
  };

  const bulkAssign = async () => {
    const ownerId = await confirm({ mode: 'prompt', title: 'Assign owner', message: 'Enter owner user ID', required: true });
    if (ownerId) bulkAction('assignOwner', { ownerId });
  };

  const bulkAddTags = async () => {
    const tags = await confirm({ mode: 'prompt', title: 'Add tags', message: 'Enter tags separated by comma', placeholder: 'vip, priority', required: true });
    if (tags) bulkAction('addTags', { tags: tags.split(',').map((t) => t.trim()).filter(Boolean) });
  };

  const exportCompanies = () => {
    toast.success('Export started — downloading CSV');
    const headers = ['Name', 'Industry', 'Status', 'Website', 'Email', 'Open Deals', 'Pipeline'];
    const rows = companies.map((c) => [
      c.name,
      c.industry || '',
      c.status || '',
      c.website || '',
      c.email || '',
      c.stats?.openDealCount || 0,
      c.stats?.pipelineValue || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    companies,
    stats,
    loading,
    statsLoading,
    refreshing,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    pagination,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    drawerId,
    setDrawerId,
    showModal,
    setShowModal,
    form,
    setForm,
    saving,
    createCompany,
    fetchCompanies,
    teamMembers,
    showFilters,
    setShowFilters,
    showSort,
    setShowSort,
    showGroup,
    setShowGroup,
    groupBy,
    setGroupBy,
    bulkAction,
    bulkAssign,
    bulkAddTags,
    bulkDelete: () => bulkAction('delete'),
    bulkArchive: () => bulkAction('archive'),
    exportCompanies,
    handleMenuAction,
  };
}
