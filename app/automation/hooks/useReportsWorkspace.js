'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import {
  buildInsights,
  buildKPIs,
  computeFollowUpStats,
  computeTrend,
  computeWhatsAppStats,
  filterSources,
  filterStatusCounts
} from '../components/reports/utils';
import { SAVED_VIEWS_KEY } from '../components/reports/constants';

export function useReportsWorkspace() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [reports, setReports] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [taskStats, setTaskStats] = useState({ overdue: 0, today: 0, upcoming: 0, completed: 0 });
  const [teamMembers, setTeamMembers] = useState([]);
  const [savedViews, setSavedViews] = useState([]);

  useEffect(() => {
    const role = (localStorage.getItem('userRole') || 'member').toLowerCase();
    if (!role.includes('owner') && !role.includes('admin')) {
      router.push('/automation/leads');
    }
    try {
      const saved = localStorage.getItem(SAVED_VIEWS_KEY);
      if (saved) setSavedViews(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, [router]);

  const fetchAll = useCallback(async (silent = false) => {
    if (!localStorage.getItem('userToken') && !localStorage.getItem('token')) {
      setError('Not signed in');
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [reportsRes, metricsRes, activitiesRes, convRes, overdueRes, todayRes, upcomingRes, teamRes] =
        await Promise.all([
          authFetch(`/api/automation/reports?period=${period}`),
          authFetch('/api/business/revenue-metric'),
          authFetch('/api/automation/activities?limit=15'),
          authFetch('/api/automation/chat/conversations?status=&search=').catch(() => null),
          authFetch('/api/automation/tasks?filter=overdue'),
          authFetch('/api/automation/tasks?filter=today'),
          authFetch('/api/automation/tasks?filter=upcoming'),
          authFetch('/api/automation/team'),
        ]);

      const [reportsJson, metricsJson, activitiesJson, overdueJson, todayJson, upcomingJson, teamJson] =
        await Promise.all([
          reportsRes.json(),
          metricsRes.json(),
          activitiesRes.json(),
          overdueRes.json(),
          todayRes.json(),
          upcomingRes.json(),
          teamRes.json()
        ]);

      if (reportsJson.success) setReports(reportsJson.data);
      else throw new Error(reportsJson.error || 'Failed to load reports');

      setMetrics(metricsJson.success ? metricsJson.data : null);
      setActivities(activitiesJson.success ? activitiesJson.data : []);

      if (convRes?.ok) {
        const convJson = await convRes.json();
        if (convJson.success) setConversations(convJson.data || []);
      }

      setTaskStats({
        overdue: overdueJson.success ? overdueJson.data?.length || 0 : 0,
        today: todayJson.success ? todayJson.data?.length || 0 : 0,
        upcoming: upcomingJson.success ? upcomingJson.data?.length || 0 : 0,
        completed: 0
      });

      if (teamJson.success) {
        setTeamMembers(
          teamJson.data
            .map((m) => ({
              _id: m.userId?._id,
              name: [m.userId?.firstName, m.userId?.lastName].filter(Boolean).join(' ') || m.userId?.email
            }))
            .filter((m) => m._id)
        );
      }

      setError(null);
    } catch (err) {
      console.error('[Reports]', err);
      setError(err.message || 'Failed to load analytics');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const trend = useMemo(() => computeTrend(reports?.dailyTrends), [reports]);

  const whatsapp = useMemo(() => computeWhatsAppStats(conversations), [conversations]);
  const followUp = useMemo(() => computeFollowUpStats(taskStats), [taskStats]);

  const kpis = useMemo(
    () => buildKPIs({ reports, metrics, whatsapp, followUp, teamPerformance: reports?.teamPerformance, trend }),
    [reports, metrics, whatsapp, followUp, trend]
  );

  const insights = useMemo(
    () => buildInsights({ reports, metrics, teamPerformance: reports?.teamPerformance, whatsapp, followUp, trend }),
    [reports, metrics, whatsapp, followUp, trend]
  );

  const filteredSources = useMemo(
    () => filterSources(reports?.leadsBySource || [], sourceFilter),
    [reports, sourceFilter]
  );

  const filteredStatusCounts = useMemo(
    () => filterStatusCounts(reports?.statusCounts || {}, stageFilter),
    [reports, stageFilter]
  );

  const filteredTeam = useMemo(() => {
    let list = reports?.teamPerformance || [];
    if (assigneeFilter !== 'all') {
      list = list.filter((m) => m._id === assigneeFilter || m.email === assigneeFilter);
    }
    return list;
  }, [reports, assigneeFilter]);

  const saveCurrentView = useCallback(() => {
    const name = `View ${savedViews.length + 1}`;
    const view = { id: Date.now().toString(), name, period, sourceFilter, stageFilter, assigneeFilter };
    const next = [...savedViews, view];
    setSavedViews(next);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
    toast.success('Report view saved');
  }, [savedViews, period, sourceFilter, stageFilter, assigneeFilter]);

  const applySavedView = useCallback((view) => {
    setPeriod(view.period || '30');
    setSourceFilter(view.sourceFilter || 'all');
    setStageFilter(view.stageFilter || 'all');
    setAssigneeFilter(view.assigneeFilter || 'all');
  }, []);

  return {
    loading,
    refreshing,
    error,
    period,
    setPeriod,
    sourceFilter,
    setSourceFilter,
    stageFilter,
    setStageFilter,
    assigneeFilter,
    setAssigneeFilter,
    reports,
    metrics,
    activities,
    conversations,
    whatsapp,
    followUp,
    taskStats,
    teamMembers,
    kpis,
    insights,
    filteredSources,
    filteredStatusCounts,
    filteredTeam,
    trend,
    savedViews,
    saveCurrentView,
    applySavedView,
    refresh: () => fetchAll(true)
  };
}
