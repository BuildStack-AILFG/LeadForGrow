'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { authJson } from '@/lib/apiClient';
import toast from 'react-hot-toast';

const EMPTY_DRAFT = {
  title: '',
  description: '',
  category: 'sales_call',
  durationMinutes: 30,
  bookingSlug: '',
  assignmentMode: 'round_robin',
  availabilityRules: {
    timezone: 'Asia/Kolkata',
    workingDays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    bufferAfterMinutes: 15,
    minNoticeHours: 2,
    dailyLimit: 0,
  },
  automationRules: {
    whatsappConfirmation: true,
    whatsappReminder: true,
    emailReminder: true,
    noShowRecovery: true,
    triggerAutomationOnBook: true,
    leadStatusOnBook: 'qualified',
  },
  branding: { accentColor: '#4338ca' },
};

export function useMeetingsWorkspace() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('dashboard');
  // Set while editing an existing meeting type (the wizard then saves with PATCH).
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authJson('/api/automation/meetings?view=dashboard');
      if (res.success) setDashboard(res.data);
    } catch (e) {
      toast.error('Failed to load revenue scheduling');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/automation/meetings') {
      load();
    }
  }, [load, pathname]);

  const startCreate = () => {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT, title: '', bookingSlug: '' });
    setWizardStep(1);
    setMode('create');
  };

  const startEdit = (meetingType) => {
    setEditingId(String(meetingType._id));
    setDraft({
      ...EMPTY_DRAFT,
      ...meetingType,
      availabilityRules: { ...EMPTY_DRAFT.availabilityRules, ...(meetingType.availabilityRules || {}) },
      automationRules: { ...EMPTY_DRAFT.automationRules, ...(meetingType.automationRules || {}) },
    });
    setWizardStep(1);
    setMode('create');
  };

  const publishMeeting = async () => {
    setSaving(true);
    try {
      const slug =
        draft.bookingSlug ||
        draft.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const res = editingId
        ? await authJson(`/api/automation/meetings/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: draft.title,
            description: draft.description,
            category: draft.category,
            durationMinutes: draft.durationMinutes,
            bookingSlug: slug,
            assignmentMode: draft.assignmentMode,
            availabilityRules: draft.availabilityRules,
            automationRules: draft.automationRules,
            branding: draft.branding,
          }),
        })
        : await authJson('/api/automation/meetings', {
          method: 'POST',
          body: JSON.stringify({ ...draft, bookingSlug: slug, status: 'published' }),
        });

      if (res.success) {
        toast.success(editingId ? 'Meeting settings saved' : 'Revenue scheduling link published');
        setEditingId(null);
        setMode('dashboard');
        load();
      } else {
        toast.error(res.error || 'Failed to publish');
      }
    } catch (e) {
      toast.error('Failed to publish meeting');
    } finally {
      setSaving(false);
    }
  };

  const markNoShow = async (bookingId) => {
    try {
      const res = await authJson(`/api/automation/meetings/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'no_show' }),
      });
      if (res.success) {
        toast.success('Marked as no-show');
        load();
      }
    } catch (e) {
      toast.error('Failed to mark no-show');
    }
  };

  const completeBooking = async (bookingId) => {
    try {
      const res = await authJson(`/api/automation/meetings/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.success) {
        toast.success('Meeting marked complete');
        load();
      }
    } catch (e) {
      toast.error('Failed to update booking');
    }
  };

  return {
    loading,
    dashboard,
    mode,
    setMode,
    wizardStep,
    setWizardStep,
    draft,
    setDraft,
    saving,
    startCreate,
    startEdit,
    editingId,
    publishMeeting,
    markNoShow,
    completeBooking,
    refresh: load,
  };
}

export function useMeetingsAnalytics(days = 30) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authJson(`/api/automation/meetings/analytics?days=${days}`);
        if (res.success) setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  return { loading, data };
}

export function useMeetingsTeam() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await authJson('/api/automation/meetings/team');
        if (res.success) setTeam(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { loading, team };
}
