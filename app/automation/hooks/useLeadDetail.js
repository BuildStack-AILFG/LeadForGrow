'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';
import { computeLeadIntelligence } from '@/lib/leadIntelligence';
import { validateStageTransition } from '@/lib/crm/leadStages';
import { useConfirm } from '@/app/components/ConfirmProvider';

export function useLeadDetail(leadId) {
  const confirm = useConfirm();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lostPrompt, setLostPrompt] = useState(null);
  const [lostSaving, setLostSaving] = useState(false);
  const [qualifiedPrompt, setQualifiedPrompt] = useState(false);
  const [qualifying, setQualifying] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!leadId) return;
    const res = await authFetch(`/api/automation/leads/${leadId}`);
    const data = await res.json();
    if (data.success) setLead(data.data);
    return data;
  }, [leadId]);

  const fetchTasks = useCallback(async () => {
    if (!leadId) return;
    const res = await authFetch(`/api/automation/tasks?leadId=${leadId}`);
    const data = await res.json();
    if (data.success) setTasks(data.data);
  }, [leadId]);

  const fetchTeam = useCallback(async () => {
    const res = await authFetch('/api/automation/team');
    const data = await res.json();
    if (data.success) setTeamMembers(data.data);
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await authFetch('/api/automation/templates');
    const data = await res.json();
    if (data.success) setTemplates(data.manual || []);
  }, []);

  useEffect(() => {
    async function load() {
      if (!getUserId()) {
        router.push('/user/register');
        return;
      }
      setLoading(true);
      const data = await fetchLead();
      if (!data?.success) toast.error('Failed to load lead');
      await Promise.all([fetchTasks(), fetchTeam(), fetchTemplates()]);
      setLoading(false);
    }
    load();
  }, [leadId, fetchLead, fetchTasks, fetchTeam, fetchTemplates, router]);

  const intelligence = useMemo(
    () => (lead ? computeLeadIntelligence(lead).intelligence : null),
    [lead]
  );

  const refresh = useCallback(async () => {
    await Promise.all([fetchLead(), fetchTasks()]);
  }, [fetchLead, fetchTasks]);

  const applyStatusUpdate = useCallback(
    async (status, extra = {}) => {
      setUpdating(true);
      try {
        const userId = getUserId();
        const payload = { status, performedBy: userId };
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
          setLead(data.data);
          toast.success('Stage updated');
          await fetchTasks();
          return data.data;
        }
        if (data.code === 'LOST_REASON_REQUIRED') toast.error('Lost reason is required');
        else toast.error(data.error || 'Update failed');
        return null;
      } catch {
        toast.error('Update failed');
        return null;
      } finally {
        setUpdating(false);
      }
    },
    [leadId, fetchTasks]
  );

  const updateStatus = useCallback(
    async (status, options = {}) => {
      const validation = validateStageTransition(lead?.status, status);
      if (!validation.ok) {
        toast.error(validation.message);
        return null;
      }
      if (status === 'qualified' && options.dealAmount == null) {
        setQualifiedPrompt(true);
        return null;
      }
      const isLost = status === 'lost' || status === 'closed_lost';
      if (isLost && !options.lostReason) {
        setLostPrompt({ status: 'lost' });
        return null;
      }
      if (status === 'unqualified' && !options.unqualifiedReason) {
        setLostPrompt({ status: 'unqualified' });
        return null;
      }
      return applyStatusUpdate(status, options);
    },
    [lead?.status, applyStatusUpdate]
  );

  const cancelLostPrompt = useCallback(() => setLostPrompt(null), []);

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
        const updated = await applyStatusUpdate(targetStatus, extra);
        if (updated) setLostPrompt(null);
        return updated;
      } finally {
        setLostSaving(false);
      }
    },
    [lostPrompt, applyStatusUpdate]
  );

  const cancelQualifiedPrompt = useCallback(() => setQualifiedPrompt(false), []);

  const confirmQualifiedAmount = useCallback(
    async (summary) => {
      setQualifying(true);
      try {
        const updated = await applyStatusUpdate('qualified', summary);
        if (updated) setQualifiedPrompt(false);
        return updated;
      } finally {
        setQualifying(false);
      }
    },
    [applyStatusUpdate]
  );

  const assignLead = useCallback(
    async (assigneeId) => {
      setUpdating(true);
      try {
        const userId = getUserId();
        const res = await authFetch(`/api/automation/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedTo: assigneeId || null,
            performedBy: userId,
            showHistory
          })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Lead assigned');
          await refresh();
        } else toast.error('Assign failed');
      } catch {
        toast.error('Assign failed');
      } finally {
        setUpdating(false);
      }
    },
    [leadId, showHistory, refresh]
  );

  const addNote = useCallback(
    async (text) => {
      if (!text.trim()) return;
      setUpdating(true);
      try {
        const userId = getUserId();
        const res = await authFetch(`/api/automation/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: text.trim(), performedBy: userId })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Note added');
          await fetchLead();
        }
      } catch {
        toast.error('Failed to add note');
      } finally {
        setUpdating(false);
      }
    },
    [leadId, fetchLead]
  );

  const createTask = useCallback(
    async (task) => {
      const res = await authFetch('/api/automation/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, leadId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task created');
        await refresh();
        return true;
      }
      toast.error('Failed to create task');
      return false;
    },
    [leadId, refresh]
  );

  const completeTask = useCallback(
    async (taskId) => {
      const userId = getUserId();
      const res = await authFetch(`/api/automation/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', performedBy: userId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task completed');
        await refresh();
      }
    },
    [refresh]
  );

  const sendWhatsApp = useCallback(
    async (message) => {
      const res = await authFetch('/api/automation/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, message })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Message sent');
        await fetchLead();
        return true;
      }
      toast.error(data.error || 'Send failed');
      return false;
    },
    [leadId, fetchLead]
  );

  const initiateCall = useCallback(async () => {
    if (!lead?.phone) {
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
  }, [lead]);

  const openWhatsApp = useCallback(
    (customMessage = '') => {
      if (!lead?.phone) {
        toast.error('No phone number');
        return;
      }
      const phone = lead.phone.replace(/\D/g, '');
      const url = customMessage
        ? `https://wa.me/${phone}?text=${encodeURIComponent(customMessage)}`
        : `https://wa.me/${phone}`;
      window.open(url, '_blank');
      if (lead.status === 'new') updateStatus('contacted');
    },
    [lead, updateStatus]
  );

  const renderTemplate = useCallback(
    (body) => {
      if (!body || !lead) return '';
      return body.replace(/\{\{(.*?)\}\}/g, (match, field) => {
        const key = field.trim();
        if (key === 'name') return lead.name;
        if (key === 'serviceInterest') return lead.serviceInterest || 'our services';
        return match;
      });
    },
    [lead]
  );

  const deleteLead = useCallback(async () => {
    if (!(await confirm({ title: 'Delete lead', message: 'Permanently delete this lead and all history?', confirmLabel: 'Delete', danger: true }))) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/automation/leads/${leadId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Lead deleted');
        router.push('/automation/leads');
      } else toast.error(data.error || 'Delete failed');
    } catch {
      toast.error('Delete failed');
    } finally {
      setUpdating(false);
    }
  }, [leadId, router, confirm]);

  const convertLead = useCallback(
    async (form) => {
      setUpdating(true);
      try {
        const res = await authFetch('/api/automation/leads/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            dealTitle: form.dealTitle,
            dealAmount: form.dealAmount ? Number(form.dealAmount) : 0,
            pipelineId: form.pipelineId,
            dealStage: form.dealStage,
            expectedCloseDate: form.expectedCloseDate || undefined,
            assignedTo: form.assignedTo,
            createDeal: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Lead converted — contact and deal created');
          window.dispatchEvent(new CustomEvent('lfg-crm-refresh'));
          await refresh();
          const dealId = data.data?.dealId || data.data?.deal?._id;
          if (dealId) {
            router.push(`/automation/deals/${dealId}`);
          }
          return true;
        }
        toast.error(data.error || 'Conversion failed');
        return false;
      } catch {
        toast.error('Conversion failed');
        return false;
      } finally {
        setUpdating(false);
      }
    },
    [leadId, refresh, router]
  );

  return {
    lead,
    tasks,
    teamMembers,
    templates,
    intelligence,
    loading,
    updating,
    showHistory,
    setShowHistory,
    refresh,
    updateStatus,
    assignLead,
    lostPrompt,
    lostSaving,
    confirmLostReason,
    cancelLostPrompt,
    qualifiedPrompt,
    qualifying,
    confirmQualifiedAmount,
    cancelQualifiedPrompt,
    addNote,
    createTask,
    completeTask,
    sendWhatsApp,
    initiateCall,
    openWhatsApp,
    renderTemplate,
    deleteLead,
    convertLead,
  };
}
