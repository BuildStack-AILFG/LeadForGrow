'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';
import { computeLeadIntelligence, aggregateSourceStats } from '@/lib/leadIntelligence';
import { buildLeadsQuery, getStatusRowColor, validateStageTransition } from '../components/leads/utils';
import { SAVED_VIEWS_KEY } from '../components/leads/constants';
import { useRealtime, REALTIME_EVENTS } from './useRealtime';
import { useConfirm } from '@/app/components/ConfirmProvider';

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  source: '',
  assignedTo: '',
  view: 'all',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: 50,
  showConverted: false,
};

export function useLeadsWorkspace() {
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    search: searchParams.get('search') || '',
    status: searchParams.get('filter') || searchParams.get('status') || 'all',
    source: searchParams.get('source') || '',
    view: (() => {
      const v = searchParams.get('view');
      return v && v !== 'kanban' ? v : 'all';
    })()
  });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerLeadId, setDrawerLeadId] = useState(null);
  const [convertLeadId, setConvertLeadId] = useState(null);
  const [convertLeadMeta, setConvertLeadMeta] = useState(null);
  const [converting, setConverting] = useState(false);
  const [qualifiedPrompt, setQualifiedPrompt] = useState(null);
  const [qualifying, setQualifying] = useState(false);
  const [lostPrompt, setLostPrompt] = useState(null);
  const [lostSaving, setLostSaving] = useState(false);
  const [demoPrompt, setDemoPrompt] = useState(null);
  const [demoSaving, setDemoSaving] = useState(false);
  const [quotationPrompt, setQuotationPrompt] = useState(null);
  const [quotationSaving, setQuotationSaving] = useState(false);
  const router = useRouter();
  const [viewMode, setViewMode] = useState(() =>
    searchParams.get('view') === 'kanban' ? 'kanban' : 'table'
  );
  const [sortField, setSortField] = useState('receivedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [savedViews, setSavedViews] = useState([]);
  const [userRole, setUserRole] = useState('member');

  useEffect(() => {
    if (searchParams.get('view') === 'kanban') setViewMode('kanban');
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_KEY);
      if (raw) setSavedViews(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setUserRole((localStorage.getItem('userRole') || 'member').toLowerCase());
  }, []);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await authFetch('/api/automation/team');
      const data = await res.json();
      if (data.success) setTeamMembers(data.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchLeads = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const qs = buildLeadsQuery({
        ...filters,
        status: filters.status === 'all' ? '' : filters.status,
        kanban: viewMode === 'kanban',
      });

      const res = await authFetch(`/api/automation/leads?${qs}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setLeads(data.data || []);
      setPagination(data.pagination || { total: data.data?.length || 0, page: 1, limit: 50, pages: 1 });
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to load leads');
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, viewMode]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Real-time refresh — when a new lead lands (webhook, form, ad) or an
  // existing lead updates (status change, message received, tag added), the
  // Leads workspace was refreshing only on manual page reload. Now we
  // subscribe to Redis-backed events and silently refetch the list so the
  // grid stays fresh without a full loading spinner.
  useRealtime({
    onEvent: useCallback((event) => {
      if (
        event.type === REALTIME_EVENTS.LEAD_UPDATED ||
        event.type === REALTIME_EVENTS.LEAD_ASSIGNED ||
        event.type === REALTIME_EVENTS.CHAT_MESSAGE
      ) {
        // silent = true → no loading spinner flash, just swap the data in
        fetchLeads(true);
      }
    }, [fetchLeads]),
  });

  const sourceStats = useMemo(() => aggregateSourceStats(leads), [leads]);

  const enrichedLeads = useMemo(
    () => leads.map((lead) => computeLeadIntelligence(lead, leads, sourceStats[lead.source])),
    [leads, sourceStats]
  );

  const sortedLeads = useMemo(() => {
    const copy = [...enrichedLeads];
    copy.sort((a, b) => {
      let aVal;
      let bVal;

      switch (sortField) {
        case 'score':
          aVal = a.intelligence?.engagementScore?.score ?? 0;
          bVal = b.intelligence?.engagementScore?.score ?? 0;
          break;
        case 'lastActivity':
          aVal = new Date(a.lastContactedAt || a.updatedAt || a.receivedAt).getTime();
          bVal = new Date(b.lastContactedAt || b.updatedAt || b.receivedAt).getTime();
          break;
        case 'nextFollowUp':
          aVal = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : 0;
          bVal = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : 0;
          break;
        case 'assignedTo':
          aVal = a.assignedTo?.email || '';
          bVal = b.assignedTo?.email || '';
          break;
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        default:
          aVal = a[sortField];
          bVal = b[sortField];
          if (sortField === 'receivedAt') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
          }
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [enrichedLeads, sortField, sortDir]);


  const updateFilter = useCallback((patch) => {
    if ('search' in patch) setSearchInput(patch.search);
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
    setSelectedIds([]);
  }, []);

  const toggleSort = useCallback((field) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return field;
    });
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === sortedLeads.length ? [] : sortedLeads.map((l) => l._id)
    );
  }, [sortedLeads]);

  const saveCurrentView = useCallback(
    (name) => {
      const view = { id: Date.now().toString(), name, filters: { ...filters } };
      const next = [...savedViews, view];
      setSavedViews(next);
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
      toast.success(`Saved view "${name}"`);
    },
    [filters, savedViews]
  );

  const applySavedView = useCallback((view) => {
    setFilters({ ...DEFAULT_FILTERS, ...view.filters });
    toast.success(`Applied "${view.name}"`);
  }, []);

  const beginLeadConvert = useCallback(
    async (leadId) => {
      setConvertLeadId(leadId);
      const fromList = leads.find((l) => l._id === leadId);
      if (fromList) {
        setConvertLeadMeta(fromList);
        return;
      }
      try {
        const res = await authFetch(`/api/automation/leads/${leadId}`);
        const data = await res.json();
        if (data.success) setConvertLeadMeta(data.data);
        else setConvertLeadMeta(null);
      } catch {
        setConvertLeadMeta(null);
      }
    },
    [leads]
  );

  const applyLeadStatusUpdate = useCallback(
    async (leadId, status, extra = {}) => {
      try {
        const userId = getUserId();
        const payload = {
          status,
          performedBy: userId,
        };
        if (extra.lostReason) payload.lostReason = String(extra.lostReason).trim();
        if (extra.unqualifiedReason) payload.unqualifiedReason = String(extra.unqualifiedReason).trim();
        if (extra.note) payload.note = extra.note;
        if (extra.dealAmount != null) payload.dealAmount = extra.dealAmount;
        if (extra.expectedTimeline) payload.expectedTimeline = extra.expectedTimeline;
        if (extra.requirements) payload.requirements = extra.requirements;
        if (extra.decisionMaker) payload.decisionMaker = extra.decisionMaker;
        if (extra.nextFollowUpAt) payload.nextFollowUpAt = extra.nextFollowUpAt;
        const res = await authFetch(`/api/automation/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          const updated = data.data;
          const savedStatus = updated.status || status;
          const statusColor = getStatusRowColor(savedStatus);
          setLeads((prev) =>
            prev.map((l) =>
              l._id === leadId
                ? {
                    ...l,
                    ...updated,
                    status: savedStatus,
                    rowColor: statusColor || l.rowColor,
                    dealAmount: extra.dealAmount ?? l.dealAmount,
                    dealCurrency: l.dealCurrency || 'INR',
                  }
                : l
            )
          );
          toast.success('Stage updated');
          fetchLeads(true);
          return updated;
        }
        if (data.code === 'LOST_REASON_REQUIRED') toast.error('Lost reason is required');
        else toast.error(data.error || 'Update failed');
        return null;
      } catch {
        toast.error('Update failed');
        return null;
      }
    },
    [fetchLeads]
  );

  const updateLeadStatus = useCallback(
    async (leadId, status, options = {}) => {
      if (status === 'converted') {
        await beginLeadConvert(leadId);
        return null;
      }
      const lead = leads.find((l) => l._id === leadId);
      const validation = validateStageTransition(lead?.status, status);
      if (!validation.ok) {
        toast.error(validation.message);
        return null;
      }
      if (status === 'qualified' && options.dealAmount == null) {
        setQualifiedPrompt({ leadId, status, leadName: lead?.name });
        return null;
      }
      const isLost = status === 'lost' || status === 'closed_lost';
      if (isLost && !options.lostReason) {
        setLostPrompt({ leadId, leadName: lead?.name, status: 'lost' });
        return null;
      }
      if (status === 'unqualified' && !options.unqualifiedReason) {
        setLostPrompt({ leadId, leadName: lead?.name, status: 'unqualified' });
        return null;
      }
      return applyLeadStatusUpdate(leadId, status, options);
    },
    [leads, beginLeadConvert, applyLeadStatusUpdate]
  );

  const cancelLostPrompt = useCallback(() => {
    setLostPrompt(null);
  }, []);

  const confirmLostReason = useCallback(
    async ({ reason, comments }) => {
      if (!lostPrompt) return null;
      setLostSaving(true);
      try {
        const targetStatus = lostPrompt.status === 'unqualified' ? 'unqualified' : 'lost';
        const extra =
          lostPrompt.status === 'unqualified'
            ? { unqualifiedReason: reason, note: comments }
            : { lostReason: reason, note: comments };
        const updated = await applyLeadStatusUpdate(lostPrompt.leadId, targetStatus, extra);
        if (updated) setLostPrompt(null);
        return updated;
      } finally {
        setLostSaving(false);
      }
    },
    [lostPrompt, applyLeadStatusUpdate]
  );

  const cancelQualifiedPrompt = useCallback(() => {
    setQualifiedPrompt(null);
  }, []);

  const confirmQualifiedAmount = useCallback(
    async (summary) => {
      if (!qualifiedPrompt) return null;
      setQualifying(true);
      try {
        const updated = await applyLeadStatusUpdate(qualifiedPrompt.leadId, 'qualified', summary);
        if (updated) setQualifiedPrompt(null);
        return updated;
      } finally {
        setQualifying(false);
      }
    },
    [qualifiedPrompt, applyLeadStatusUpdate]
  );

  const cancelDemoPrompt = useCallback(() => setDemoPrompt(null), []);
  const confirmDemoScheduled = useCallback(
    async (meeting) => {
      if (!demoPrompt) return null;
      setDemoSaving(true);
      try {
        const updated = await applyLeadStatusUpdate(demoPrompt.leadId, 'demo_scheduled', meeting);
        if (updated) setDemoPrompt(null);
        return updated;
      } finally {
        setDemoSaving(false);
      }
    },
    [demoPrompt, applyLeadStatusUpdate]
  );

  const cancelQuotationPrompt = useCallback(() => setQuotationPrompt(null), []);
  const confirmQuotationSent = useCallback(
    async (data) => {
      if (!quotationPrompt) return null;
      setQuotationSaving(true);
      try {
        const updated = await applyLeadStatusUpdate(quotationPrompt.leadId, 'quotation_sent', data);
        if (updated) setQuotationPrompt(null);
        return updated;
      } finally {
        setQuotationSaving(false);
      }
    },
    [quotationPrompt, applyLeadStatusUpdate]
  );

  const requestLeadConvert = beginLeadConvert;

  const cancelLeadConvert = useCallback(() => {
    setConvertLeadId(null);
    setConvertLeadMeta(null);
  }, []);

  const convertLead = useCallback(
    async (form, targetLeadId) => {
      const id = targetLeadId || convertLeadId;
      if (!id) return false;
      setConverting(true);
      try {
        const res = await authFetch('/api/automation/leads/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: id,
            dealTitle: form.dealTitle,
            dealAmount: form.dealAmount ? Number(form.dealAmount) : 0,
            companyName: form.companyName || undefined,
            pipelineId: form.pipelineId,
            dealStage: form.dealStage || 'discovery',
            expectedCloseDate: form.expectedCloseDate || undefined,
            assignedTo: form.assignedTo,
            archiveLead: form.archiveLead !== false,
            createDeal: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Lead converted — contact and deal created');
          window.dispatchEvent(new CustomEvent('lfg-crm-refresh'));
          setConvertLeadId(null);
          setConvertLeadMeta(null);
          setDrawerLeadId(null);
          await fetchLeads(true);
          const dealId = data.data?.dealId || data.data?.deal?._id;
          if (dealId) router.push(`/automation/deals/${dealId}`);
          return true;
        }
        toast.error(data.error || 'Conversion failed');
        return false;
      } catch {
        toast.error('Conversion failed');
        return false;
      } finally {
        setConverting(false);
      }
    },
    [convertLeadId, fetchLeads, router]
  );

  const assignLead = useCallback(
    async (leadId, assigneeId) => {
      try {
        const userId = getUserId();
        const res = await authFetch(`/api/automation/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: assigneeId, performedBy: userId })
        });
        const data = await res.json();
        if (data.success) {
          const updated = data.data;
          setLeads((prev) =>
            prev.map((l) => (l._id === leadId ? { ...l, ...updated, assignedTo: updated.assignedTo } : l))
          );
          toast.success('Lead assigned');
          fetchLeads(true);
          return updated;
        }
        toast.error('Assign failed');
        return null;
      } catch {
        toast.error('Assign failed');
        return null;
      }
    },
    [fetchLeads]
  );

  const updateLeadRowColor = useCallback(
    async (leadId, rowColor) => {
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, rowColor: rowColor || null } : l))
      );
      try {
        const userId = getUserId();
        const res = await authFetch(`/api/automation/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowColor: rowColor || null, performedBy: userId })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(rowColor ? 'Row color updated' : 'Row color cleared');
        } else {
          toast.error(data.error || 'Color update failed');
          fetchLeads(true);
        }
      } catch {
        toast.error('Color update failed');
        fetchLeads(true);
      }
    },
    [fetchLeads]
  );

  const bulkUpdateRowColor = useCallback(
    async (rowColor) => {
      if (!selectedIds.length) return;
      setLeads((prev) =>
        prev.map((l) => (selectedIds.includes(l._id) ? { ...l, rowColor: rowColor || null } : l))
      );
      const userId = getUserId();
      let ok = 0;
      for (const id of selectedIds) {
        const res = await authFetch(`/api/automation/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowColor: rowColor || null, performedBy: userId })
        });
        if (res.ok) ok++;
      }
      toast.success(rowColor ? `Color applied to ${ok} lead(s)` : `Color cleared on ${ok} lead(s)`);
      setSelectedIds([]);
    },
    [selectedIds]
  );

  const bulkAssign = useCallback(
    async (assigneeId) => {
      const userId = getUserId();
      let ok = 0;
      for (const id of selectedIds) {
        const res = await authFetch(`/api/automation/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: assigneeId, performedBy: userId })
        });
        if (res.ok) ok++;
      }
      toast.success(`Assigned ${ok} lead(s)`);
      setSelectedIds([]);
      fetchLeads(true);
    },
    [selectedIds, fetchLeads]
  );

  const bulkDelete = useCallback(async () => {
    if (!(await confirm({ title: 'Delete leads', message: `Delete ${selectedIds.length} leads permanently?`, confirmLabel: 'Delete', danger: true }))) return;
    let ok = 0;
    for (const id of selectedIds) {
      const res = await authFetch(`/api/automation/leads/${id}`, { method: 'DELETE' });
      if (res.ok) ok++;
    }
    toast.success(`Deleted ${ok} lead(s)`);
    setSelectedIds([]);
    fetchLeads(true);
  }, [selectedIds, fetchLeads, confirm]);

  const exportLeads = useCallback(
    async (format) => {
      const endpoint = format === 'pdf' ? '/api/automation/leads/export/pdf' : '/api/automation/leads/export/excel';
      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: selectedIds.length ? sortedLeads.filter((l) => selectedIds.includes(l._id)) : sortedLeads,
          filter: filters.status
        })
      });
      if (!res.ok) {
        toast.error('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    },
    [sortedLeads, selectedIds, filters.status]
  );

  const initiateCall = useCallback(async (lead) => {
    if (!lead.phone) {
      toast.error('No phone number');
      return;
    }
    try {
      const res = await authFetch('/api/automation/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          businessId: localStorage.getItem('businessId'),
          leadId: lead._id,
          leadPhone: lead.phone
        })
      });
      const result = await res.json();
      if (result.success) {
        window.dispatchEvent(new CustomEvent('lfg-initiate-call', { detail: result.data }));
      } else {
        window.location.href = `tel:${lead.phone}`;
      }
    } catch {
      window.location.href = `tel:${lead.phone}`;
    }
  }, []);

  return {
    filters,
    updateFilter,
    leads: sortedLeads,
    pagination,
    loading,
    refreshing,
    error,
    teamMembers,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    drawerLeadId,
    setDrawerLeadId,
    convertLeadId,
    convertLeadMeta,
    converting,
    requestLeadConvert,
    cancelLeadConvert,
    convertLead,
    viewMode,
    setViewMode,
    sortField,
    sortDir,
    toggleSort,
    savedViews,
    saveCurrentView,
    applySavedView,
    userRole,
    searchInput,
    setSearchInput,
    refresh: () => fetchLeads(true),
    updateLeadStatus,
    assignLead,
    qualifiedPrompt,
    qualifying,
    confirmQualifiedAmount,
    cancelQualifiedPrompt,
    lostPrompt,
    lostSaving,
    confirmLostReason,
    cancelLostPrompt,
    demoPrompt,
    demoSaving,
    confirmDemoScheduled,
    cancelDemoPrompt,
    quotationPrompt,
    quotationSaving,
    confirmQuotationSent,
    cancelQuotationPrompt,
    updateLeadRowColor,
    bulkUpdateRowColor,
    bulkAssign,
    bulkDelete,
    exportLeads,
    initiateCall
  };
}
