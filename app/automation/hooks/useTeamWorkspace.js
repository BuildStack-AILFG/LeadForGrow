'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

const EMPTY_MEMBER = { email: '', firstName: '', lastName: '', phone: '', password: '' };

export function useTeamWorkspace() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignmentStrategy, setAssignmentStrategy] = useState('solo');
  const [team, setTeam] = useState([]);
  const [userPlan, setUserPlan] = useState('free');
  const [maxTeamMembers, setMaxTeamMembers] = useState(1);

  const fetchPlanLimits = useCallback(async () => {
    try {
      const res = await authFetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUserPlan(data.data.plan || 'free');
        setMaxTeamMembers(data.data.quotas?.maxTeamMembers ?? 1);
        localStorage.setItem('userPlan', data.data.plan || 'free');
      }
    } catch { /* ignore */ }
  }, []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ ...EMPTY_MEMBER });
  const [createdMemberInfo, setCreatedMemberInfo] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [settingsRes, teamRes] = await Promise.all([
        authFetch('/api/business/settings'),
        authFetch('/api/automation/team')
      ]);

      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        setAssignmentStrategy(settingsData.data.settings?.assignmentStrategy || 'solo');
      }

      const teamData = await teamRes.json();
      if (teamData.success) setTeam(teamData.data || []);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanLimits();
    fetchData();
  }, [fetchData, fetchPlanLimits]);

  const stats = useMemo(() => {
    const active = team.filter((m) => m.active !== false).length;
    const totalLeads = team.reduce((s, m) => s + (m.metrics?.totalLeadsHandled || 0), 0);
    const owners = team.filter((m) => m.role === 'owner').length;
    return { total: team.length, active, totalLeads, owners };
  }, [team]);

  const saveStrategy = useCallback(async () => {
    try {
      setSaving(true);
      const res = await authFetch('/api/business/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { assignmentStrategy } })
      });
      const data = await res.json();
      if (data.success) toast.success('Assignment strategy saved');
      else toast.error(data.error || 'Failed to save');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [assignmentStrategy]);

  const deleteMember = useCallback(async (memberId) => {
    if (!(await confirm({ title: 'Remove member', message: 'Remove this team member?', confirmLabel: 'Remove', danger: true }))) return;
    try {
      const res = await authFetch(`/api/automation/team?memberId=${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTeam((prev) => prev.filter((m) => m._id !== memberId));
        toast.success('Member removed');
      } else toast.error(data.error || 'Failed to remove');
    } catch {
      toast.error('Error removing member');
    }
  }, [confirm]);

  const addMember = useCallback(async () => {
    if (team.length >= maxTeamMembers) {
      toast.error(`Team limit reached (${maxTeamMembers} members on ${userPlan} plan)`);
      return;
    }
    try {
      setSaving(true);
      const res = await authFetch('/api/automation/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      });
      const data = await res.json();
      if (data.success) {
        setTeam((prev) => [...prev, data.data]);
        setCreatedMemberInfo({
          ...data.data,
          password: data.data.temporaryPassword || newMember.password
        });
        setNewMember({ ...EMPTY_MEMBER });
        toast.success('Team member added');
      } else {
        toast.error(data.error || 'Failed to add member');
      }
    } catch {
      toast.error('Error adding member');
    } finally {
      setSaving(false);
    }
  }, [newMember, team.length, userPlan, maxTeamMembers]);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setCreatedMemberInfo(null);
  }, []);

  return {
    loading,
    saving,
    team,
    stats,
    assignmentStrategy,
    setAssignmentStrategy,
    userPlan,
    maxTeamMembers,
    showAddModal,
    setShowAddModal,
    newMember,
    setNewMember,
    createdMemberInfo,
    saveStrategy,
    deleteMember,
    addMember,
    closeModal,
    refresh: () => fetchData(true),
    refreshing
  };
}
