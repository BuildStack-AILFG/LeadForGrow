'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch, getUserId } from '@/lib/apiClient';

const EMPTY_TASK = {
  leadId: '',
  type: 'call',
  title: '',
  description: '',
  dueDate: '',
  assignedTo: '',
  autoSend: false,
  messageContent: ''
};

export function useTasksWorkspace() {
  const searchParams = useSearchParams();
  const initialLeadId = useRef(searchParams.get('leadId'));
  const initialFilter = searchParams.get('filter') || 'today';

  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ today: 0, overdue: 0, upcoming: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [newTask, setNewTask] = useState({ ...EMPTY_TASK, leadId: initialLeadId.current || '' });

  const fetchTasks = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');
      const res = await authFetch(`/api/automation/tasks?filter=${filter}`);
      const data = await res.json();
      if (data.success) setTasks(data.data || []);
      else setError(data.error || 'Failed to load tasks');
    } catch {
      setError('Failed to load tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  const fetchCounts = useCallback(async () => {
    try {
      const [today, overdue, upcoming, all] = await Promise.all(
        ['today', 'overdue', 'upcoming', 'all'].map(async (f) => {
          const res = await authFetch(`/api/automation/tasks?filter=${f}`);
          const data = await res.json();
          return data.success ? (data.data?.length || 0) : 0;
        })
      );
      setCounts({ today, overdue, upcoming, all });
    } catch {
      /* non-critical */
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    const res = await authFetch('/api/automation/leads?limit=200');
    const data = await res.json();
    if (data.success) setLeads(data.data || []);
  }, []);

  const fetchTeam = useCallback(async () => {
    const res = await authFetch('/api/automation/team');
    const data = await res.json();
    if (data.success) {
      setTeamMembers(
        data.data
          .map((m) => ({
            _id: m.userId?._id,
            firstName: m.userId?.firstName || 'Team',
            lastName: m.userId?.lastName || '',
            email: m.userId?.email
          }))
          .filter((m) => m._id)
      );
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Counts refresh on filter change and via explicit refresh()/markDone() —
  // depending on `tasks` here would trigger 4 API calls on every list mutation
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, filter]);

  useEffect(() => {
    if (showCreateModal) {
      fetchLeads();
      fetchTeam();
      setNewTask((prev) => ({
        ...prev,
        assignedTo: prev.assignedTo || localStorage.getItem('userid') || ''
      }));
    }
  }, [showCreateModal, fetchLeads, fetchTeam]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchTasks(true), fetchCounts()]);
  }, [fetchTasks, fetchCounts]);

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      const lead = t.leadId;
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        lead?.name?.toLowerCase().includes(q) ||
        lead?.phone?.includes(q)
      );
    });
  }, [tasks, search]);

  const markDone = useCallback(async (taskId, silent = false) => {
    try {
      const userId = getUserId();
      const res = await authFetch(`/api/automation/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', performedBy: userId }),
      });
      const data = await res.json();
      if (data.success) {
        if (!silent) toast.success('Task completed');
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        fetchCounts();
      }
    } catch {
      toast.error('Failed to update task');
    }
  }, [fetchCounts]);

  const openReschedule = useCallback((task) => {
    setSelectedTask(task);
    setRescheduleDate(
      `${new Date(task.dueDate).getFullYear()}-${String(new Date(task.dueDate).getMonth() + 1).padStart(2, '0')}-${String(new Date(task.dueDate).getDate()).padStart(2, '0')}T${String(new Date(task.dueDate).getHours()).padStart(2, '0')}:${String(new Date(task.dueDate).getMinutes()).padStart(2, '0')}`
    );
    setShowRescheduleModal(true);
  }, []);

  const rescheduleTask = useCallback(async (dueDate) => {
    if (!selectedTask) return;
    try {
      const res = await authFetch(`/api/automation/tasks/${selectedTask._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task rescheduled');
        setShowRescheduleModal(false);
        setSelectedTask(null);
        refresh();
      }
    } catch {
      toast.error('Failed to reschedule');
    }
  }, [selectedTask, refresh]);

  const [savingTask, setSavingTask] = useState(false);

  const createTask = useCallback(async (payload) => {
    // Guards against a fast double-click double-submitting before the modal closes —
    // there was previously no in-flight guard here (or on the modal's submit button),
    // so two rapid clicks created two Task documents.
    if (savingTask) return;
    setSavingTask(true);
    try {
      const res = await authFetch('/api/automation/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task created');
        setShowCreateModal(false);
        setNewTask({ ...EMPTY_TASK });
        refresh();
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSavingTask(false);
    }
  }, [refresh, savingTask]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      const res = await authFetch(`/api/automation/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Task deleted');
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        fetchCounts();
      } else {
        toast.error(data.error || 'Failed to delete task');
      }
    } catch {
      toast.error('Failed to delete task');
    }
  }, [fetchCounts]);

  const handleCommunication = useCallback(
    (task, channel) => {
      const lead = task.leadId;
      if (!lead) {
        toast.error('Lead record missing');
        return;
      }
      let url = '';
      if (channel === 'call') url = `tel:${lead.phone}`;
      if (channel === 'whatsapp') url = `https://wa.me/${lead.phone?.replace(/\D/g, '')}`;
      if (channel === 'email') url = `mailto:${lead.email}`;
      if (url) {
        window.open(url, '_blank');
        markDone(task._id, true);
      }
    },
    [markDone]
  );

  return {
    tasks: filteredTasks,
    total: filteredTasks.length,
    counts,
    loading,
    refreshing,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    leads,
    teamMembers,
    showCreateModal,
    setShowCreateModal,
    showRescheduleModal,
    setShowRescheduleModal,
    selectedTask,
    rescheduleDate,
    setRescheduleDate,
    newTask,
    setNewTask,
    refresh,
    markDone,
    openReschedule,
    rescheduleTask,
    createTask,
    savingTask,
    deleteTask,
    handleCommunication
  };
}
