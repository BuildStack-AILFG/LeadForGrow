'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

export function useSidebar() {
  const confirm = useConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    plan: 'Free',
    workspace: 'Workspace',
    permissions: []
  });
  const [stats, setStats] = useState({
    unreadLeads: 0,
    unreadChats: 0,
    overdueTasks: 0,
    activeAutomations: 0,
    activeEvents: 0
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setMobileOpen(false);
      else {
        const saved = localStorage.getItem('sidebarCollapsed');
        setCollapsed(saved === 'true');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authFetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUserData({
          email: data.data.email || '',
          firstName: data.data.firstName || '',
          lastName: data.data.lastName || '',
          plan: (data.data.plan || 'free').toUpperCase(),
          workspace: data.data.companyName || data.data.workspace || 'Workspace',
          permissions: data.data.permissions || []
        });
        localStorage.setItem('userPlan', data.data.plan);
        localStorage.setItem('businessId', data.data.businessId);
      }
    } catch (err) {
      console.error('[Sidebar] user fetch', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, convRes] = await Promise.all([
        authFetch('/api/automation/sidebar-stats'),
        authFetch('/api/automation/chat/conversations?status=unread&search=').catch(() => null)
      ]);
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats((prev) => ({
          ...prev,
          unreadLeads: statsJson.data.unreadLeads || 0,
          overdueTasks: statsJson.data.overdueTasks || 0,
          activeAutomations: statsJson.data.activeAutomations || 0,
          activeEvents: statsJson.data.activeEvents || 0
        }));
      }
      if (convRes?.ok) {
        const convJson = await convRes.json();
        if (convJson.success) {
          // `c.status` values are open/closed/spam/archived — NOT 'unread'.
          // The correct field is `inboxStatus` (unread/read/intervened).
          // The old filter never matched, so the badge stayed at 0 forever.
          const unread = (convJson.data || []).filter(
            (c) => c.unreadCount > 0 || c.inboxStatus === 'unread'
          ).length;
          setStats((prev) => ({ ...prev, unreadChats: unread }));
        }
      }
    } catch (err) {
      console.error('[Sidebar] stats fetch', err);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchUser, fetchStats]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const logout = useCallback(async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Sign out of LeadForGrow?',
      confirmLabel: 'Sign out',
      danger: true,
    });
    if (!ok) return;
    localStorage.clear();
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/';
  }, [confirm]);

  const userRole = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || 'member') : 'member';
  const displayName =
    [userData.firstName, userData.lastName].filter(Boolean).join(' ') ||
    userData.email?.split('@')[0] ||
    'User';

  return {
    collapsed,
    mobileOpen,
    isMobile,
    userData,
    stats,
    userRole,
    displayName,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
    logout
  };
}
