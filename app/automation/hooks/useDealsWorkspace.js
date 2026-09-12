'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { DEFAULT_FILTERS, EMPTY_FORM } from '../components/deals/constants';
import { getDefaultStageKey, resolveStages, getStageLabel } from '@/lib/crm/pipelineUtils';
import { useDealStageModals } from './useDealStageModals';

export function useDealsWorkspace() {
  const confirm = useConfirm();
  const [deals, setDeals] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDealId, setEditingDealId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [drawerId, setDrawerId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setEditingDealId(null);
  }, []);

  const openCreateModal = useCallback(() => {
    const active = pipelines.find((p) => p._id === selectedPipeline);
    const defaultStage = getDefaultStageKey(active?.stages);
    setForm({ ...EMPTY_FORM, stage: defaultStage });
    setEditingDealId(null);
    setShowModal(true);
  }, [pipelines, selectedPipeline]);

  const openEditDeal = useCallback((deal) => {
    setEditingDealId(deal._id);
    setForm({
      title: deal.title || '',
      amount: deal.amount != null ? String(deal.amount) : '',
      currency: deal.currency || 'INR',
      stage: deal.stage || 'discovery',
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
        : '',
    });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await authFetch('/api/automation/deals/stats');
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

  const fetchDeals = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const [dealsRes, pipelinesRes] = await Promise.all([
        authFetch('/api/automation/deals?limit=200'),
        authFetch('/api/automation/pipelines'),
      ]);
      const [dealsData, pipelinesData] = await Promise.all([dealsRes.json(), pipelinesRes.json()]);
      if (dealsData.success) {
        setDeals(dealsData.data || []);
        setPipeline(dealsData.pipeline || []);
      }
      if (pipelinesData.success) {
        setPipelines(pipelinesData.data || []);
        if (pipelinesData.data?.length) {
          // Functional update keeps selectedPipeline out of the deps — otherwise
          // setting it here re-creates fetchDeals and triggers a second fetch on mount
          setSelectedPipeline((prev) =>
            prev || pipelinesData.data.find((p) => p.isDefault)?._id || pipelinesData.data[0]._id
          );
        }
      }
    } catch {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); fetchTeam(); }, [fetchStats, fetchTeam]);
  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const updateFilter = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const createDeal = async () => {
    if (!form.title) { toast.error('Deal title is required'); return; }
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/deals', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount) || 0,
          pipelineId: selectedPipeline,
          expectedCloseDate: form.expectedCloseDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deal created');
        closeModal();
        fetchDeals(true);
        fetchStats();
      } else toast.error(data.error || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const updateDeal = async () => {
    if (!editingDealId) return;
    if (!form.title) { toast.error('Deal title is required'); return; }
    setSaving(true);
    try {
      const res = await authFetch(`/api/automation/deals/${editingDealId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount) || 0,
          currency: form.currency,
          stage: form.stage,
          expectedCloseDate: form.expectedCloseDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deal updated');
        closeModal();
        fetchDeals(true);
        fetchStats();
        window.dispatchEvent(new CustomEvent('lfg-crm-refresh'));
      } else toast.error(data.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const saveDeal = async () => {
    if (editingDealId) await updateDeal();
    else await createDeal();
  };

  const deleteDeal = async (dealId, dealTitle) => {
    if (!(await confirm({ title: 'Delete deal', message: `Delete deal "${dealTitle || 'this deal'}"? This cannot be undone.`, confirmLabel: 'Delete', danger: true }))) return;
    const res = await authFetch(`/api/automation/deals/${dealId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setDeals((prev) => prev.filter((d) => d._id !== dealId));
      toast.success('Deal deleted');
      fetchStats();
      window.dispatchEvent(new CustomEvent('lfg-crm-refresh'));
    } else toast.error(data.error || 'Failed to delete');
  };

  const activePipeline = pipelines.find((p) => p._id === selectedPipeline);
  const stages = resolveStages(activePipeline?.stages);

  const stageModals = useDealStageModals({
    getStages: () => stages,
    onUpdated: (updated) => {
      setDeals((prev) =>
        prev.map((d) => (d._id === updated._id ? { ...d, ...updated } : d))
      );
      fetchStats();
    },
  });

  const updateDealStage = useCallback(
    async (dealId, stage) => {
      const deal = deals.find((d) => d._id === dealId);
      return stageModals.requestDealStageChange(dealId, stage, { title: deal?.title });
    },
    [deals, stageModals]
  );

  const exportDeals = useCallback(() => {
    if (!deals.length) {
      toast.error('No deals to export');
      return;
    }
    const exportStages = resolveStages(activePipeline?.stages);
    const headers = ['Title', 'Stage', 'Amount', 'Currency', 'Probability', 'Close Date', 'Owner'];
    const rows = deals.map((d) => {
      const owner = d.assignedTo
        ? [d.assignedTo.firstName, d.assignedTo.lastName].filter(Boolean).join(' ') || d.assignedTo.email
        : '';
      return [
        d.title,
        getStageLabel(exportStages, d.stage),
        d.amount,
        d.currency,
        d.probability,
        d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().split('T')[0] : '',
        owner,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Deals exported');
  }, [deals, activePipeline]);

  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.key] = deals.filter((d) => d.stage === stage.key);
    return acc;
  }, {});

  return {
    deals,
    pipeline,
    pipelines,
    stats,
    statsLoading,
    loading,
    refreshing,
    viewMode,
    setViewMode,
    selectedPipeline,
    setSelectedPipeline,
    activePipeline,
    stages,
    dealsByStage,
    showModal,
    setShowModal,
    openCreateModal,
    openEditDeal,
    closeModal,
    editingDealId,
    form,
    setForm,
    saving,
    fetchDeals,
    fetchStats,
    createDeal,
    updateDeal,
    saveDeal,
    deleteDeal,
    updateDealStage,
    demoPrompt: stageModals.demoPrompt,
    demoSaving: stageModals.demoSaving,
    confirmDemoScheduled: stageModals.confirmDemoScheduled,
    cancelDemoPrompt: stageModals.cancelDemoPrompt,
    quotationPrompt: stageModals.quotationPrompt,
    quotationSaving: stageModals.quotationSaving,
    confirmQuotationSent: stageModals.confirmQuotationSent,
    cancelQuotationPrompt: stageModals.cancelQuotationPrompt,
    lostPrompt: stageModals.lostPrompt,
    lostSaving: stageModals.lostSaving,
    confirmLostReason: stageModals.confirmLostReason,
    cancelLostPrompt: stageModals.cancelLostPrompt,
    searchInput,
    setSearchInput,
    filters,
    updateFilter,
    drawerId,
    setDrawerId,
    teamMembers,
    showFilters,
    setShowFilters,
    showSort,
    setShowSort,
    exportDeals,
  };
}
