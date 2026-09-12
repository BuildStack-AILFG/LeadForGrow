'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { DEFAULT_FILTERS, EMPTY_FORM } from '../components/contacts/constants';
import { buildContactsQuery } from '../components/contacts/utils';

export function useContactsWorkspace() {
  const confirm = useConfirm();
  const [contacts, setContacts] = useState([]);
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

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await authFetch('/api/automation/contacts/stats');
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

  const fetchContacts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const qs = buildContactsQuery(filters);
      const res = await authFetch(`/api/automation/contacts?${qs}`);
      const data = await res.json();

      if (data.success) {
        setContacts(data.data || []);
        setPagination(data.pagination || { total: 0, page: 1, pages: 1, limit: filters.limit });
      }
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => { fetchStats(); fetchTeam(); }, [fetchStats, fetchTeam]);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const updateFilter = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? (patch.limit ? 1 : prev.page) }));
    setSelectedIds([]);
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => (prev.length === contacts.length ? [] : contacts.map((c) => c._id)));
  }, [contacts]);

  const createContact = async () => {
    if (!form.firstName?.trim()) {
      toast.error('First name is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        type: form.type,
        jobTitle: form.jobTitle,
        companyId: form.companyId || undefined,
        ownerId: form.ownerId || undefined,
        phones: form.phone ? [{ number: form.phone, primary: true }] : [],
        emails: form.email ? [{ address: form.email, primary: true }] : [],
      };
      const res = await authFetch('/api/automation/contacts', { method: 'POST', body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        toast.success('Contact created');
        setShowModal(false);
        setForm({ ...EMPTY_FORM });
        fetchContacts(true);
        fetchStats();
        if (data.duplicates?.length) toast(`Found ${data.duplicates.length} possible duplicate(s)`, { icon: '⚠️' });
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } finally {
      setSaving(false);
    }
  };

  const bulkAction = async (action, data = {}) => {
    if (!selectedIds.length) return;
    const res = await authFetch('/api/automation/contacts/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, action, data }),
    });
    const result = await res.json();
    if (result.success) {
      toast.success('Bulk action completed');
      setSelectedIds([]);
      fetchContacts(true);
      fetchStats();
    } else {
      toast.error(result.error || 'Bulk action failed');
    }
  };

  const handleMenuAction = async (action, id) => {
    if (action === 'delete') {
      if (!(await confirm({ title: 'Delete contact', message: 'Delete this contact?', confirmLabel: 'Delete', danger: true }))) return;
      const res = await authFetch('/api/automation/contacts/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: [id], action: 'delete' }),
      });
      const result = await res.json();
      if (result.success) { toast.success('Contact deleted'); fetchContacts(true); fetchStats(); }
      else toast.error(result.error);
    } else if (action === 'archive') {
      const res = await authFetch('/api/automation/contacts/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: [id], action: 'archive' }),
      });
      const result = await res.json();
      if (result.success) { toast.success('Contact archived'); fetchContacts(true); fetchStats(); }
      else toast.error(result.error);
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

  const exportContacts = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'Type', 'Open Deals'];
    const rows = contacts.map((c) => [
      c.fullName || `${c.firstName} ${c.lastName}`,
      c.emails?.[0]?.address || '',
      c.phones?.[0]?.number || '',
      c.companyId?.name || '',
      c.jobTitle || '',
      c.type || '',
      c.stats?.openDeals || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Contacts exported');
  };

  return {
    contacts,
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
    createContact,
    fetchContacts,
    teamMembers,
    showFilters,
    setShowFilters,
    showSort,
    setShowSort,
    bulkAssign,
    bulkAddTags,
    bulkDelete: () => bulkAction('delete'),
    bulkArchive: () => bulkAction('archive'),
    exportContacts,
    handleMenuAction,
  };
}
