'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';
import { DEFAULT_WELCOME, DEFAULT_FOLLOWUP, newManualTemplate } from '../components/templates/constants';

export function useTemplates() {
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');

  const [welcomeTemplate, setWelcomeTemplate] = useState(DEFAULT_WELCOME);
  const [followUpTemplate, setFollowUpTemplate] = useState(DEFAULT_FOLLOWUP);
  const [manualTemplates, setManualTemplates] = useState([]);
  const [deleteIds, setDeleteIds] = useState([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const stats = useMemo(() => {
    const whatsapp = manualTemplates.filter((t) => t.channel === 'whatsapp').length;
    const email = manualTemplates.filter((t) => t.channel === 'email').length;
    const meta = manualTemplates.filter((t) => t.isMetaTemplate).length;
    const autoActive = (welcomeTemplate.enabled ? 1 : 0) + (followUpTemplate.enabled ? 1 : 0);
    return { total: manualTemplates.length, whatsapp, email, meta, autoActive };
  }, [manualTemplates, welcomeTemplate.enabled, followUpTemplate.enabled]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return manualTemplates;
    return manualTemplates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
    );
  }, [manualTemplates, searchQuery]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/automation/templates');
      const data = await res.json();
      if (data.success) {
        if (data.welcome) setWelcomeTemplate(data.welcome);
        if (data.followUp) setFollowUpTemplate(data.followUp);
        if (data.manual) setManualTemplates(data.manual);
      }
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcome: welcomeTemplate,
          followUp: followUpTemplate,
          manual: manualTemplates,
          deleteManualIds: deleteIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Templates saved');
        setDeleteIds([]);
        await fetchData();
        return true;
      }
      toast.error(data.error || 'Failed to save');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [welcomeTemplate, followUpTemplate, manualTemplates, deleteIds, fetchData]);

  const syncMeta = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await authFetch('/api/automation/templates/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Meta templates synced');
        await fetchData();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [fetchData]);

  const openCreate = useCallback(() => {
    const t = newManualTemplate();
    setEditingTemplate(t);
    setEditingIndex(null);
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((template) => {
    setEditingTemplate({ ...template });
    setEditingIndex(manualTemplates.findIndex((t) => (t.id && t.id === template.id) || t === template));
    setEditorOpen(true);
  }, [manualTemplates]);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingTemplate(null);
    setEditingIndex(null);
  }, []);

  const saveEditor = useCallback((template) => {
    if (editingIndex != null && editingIndex >= 0) {
      setManualTemplates((prev) => prev.map((t, i) => (i === editingIndex ? template : t)));
    } else {
      setManualTemplates((prev) => [template, ...prev]);
    }
    closeEditor();
    toast.success('Template updated — click Save to persist');
  }, [editingIndex, closeEditor]);

  const deleteTemplate = useCallback(async (template) => {
    if (!(await confirm({ title: 'Delete template', message: `Delete "${template.name}"?`, confirmLabel: 'Delete', danger: true }))) return;
    const index = manualTemplates.findIndex((t) => (t.id && t.id === template.id) || t === template);
    if (template.id) {
      try {
        const res = await authFetch('/api/automation/templates/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: template.id }),
        });
        const data = await res.json();
        if (!data.success) {
          toast.error('Delete failed');
          return;
        }
      } catch {
        toast.error('Delete failed');
        return;
      }
    }
    if (index >= 0) {
      setManualTemplates((prev) => prev.filter((_, i) => i !== index));
    }
    if (editingTemplate && ((editingTemplate.id && editingTemplate.id === template.id) || editingTemplate === template)) {
      closeEditor();
    }
    toast.success('Template deleted');
    await fetchData();
  }, [manualTemplates, editingTemplate, closeEditor, fetchData, confirm]);

  const copyToken = useCallback((token) => {
    navigator.clipboard.writeText(token);
    toast.success('Copied to clipboard');
  }, []);

  return {
    loading, saving, syncing, activeTab, setActiveTab,
    searchQuery, setSearchQuery, stats, filteredTemplates,
    welcomeTemplate, setWelcomeTemplate,
    followUpTemplate, setFollowUpTemplate,
    manualTemplates,
    editorOpen, editingTemplate, openCreate, openEdit, closeEditor, saveEditor,
    saveAll, syncMeta, deleteTemplate, copyToken, refresh: fetchData,
  };
}
